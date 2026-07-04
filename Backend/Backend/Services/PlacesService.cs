using System.Text.Json;
using Backend.Configuration;
using Backend.Models;

namespace Backend.Services;

public sealed class PlacesService(IHttpClientFactory httpFactory, ApiSettings settings)
{
    public async Task<(ActivityItem[] Items, DataSource Source)> SearchActivitiesAsync(
        double lat, double lng, double hours, double? budget, string? searchTerm = null, CancellationToken ct = default)
    {
        if (!settings.HasFoursquare)
            return ([], new DataSource("foursquare", "Foursquare Places", "error", "FOURSQUARE_API_KEY not configured"));

        var client = httpFactory.CreateClient("foursquare");
        try
        {
            var queryPart = string.IsNullOrWhiteSpace(searchTerm)
                ? ""
                : $"&query={Uri.EscapeDataString(searchTerm)}";
            var url = $"places/search?ll={lat},{lng}&radius=2000&limit=10{queryPart}";
            var res = await client.GetAsync(url, ct);
            if (!res.IsSuccessStatusCode)
                return ([], new DataSource("foursquare", "Foursquare Places", "error", $"HTTP {(int)res.StatusCode}"));

            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var results = GetResultsArray(doc.RootElement);
            var items = new List<ActivityItem>();
            var start = DateTime.Now;
            var slotDuration = TimeSpan.FromMinutes(Math.Min(60, (hours * 60) / 3));

            foreach (var place in results.Take(3))
            {
                var name = place.GetProperty("name").GetString() ?? "Venue";
                var cats = GetCategoryName(place) ?? "activity";
                if (!TryGetCoordinates(place, out var latP, out var lngP)) continue;
                var end = start.Add(slotDuration);

                items.Add(new ActivityItem(
                    name,
                    start.ToString("o"),
                    end.ToString("o"),
                    EstimateCost(cats, budget),
                    cats.ToLowerInvariant(),
                    new Coordinates(latP, lngP)));

                start = end.AddMinutes(15);
            }

            return (items.ToArray(), new DataSource("foursquare", "Foursquare Places", "ok"));
        }
        catch (Exception ex)
        {
            return ([], new DataSource("foursquare", "Foursquare Places", "error", ex.Message));
        }
    }

    public async Task<(int Count, string[] Names, DataSource Source)> CountFoodNearbyAsync(
        double lat, double lng, CancellationToken ct = default)
    {
        if (!settings.HasFoursquare)
            return (0, [], new DataSource("foursquare", "Foursquare Places", "error", "FOURSQUARE_API_KEY not configured"));

        var client = httpFactory.CreateClient("foursquare");
        try
        {
            var url = $"places/search?ll={lat},{lng}&radius=800&limit=50&query=restaurant%20cafe";
            var res = await client.GetAsync(url, ct);
            if (!res.IsSuccessStatusCode)
                return (0, [], new DataSource("foursquare", "Foursquare Places", "error", $"HTTP {(int)res.StatusCode}"));

            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var results = GetResultsArray(doc.RootElement);
            var names = results.Take(5)
                .Select(p => p.GetProperty("name").GetString() ?? "")
                .Where(n => n.Length > 0)
                .ToArray();

            return (results.Count, names, new DataSource("foursquare", "Foursquare Places", "ok"));
        }
        catch (Exception ex)
        {
            return (0, [], new DataSource("foursquare", "Foursquare Places", "error", ex.Message));
        }
    }

    public async Task<(string[] Gems, DataSource Source)> GetHiddenGemsAsync(
        double lat, double lng, CancellationToken ct = default)
    {
        if (!settings.HasFoursquare)
            return ([], new DataSource("foursquare", "Foursquare Places", "error", "FOURSQUARE_API_KEY not configured"));

        var client = httpFactory.CreateClient("foursquare");
        try
        {
            var url = $"places/search?ll={lat},{lng}&radius=1500&limit=10&query=market%20park%20independent";
            var res = await client.GetAsync(url, ct);
            if (!res.IsSuccessStatusCode)
                return ([], new DataSource("foursquare", "Foursquare Places", "error", $"HTTP {(int)res.StatusCode}"));

            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var gems = GetResultsArray(doc.RootElement).Take(3)
                .Select(p =>
                {
                    var name = p.GetProperty("name").GetString() ?? "Spot";
                    var cat = GetCategoryName(p);
                    return cat is not null ? $"{name} ({cat})" : name;
                })
                .ToArray();

            return (gems, new DataSource("foursquare", "Foursquare Places", "ok"));
        }
        catch (Exception ex)
        {
            return ([], new DataSource("foursquare", "Foursquare Places", "error", ex.Message));
        }
    }

