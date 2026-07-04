using System.Text;
using System.Text.Json;
using Backend.Models;

namespace Backend.Services;

public sealed class OsmService(IHttpClientFactory httpFactory)
{
    private static readonly string[] OverpassEndpoints =
    [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
    ];

    public async Task<AmenityData> GetAmenitiesAsync(double lat, double lng, CancellationToken ct = default)
    {
        var query = $"""
            [out:json][timeout:25];
            (
              node["amenity"~"restaurant|cafe|fast_food|pub|bar"](around:800,{lat},{lng});
              way["amenity"~"restaurant|cafe|fast_food|pub|bar"](around:800,{lat},{lng});
              node["leisure"~"park|garden|nature_reserve"](around:1000,{lat},{lng});
              way["leisure"~"park|garden|nature_reserve"](around:1000,{lat},{lng});
              node["amenity"="school"](around:1500,{lat},{lng});
              way["amenity"="school"](around:1500,{lat},{lng});
              node["railway"~"station|halt"](around:1200,{lat},{lng});
              node["highway"="bus_stop"](around:600,{lat},{lng});
              way["landuse"="construction"](around:500,{lat},{lng});
            );
            out center tags;
            """;

        var client = httpFactory.CreateClient("overpass");

        foreach (var endpoint in OverpassEndpoints)
        {
            try
            {
                var content = new StringContent($"data={Uri.EscapeDataString(query)}", Encoding.UTF8, "application/x-www-form-urlencoded");
                var res = await client.PostAsync(endpoint, content, ct);
                if (!res.IsSuccessStatusCode) continue;

                var body = await res.Content.ReadAsStreamAsync(ct);
                using var doc = await JsonDocument.ParseAsync(body, cancellationToken: ct);
                if (!doc.RootElement.TryGetProperty("elements", out var elements)) continue;

                var restaurants = 0;
                var parks = 0;
                var schools = 0;
                var railStations = 0;
                var busStops = 0;
                var construction = 0;

                foreach (var el in elements.EnumerateArray())
                {
                    if (!el.TryGetProperty("tags", out var tags)) continue;

                    if (tags.TryGetProperty("amenity", out var amenity))
                    {
                        var val = amenity.GetString();
                        if (val is "restaurant" or "cafe" or "fast_food" or "pub" or "bar") restaurants++;
                        if (val == "school") schools++;
                    }
                    if (tags.TryGetProperty("leisure", out var leisure))
                    {
                        var val = leisure.GetString();
                        if (val is "park" or "garden" or "nature_reserve") parks++;
                    }
                    if (tags.TryGetProperty("railway", out var railway) &&
                        railway.GetString() is "station" or "halt")
                        railStations++;
                    if (tags.TryGetProperty("highway", out var highway) && highway.GetString() == "bus_stop")
                        busStops++;
                    if (tags.TryGetProperty("landuse", out var landuse) && landuse.GetString() == "construction")
                        construction++;
                }

                return new AmenityData(
                    restaurants, parks, schools, railStations, busStops, construction,
                    ScoreGreen(parks), ScoreSchools(schools),
                    new DataSource("openstreetmap", "OpenStreetMap Overpass", "ok"));
            }
            catch
            {
                // try next mirror
            }
        }

        return new AmenityData(0, 0, 0, 0, 0, 0, 5.0, 5.0,
            new DataSource("openstreetmap", "OpenStreetMap Overpass", "error", "All Overpass mirrors failed"));
    }

    private static double ScoreGreen(int parks) => parks switch
    {
        >= 4 => 9.0,
        3 => 8.0,
        2 => 7.0,
        1 => 6.0,
        _ => 4.0
    };

    private static double ScoreSchools(int schools) => schools switch
    {
        >= 5 => 8.5,
        >= 3 => 7.5,
        >= 1 => 6.5,
        _ => 5.0
    };
}

public record AmenityData(
    int Restaurants,
    int Parks,
    int Schools,
    int RailStations,
    int BusStops,
    int ConstructionSites,
    double GreenScore,
    double SchoolScore,
    DataSource Source
);
