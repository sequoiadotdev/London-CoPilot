using System.Text.Json;
using Backend.Configuration;
using Backend.Models;

namespace Backend.Services;

public sealed class TflService(IHttpClientFactory httpFactory, ApiSettings settings)
{
    private string AuthSuffix =>
        string.IsNullOrWhiteSpace(settings.TflAppId)
            ? $"app_key={settings.TflAppKey}"
            : $"app_id={settings.TflAppId}&app_key={settings.TflAppKey}";

    public async Task<(double TransportScore, MapPin[] NearbyStations, int StepFreeCount, DataSource Source)> GetTransportAsync(
        double lat, double lng, CancellationToken ct = default)
    {
        if (!settings.HasTfl)
            return (0, [], 0, new DataSource("tfl", "TfL Unified API", "error", "TFL_API_KEY not configured"));

        var client = httpFactory.CreateClient("tfl");
        try
        {
            var url = $"StopPoint?lat={lat:F6}&lon={lng:F6}&radius=1000&useStopPointHierarchy=false&returnLines=false&{AuthSuffix}";
            var res = await client.GetAsync(url, ct);

            if (!res.IsSuccessStatusCode)
            {
                var altUrl = $"StopPoint?lat={lat:F6}&lon={lng:F6}&radius=1000&stopTypes=NaptanMetroStation,NaptanRailStation,NaptanPublicBusCoachTram&{AuthSuffix}";
                res = await client.GetAsync(altUrl, ct);
            }

            if (!res.IsSuccessStatusCode)
                return (0, [], 0, new DataSource("tfl", "TfL Unified API", "error", $"HTTP {(int)res.StatusCode}"));

            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            if (!doc.RootElement.TryGetProperty("stopPoints", out var stops))
                return (0, [], 0, new DataSource("tfl", "TfL Unified API", "error", "No stop points in response"));

            var pins = new List<MapPin>();
            var stepFree = 0;

            foreach (var stop in stops.EnumerateArray().Take(8))
            {
                var name = stop.GetProperty("commonName").GetString() ?? "Station";
                var modes = stop.TryGetProperty("modes", out var modesEl)
                    ? string.Join(", ", modesEl.EnumerateArray().Select(m => m.GetString()))
                    : "transit";

                if (stop.TryGetProperty("lat", out var latEl) && stop.TryGetProperty("lon", out var lonEl))
                {
                    var accText = stop.TryGetProperty("accessibilitySummary", out var acc)
                        ? acc.GetString() : null;
                    var accessible = accText is not null &&
                        accText.Contains("step", StringComparison.OrdinalIgnoreCase) &&
                        !accText.Contains("no step", StringComparison.OrdinalIgnoreCase);
                    if (accessible) stepFree++;

                    pins.Add(new MapPin(
                        latEl.GetDouble(),
                        lonEl.GetDouble(),
                        $"{name} ({modes})",
                        modes.Contains("tube", StringComparison.OrdinalIgnoreCase) ? "transit" : "transit"));
                }
            }

            var count = pins.Count;
            var score = count switch
            {
                >= 6 => 9.5,
                >= 4 => 9.0,
                3 => 8.0,
                2 => 7.0,
                1 => 6.0,
                _ => 0
            };

            return (score, pins.ToArray(), stepFree, new DataSource("tfl", "TfL Unified API", "ok"));
        }
        catch (Exception ex)
        {
            return (0, [], 0, new DataSource("tfl", "TfL Unified API", "error", ex.Message));
        }
    }

    public async Task<(List<string> Disruptions, DataSource Source)> GetDisruptionsAsync(CancellationToken ct = default)
    {
        if (!settings.HasTfl)
            return ([], new DataSource("tfl-disruptions", "TfL Disruptions", "error", "TfL keys not configured"));

        var client = httpFactory.CreateClient("tfl");
        try
        {
            var url = $"Line/Mode/tube/Status?{AuthSuffix}";
            var res = await client.GetAsync(url, ct);
            if (!res.IsSuccessStatusCode)
                return ([], new DataSource("tfl-disruptions", "TfL Disruptions", "error", "Request failed"));

            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var disruptions = new List<string>();

            foreach (var line in doc.RootElement.EnumerateArray())
            {
                var name = line.GetProperty("name").GetString() ?? "Line";
                foreach (var status in line.GetProperty("lineStatuses").EnumerateArray())
                {
                    var desc = status.GetProperty("statusSeverityDescription").GetString();
                    if (desc is not null and not "Good Service")
                    {
                        var reason = status.TryGetProperty("reason", out var r) ? r.GetString() : desc;
                        disruptions.Add($"{name}: {reason}");
                    }
                }
            }

            return (disruptions, new DataSource("tfl-disruptions", "TfL Disruptions", "ok"));
        }
        catch (Exception ex)
        {
            return ([], new DataSource("tfl-disruptions", "TfL Disruptions", "error", ex.Message));
        }
    }

