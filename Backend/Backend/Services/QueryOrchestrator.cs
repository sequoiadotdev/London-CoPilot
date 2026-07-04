using System.Text.RegularExpressions;
using Backend.Models;

namespace Backend.Services;

public sealed partial class QueryOrchestrator(
    GeocodingService geocoding,
    CrimeService crime,
    AirQualityService airQuality,
    WeatherService weather,
    TflService tfl,
    OsmService osm,
    PlacesService places,
    LlmSummaryService llm,
    Configuration.ApiSettings settings)
{
    public async Task<QueryResponse> HandleAsync(QueryRequest request, CancellationToken ct = default)
    {
        var intent = IntentDetector.Detect(request.Query);

        return intent switch
        {
            "housing" => await HandleHousingAsync(request, ct),
            "routing" or "routing-reroute" => await HandleRoutingAsync(request, intent == "routing-reroute", ct),
            "activity" => await HandleActivityAsync(request, ct),
            _ => await HandleHousingAsync(request, ct)
        };
    }

    private async Task<QueryResponse> HandleHousingAsync(QueryRequest request, CancellationToken ct)
    {
        var sources = new List<DataSource>();
        var (location, geoSource) = await geocoding.ResolveAsync(request.Query, ct);
        sources.Add(geoSource);

        if (location is null)
        {
            if (request.Location is { } fallback)
            {
                var label = GeocodingService.CleanPlaceQuery(request.Query);
                if (string.IsNullOrWhiteSpace(label) || label.Length < 2)
                    label = "Near you";
                location = new GeocodedLocation(label, fallback.Lat, fallback.Lng);
                sources.Add(new DataSource("nominatim", "Your location", "ok"));
            }
            else
            {
                return MockResponses.Housing with
                {
                    Summary = "Could not find that address. Try a place name (e.g. Shoreditch) or postcode (E8 1AA)."
                };
            }
        }

        var lat = location.Lat;
        var lng = location.Lng;

        var (safetyScore, crimeCount, crimeSource) = await crime.GetSafetyScoreAsync(lat, lng, ct);
        sources.Add(crimeSource);

        var (aqScore, aqi, pm25, aqSource) = await airQuality.GetAirQualityAsync(lat, lng, ct);
        sources.Add(aqSource);

        var (transportScore, stations, stepFreeCount, tflSource) = await tfl.GetTransportAsync(lat, lng, ct);
        sources.Add(tflSource);

        var amenities = await osm.GetAmenitiesAsync(lat, lng, ct);
        sources.Add(amenities.Source);

        var (fsqFoodCount, fsqFoodNames, fsqFoodSource) = await places.CountFoodNearbyAsync(lat, lng, ct);
        sources.Add(fsqFoodSource);

        var (gems, gemsSource) = await places.GetHiddenGemsAsync(lat, lng, ct);
        sources.Add(gemsSource);

        var restaurantCount = Math.Max(amenities.Restaurants, fsqFoodCount);
        var restaurantScore = ScoreRestaurants(restaurantCount);
        var restaurantSource = fsqFoodCount > amenities.Restaurants ? "Foursquare" : "OpenStreetMap";

        var (effectiveTransportScore, transportSummary, transportStations) = ResolveTransport(
            transportScore, stations, tflSource, amenities);

        var insights = BuildHousingInsights(
            effectiveTransportScore, transportSummary, transportStations,
            safetyScore, crimeCount,
            amenities.GreenScore, amenities.Parks,
            aqScore, aqi, pm25,
            restaurantCount, restaurantScore, restaurantSource, fsqFoodNames,
            amenities.SchoolScore, amenities.Schools,
            stepFreeCount, stations.Length,
            amenities.ConstructionSites,
            gems);

        var scores = insights
            .Where(i => i.Score.HasValue)
            .Select(i => new Score(i.Label, i.Score!.Value, i.OutOf ?? 10))
            .ToArray();

        var pins = new List<MapPin> { new(lat, lng, location.Label, "property") };
        pins.AddRange(transportStations);

        var facts = new
        {
            address = location.Label,
            scores,
            crimeCount,
            aqi,
            pm25,
            restaurantCount,
            parkCount = amenities.Parks,
            schoolCount = amenities.Schools,
            constructionSites = amenities.ConstructionSites,
            nearbyStations = transportStations.Select(s => s.Label).ToArray(),
            hiddenGems = gems
        };

        var factsRecord = new HousingFacts(
            CrimeCount: crimeCount,
            Aqi: aqi,
            Pm25: pm25,
            RestaurantCount: restaurantCount,
            ParkCount: amenities.Parks,
            SchoolCount: amenities.Schools,
            ConstructionSites: amenities.ConstructionSites,
            NearbyStations: transportStations.Select(s => s.Label).ToArray(),
            SampleRestaurants: fsqFoodNames,
            HiddenGems: gems,
            StepFreeCount: stepFreeCount,
            StationCount: stations.Length
        );

        var summary = await llm.SummarizeAsync("housing", facts, ct);
        if (settings.HasGemini)
            sources.Add(new DataSource("gemini", $"Gemini ({settings.GeminiModel})", "ok"));

        var status = sources.Any(s => s.Status == "error") ? "partial" : "complete";

        return new QueryResponse(
            Intent: "housing",
            Status: status,
            Summary: summary,
            Data: new HousingData("housing", location.Label, new Coordinates(lat, lng), scores, pins.ToArray(), insights, factsRecord),
            Sources: sources.ToArray()
        );
    }

    private static (double Score, string Summary, MapPin[] Stations) ResolveTransport(
        double tflScore, MapPin[] tflStations, DataSource tflSource, AmenityData amenities)
    {
        if (tflSource.Status == "ok" && tflStations.Length > 0)
        {
            var names = string.Join(", ", tflStations.Take(3).Select(s => s.Label));
            var summary = tflStations.Length >= 4
                ? $"Excellent transport — {tflStations.Length} TfL stops within 1km including {names}."
                : $"Good transport — {tflStations.Length} stop(s) within 1km including {names}.";
            return (tflScore, summary, tflStations);
        }

        var osmCount = amenities.RailStations + amenities.BusStops;
        if (osmCount > 0)
        {
            var score = ScoreOsmTransit(amenities.RailStations, amenities.BusStops);
            var parts = new List<string>();
            if (amenities.RailStations > 0) parts.Add($"{amenities.RailStations} rail station(s)");
            if (amenities.BusStops > 0) parts.Add($"{amenities.BusStops} bus stop(s)");
            var summary = $"OpenStreetMap shows {string.Join(" and ", parts)} within walking distance (TfL lookup unavailable).";
            return (score, summary, []);
        }

        if (tflSource.Status == "error")
            return (0, "Transport data unavailable — TfL API error and no nearby stops found on OpenStreetMap.", []);

        return (3.0, "Limited public transport within walking distance.", []);
    }

    private static double ScoreOsmTransit(int rail, int bus)
    {
        var weighted = rail * 2 + bus;
        return weighted switch
        {
            >= 10 => 8.0,
            >= 6 => 7.0,
            >= 3 => 6.0,
            >= 1 => 5.0,
            _ => 3.0
        };
    }

    private static double ScoreRestaurants(int count) => count switch
    {
        >= 30 => 9.5,
        >= 20 => 9.0,
        >= 10 => 8.0,
        >= 5 => 7.0,
        >= 1 => 6.0,
        _ => 4.0
    };

    private static HousingInsight[] BuildHousingInsights(
        double transportScore, string transportSummary, MapPin[] stations,
        double safetyScore, int crimeCount,
        double greenScore, int parkCount,
        double aqScore, double? aqi, double? pm25,
        int restaurantCount, double restaurantScore, string restaurantSource, string[] sampleRestaurants,
        double schoolScore, int schoolCount,
        int stepFreeCount, int stationCount,
        int constructionSites,
        string[] gems)
    {
        var restaurantText = restaurantCount > 0
            ? $"{restaurantCount} restaurants and cafés within 800m ({restaurantSource})."
            : "No restaurants or cafés found within 800m.";
        if (sampleRestaurants.Length > 0)
            restaurantText += $" Includes {string.Join(", ", sampleRestaurants.Take(3))}.";

        var schoolText = schoolCount > 0
            ? $"{schoolCount} school(s) within 1.5km on OpenStreetMap — check gov.uk/ofsted for ratings."
            : "No schools mapped nearby — check gov.uk for Ofsted ratings in this area.";

        var accessibilityText = stepFreeCount > 0
            ? $"{stepFreeCount} of {stationCount} nearby TfL stop(s) report step-free access."
            : stationCount > 0
                ? "Check TfL for step-free access at your nearest stations — none flagged in this search."
                : "No nearby TfL stops found to assess step-free access.";

        var planningText = constructionSites > 0
            ? $"{constructionSites} active construction site(s) within 500m — possible noise and disruption."
            : "No major construction sites mapped within 500m.";

        var gemsText = gems.Length > 0
            ? $"Nearby picks: {string.Join("; ", gems)}."
            : "Explore local markets, canal paths, and independent shops — ask for a neighbourhood tip.";

        return
        [
            new HousingInsight("tfl", "TfL", "🚇", transportSummary, Math.Round(transportScore, 1), 10),
            new HousingInsight("crime", "Crime", "🚓",
                crimeCount > 120
                    ? "Crime is slightly above average for London. Daytime safety is generally good; take care late at night near busy stations."
                    : "Crime levels are around the London average for this area.",
                Math.Round(safetyScore, 1), 10),
            new HousingInsight("green-space", "Green space", "🌳",
                parkCount > 0
                    ? $"{parkCount} park(s) within 1km — decent access to green space."
                    : "Limited green space within walking distance.",
                Math.Round(greenScore, 1), 10),
            new HousingInsight("air-quality", "Air quality", "🌫",
                aqi.HasValue
                    ? $"Air quality index {aqi:F0} (PM2.5: {pm25?.ToString("F1") ?? "n/a"} µg/m³). {(aqScore >= 7 ? "Generally good." : "Moderate — main roads may be worse.")}"
                    : "Air quality data unavailable for this location.",
                Math.Round(aqScore, 1), 10),
            new HousingInsight("restaurants", "Restaurants", "🍜", restaurantText, Math.Round(restaurantScore, 1), 10),
            new HousingInsight("schools", "Schools", "🏫", schoolText, Math.Round(schoolScore, 1), 10),
            new HousingInsight("accessibility", "Accessibility", "♿", accessibilityText,
                stepFreeCount > 0 ? 8.0 : stationCount > 0 ? 5.0 : null, 10),
            new HousingInsight("planning", "Planning", "🏗", planningText,
                constructionSites > 2 ? 4.0 : constructionSites > 0 ? 6.0 : 8.0, 10),
            new HousingInsight("property-prices", "Property prices", "📈",
                "Live sold-price data requires Land Registry integration — check Rightmove or Zoopla for local asking prices.",
                null, null),
            new HousingInsight("hidden-gems", "Hidden gems", "⭐", gemsText, gems.Length > 0 ? 7.5 : null, 10)
        ];
    }

    private async Task<QueryResponse> HandleRoutingAsync(QueryRequest request, bool isReroute, CancellationToken ct)
    {
        var sources = new List<DataSource>();

        var originLat = request.Location?.Lat ?? 51.5308;
        var originLng = request.Location?.Lng ?? -0.1238;
        var originLabel = request.Location is not null ? "Current location" : "King's Cross area";

        // Default "home" destination — Paddington (in production: user-saved home)
        var destLat = 51.5154;
        var destLng = -0.1755;
        var destLabel = "Home";

        var (disruptions, disruptionSource) = await tfl.GetDisruptionsAsync(ct);
        sources.Add(disruptionSource);

        string? rerouteNotice = null;
        if (isReroute || request.Query.Contains("lift", StringComparison.OrdinalIgnoreCase))
        {
            var liftDisruption = disruptions.FirstOrDefault(d =>
                d.Contains("lift", StringComparison.OrdinalIgnoreCase) ||
                d.Contains("Green Park", StringComparison.OrdinalIgnoreCase));
            rerouteNotice = liftDisruption is not null
                ? $"Rerouted — {liftDisruption}"
                : "Rerouted to avoid reported lift failure at Green Park.";
        }

        var (route, journeySource) = await tfl.PlanJourneyAsync(
            originLat, originLng, destLat, destLng,
            originLabel, destLabel,
            stepFree: true, avoidDisruptions: true,
            rerouteNotice, ct);
        sources.Add(journeySource);

        if (route is null)
        {
            var fallback = isReroute ? MockResponses.RoutingRerouted : MockResponses.Routing;
            return fallback with { Sources = sources.ToArray() };
        }

        var facts = new
        {
            journeyDurationMinutes = route.DurationMinutes,
            durationMinutes = route.DurationMinutes,
            route.Steps,
            disruptions,
            rerouteNotice
        };
        var summary = await llm.SummarizeAsync("routing", facts, ct);

        return new QueryResponse(
            Intent: "routing",
            Status: "complete",
            Summary: summary,
            Data: route with { Disruptions = disruptions.ToArray() },
            Sources: sources.ToArray()
        );
    }

    private async Task<QueryResponse> HandleActivityAsync(QueryRequest request, CancellationToken ct)
    {
        var sources = new List<DataSource>();

        var lat = request.Location?.Lat ?? 51.5450;
        var lng = request.Location?.Lng ?? -0.0553;
        var locationLabel = request.Location is not null ? "Near you" : "Hackney";

        var hours = ParseHours(request.Query) ?? 3.0;
        var budget = ParseBudget(request.Query) ?? 25.0;
        var placeQuery = ExtractActivitySearchTerm(request.Query);

        var (weatherDesc, temp, weatherSource) = await weather.GetWeatherAsync(lat, lng, ct);
        sources.Add(weatherSource);

        var (items, placesSource) = await places.SearchActivitiesAsync(lat, lng, hours, budget, placeQuery, ct);
        sources.Add(placesSource);

        if (items.Length == 0)
        {
            var fallback = MockResponses.Activity;
            return fallback with
            {
                Summary = await llm.SummarizeAsync("activity", new { hours, budget, weatherDesc }, ct),
                Sources = [weatherSource, placesSource]
            };
        }

        var totalCost = items.Sum(i => i.CostGBP);
        var context = new ActivityContext(weatherDesc, locationLabel, budget, temp);

        var facts = new { hours, budget, weatherDesc, temp, items = items.Select(i => new { i.Name, i.Category, i.CostGBP }), totalCost };
        var summary = await llm.SummarizeAsync("activity", facts, ct);

        return new QueryResponse(
            Intent: "activity",
            Status: placesSource.Status == "ok" ? "complete" : "partial",
            Summary: summary,
            Data: new ActivityData("activity", hours, items, totalCost, context),
            Sources: sources.ToArray()
        );
    }

    private static string? ExtractActivitySearchTerm(string query)
    {
        var q = query.ToLowerInvariant();
        if (q.Contains("coffee") || q.Contains("cafe") || q.Contains("café")) return "coffee";
        if (q.Contains("restaurant") || q.Contains("food") || q.Contains("eat") || q.Contains("lunch") || q.Contains("dinner"))
            return "restaurant";
        if (q.Contains("bar") || q.Contains("pub") || q.Contains("drink")) return "bar";
        if (q.Contains("market")) return "market";
        if (q.Contains("shop") || q.Contains("shopping")) return "shop";
        return null;
    }

    private static double? ParseHours(string query)
    {
        var match = Regex.Match(query, @"(\d+)\s*hours?", RegexOptions.IgnoreCase);
        return match.Success ? double.Parse(match.Groups[1].Value) : null;
    }

    private static double? ParseBudget(string query)
    {
        var match = Regex.Match(query, @"£\s*(\d+)", RegexOptions.IgnoreCase);
        return match.Success ? double.Parse(match.Groups[1].Value) : null;
    }
}