    private static List<JsonElement> GetResultsArray(JsonElement root)
    {
        if (root.TryGetProperty("results", out var results))
            return results.EnumerateArray().ToList();
        return [];
    }

    private static string? GetCategoryName(JsonElement place)
    {
        if (place.TryGetProperty("categories", out var cats) && cats.GetArrayLength() > 0)
            return cats[0].GetProperty("name").GetString();
        return null;
    }

    private static bool TryGetCoordinates(JsonElement place, out double lat, out double lng)
    {
        if (place.TryGetProperty("latitude", out var latEl) && place.TryGetProperty("longitude", out var lngEl))
        {
            lat = latEl.GetDouble();
            lng = lngEl.GetDouble();
            return true;
        }

        if (place.TryGetProperty("geocodes", out var geo) &&
            geo.TryGetProperty("main", out var main) &&
            main.TryGetProperty("latitude", out latEl) &&
            main.TryGetProperty("longitude", out lngEl))
        {
            lat = latEl.GetDouble();
            lng = lngEl.GetDouble();
            return true;
        }

        lat = lng = 0;
        return false;
    }

    private static double EstimateCost(string category, double? budget)
    {
        var baseCost = category.ToLowerInvariant() switch
        {
            var c when c.Contains("museum") => 12.0,
            var c when c.Contains("music") || c.Contains("jazz") => 8.0,
            var c when c.Contains("comedy") => 5.0,
            var c when c.Contains("food") || c.Contains("market") => 5.0,
            var c when c.Contains("coffee") => 4.0,
            var c when c.Contains("park") || c.Contains("outdoor") => 0,
            _ => 6.0
        };
        if (budget.HasValue && baseCost > budget.Value / 3)
            return Math.Round(budget.Value / 3, 2);
        return baseCost;
    }

    public async Task<PlaceDetails?> GetPlaceDetailsAsync(
        string name, double lat, double lng, CancellationToken ct = default)
    {
        if (!settings.HasFoursquare || string.IsNullOrWhiteSpace(name))
            return null;

        var client = httpFactory.CreateClient("foursquare");
        try
        {
            var searchUrl =
                $"places/search?query={Uri.EscapeDataString(name)}&ll={lat},{lng}&radius=500&limit=1";
            var searchRes = await client.GetAsync(searchUrl, ct);
            if (!searchRes.IsSuccessStatusCode) return null;

            using var searchDoc = await JsonDocument.ParseAsync(
                await searchRes.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var results = GetResultsArray(searchDoc.RootElement);
            if (results.Count == 0) return null;

            var place = results[0];
            var placeName = place.GetProperty("name").GetString() ?? name;
            var category = GetCategoryName(place);

            double? rating = null;
            if (place.TryGetProperty("rating", out var ratingEl) && ratingEl.ValueKind == JsonValueKind.Number)
                rating = ratingEl.GetDouble();

            int? reviewCount = null;
            if (place.TryGetProperty("stats", out var stats) &&
                stats.TryGetProperty("total_ratings", out var totalRatings) &&
                totalRatings.ValueKind == JsonValueKind.Number)
                reviewCount = totalRatings.GetInt32();

            var reviews = new List<PlaceReview>();
            if (place.TryGetProperty("fsq_id", out var fsqIdEl))
            {
                var fsqId = fsqIdEl.GetString();
                if (!string.IsNullOrEmpty(fsqId))
                {
                    var tipsRes = await client.GetAsync($"places/{fsqId}/tips?limit=4", ct);
                    if (tipsRes.IsSuccessStatusCode)
                    {
                        using var tipsDoc = await JsonDocument.ParseAsync(
                            await tipsRes.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
                        foreach (var tip in GetResultsArray(tipsDoc.RootElement))
                        {
                            var text = tip.TryGetProperty("text", out var textEl)
                                ? textEl.GetString()
                                : null;
                            if (string.IsNullOrWhiteSpace(text)) continue;
                            reviews.Add(new PlaceReview(text.Trim(), rating, "Foursquare visitor"));
                        }
                    }
                }
            }

            return new PlaceDetails(placeName, category, rating, reviewCount, reviews.ToArray());
        }
        catch
        {
            return null;
        }
    }
}