    public async Task<(RoutingData? Route, DataSource Source)> PlanJourneyAsync(
        double fromLat, double fromLng,
        double toLat, double toLng,
        string? fromLabel, string? toLabel,
        bool stepFree, bool avoidDisruptions,
        string? rerouteNotice,
        string[]? preferenceLabels = null,
        CancellationToken ct = default)
    {
        if (!settings.HasTfl)
            return (null, new DataSource("tfl", "TfL Journey Planner", "error", "TfL keys not configured"));

        var client = httpFactory.CreateClient("tfl");
        try
        {
            var from = $"{fromLat},{fromLng}";
            var to = $"{toLat},{toLng}";
            var accessibility = stepFree ? "StepFreeToVehicle" : "NoRequirements";
            var url = $"Journey/JourneyResults/{from}/to/{to}?mode=tube,bus,walking&walkingSpeed=Average&accessibilityPreference={accessibility}&{AuthSuffix}";

            var res = await client.GetAsync(url, ct);
            if (!res.IsSuccessStatusCode)
                return (null, new DataSource("tfl", "TfL Journey Planner", "error", $"HTTP {(int)res.StatusCode}"));

            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            if (!doc.RootElement.TryGetProperty("journeys", out var journeys) || journeys.GetArrayLength() == 0)
                return (null, new DataSource("tfl", "TfL Journey Planner", "error", "No routes found"));

            var journey = journeys[0];
            var duration = journey.GetProperty("duration").GetInt32();
            var startDateTime = TryGetString(journey, "startDateTime");
            var arrivalDateTime = TryGetString(journey, "arrivalDateTime");
            var journeyDistance = TryGetRoundedInt(journey, "distance");
            var legs = journey.GetProperty("legs");
            var steps = new List<RouteStep>();
            var polyline = new List<double[]>();
            var legDistanceTotal = 0;

            foreach (var leg in legs.EnumerateArray())
            {
                var mode = leg.GetProperty("mode").GetProperty("id").GetString() ?? "walk";
                var instruction = leg.GetProperty("instruction").GetProperty("summary").GetString() ?? "Continue";
                var legDuration = leg.GetProperty("duration").GetInt32();
                var fromName = leg.TryGetProperty("departurePoint", out var dp) ? dp.GetProperty("commonName").GetString() : null;
                var toName = leg.TryGetProperty("arrivalPoint", out var ap) ? ap.GetProperty("commonName").GetString() : null;
                var departureTime = TryGetString(leg, "departureTime");
                var arrivalTime = TryGetString(leg, "arrivalTime");
                var legDistance = TryGetRoundedInt(leg, "distance");
                if (legDistance is > 0)
                    legDistanceTotal += legDistance.Value;

                string? lineName = null;
                string? direction = null;
                string? routeNumber = null;
                int? stopCount = null;
                if (leg.TryGetProperty("routeOptions", out var routeOpts) && routeOpts.GetArrayLength() > 0)
                {
                    var opt = routeOpts[0];
                    lineName = opt.TryGetProperty("name", out var optName) ? optName.GetString() : null;
                    direction = opt.TryGetProperty("direction", out var optDir) ? optDir.GetString() : null;
                    if (opt.TryGetProperty("directions", out var directions) && directions.ValueKind == JsonValueKind.Array && directions.GetArrayLength() > 0)
                    {
                        direction = directions[0].GetString() ?? direction;
                    }
                    if (opt.TryGetProperty("identifier", out var ident))
                        routeNumber = ident.GetString();
                }

                if (leg.TryGetProperty("numberOfStops", out var stopsEl))
                    stopCount = stopsEl.GetInt32();

                string? departurePlatform = null;
                if (leg.TryGetProperty("departurePoint", out var platformPoint))
                {
                    departurePlatform =
                        TryGetString(platformPoint, "platformName") ??
                        TryGetString(platformPoint, "platform") ??
                        TryGetString(platformPoint, "stopLetter");
                }
                departurePlatform ??= TryGetString(leg, "departurePlatform");

                string? interchangeHint = null;
                if (leg.TryGetProperty("interchangeDuration", out var interchangeDuration) &&
                    interchangeDuration.ValueKind == JsonValueKind.Number)
                {
                    var minutes = interchangeDuration.GetInt32();
                    if (minutes > 0)
                        interchangeHint = $"{minutes} min interchange";
                }

                string? detailedInstruction = null;
                if (leg.TryGetProperty("instruction", out var instr) &&
                    instr.TryGetProperty("detailed", out var detailed))
                {
                    detailedInstruction = detailed.GetString();
                }

                Coordinates? fromCoords = null;
                Coordinates? toCoords = null;
                if (leg.TryGetProperty("departurePoint", out var depPt) &&
                    depPt.TryGetProperty("lat", out var depLat) &&
                    depPt.TryGetProperty("lon", out var depLon))
                {
                    fromCoords = new Coordinates(depLat.GetDouble(), depLon.GetDouble());
                }
                if (leg.TryGetProperty("arrivalPoint", out var arrPt) &&
                    arrPt.TryGetProperty("lat", out var arrLat) &&
                    arrPt.TryGetProperty("lon", out var arrLon))
                {
                    toCoords = new Coordinates(arrLat.GetDouble(), arrLon.GetDouble());
                }

                double[][]? legPolyline = null;
                if (leg.TryGetProperty("path", out var path) && path.TryGetProperty("lineString", out var lineStr))
                {
                    var coords = ParseLineString(lineStr.GetString());
                    if (coords.Count >= 2)
                    {
                        legPolyline = coords.ToArray();
                        polyline.AddRange(coords);
                    }
                }

                steps.Add(new RouteStep(
                    instruction,
                    MapMode(mode),
                    legDuration,
                    fromName,
                    toName,
                    legPolyline,
                    fromCoords,
                    toCoords,
                    lineName,
                    direction,
                    routeNumber,
                    stopCount,
                    detailedInstruction,
                    departureTime,
                    arrivalTime,
                    departurePlatform,
                    interchangeHint,
                    legDistance));
            }

            if (polyline.Count == 0)
            {
                polyline.Add([fromLat, fromLng]);
                polyline.Add([toLat, toLng]);
            }

            var prefs = new List<string>(preferenceLabels ?? []);
            if (stepFree) prefs.Add("step-free");
            if (avoidDisruptions) prefs.Add("avoid disruptions");
            prefs = prefs.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

            var route = new RoutingData(
                Type: "routing",
                Origin: new RoutingEndpoint(fromLat, fromLng, fromLabel),
                Destination: new RoutingEndpoint(toLat, toLng, toLabel),
                DurationMinutes: duration,
                DistanceMeters: journeyDistance ?? (legDistanceTotal > 0 ? legDistanceTotal : duration * 150),
                Polyline: polyline.ToArray(),
                Steps: steps.ToArray(),
                PreferencesApplied: prefs.ToArray(),
                RerouteNotice: rerouteNotice,
                StartDateTime: startDateTime,
                ArrivalDateTime: arrivalDateTime
            );

            return (route, new DataSource("tfl", "TfL Journey Planner", "ok"));
        }
        catch (Exception ex)
        {
            return (null, new DataSource("tfl", "TfL Journey Planner", "error", ex.Message));
        }
    }

    private static string MapMode(string tflMode) => tflMode switch
    {
        "tube" => "tube",
        "bus" => "bus",
        "national-rail" or "overground" or "dlr" => "rail",
        "walking" => "walk",
        "cycle" => "cycle",
        _ => "walk"
    };

    private static string? TryGetString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var property)) return null;
        if (property.ValueKind != JsonValueKind.String) return null;

        var value = property.GetString();
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    private static int? TryGetRoundedInt(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var property)) return null;

        return property.ValueKind switch
        {
            JsonValueKind.Number when property.TryGetInt32(out var value) => value,
            JsonValueKind.Number when property.TryGetDouble(out var value) => (int)Math.Round(value),
            _ => null
        };
    }

    private static List<double[]> ParseLineString(string? lineString)
    {
        var result = new List<double[]>();
        if (string.IsNullOrWhiteSpace(lineString)) return result;

        var normalized = lineString
            .Replace("MULTILINESTRING ((", "", StringComparison.OrdinalIgnoreCase)
            .Replace("MULTILINESTRING(", "", StringComparison.OrdinalIgnoreCase)
            .Replace("LINESTRING (", "", StringComparison.OrdinalIgnoreCase)
            .Replace("LINESTRING(", "", StringComparison.OrdinalIgnoreCase)
            .Replace("((", "")
            .Replace("))", "")
            .Replace(")", "");

        foreach (var segment in normalized.Split("), (", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            foreach (var pair in segment.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                var parts = pair.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2 &&
                    double.TryParse(parts[1], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var lat) &&
                    double.TryParse(parts[0], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var lng))
                {
                    result.Add([lat, lng]);
                }
            }
        }

        return result;
    }
}
