using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Backend.Models;

namespace Backend.Services;

public sealed partial class GeocodingService(IHttpClientFactory httpFactory)
{
    private static readonly Regex PostcodeRegex = MyRegex();

    public async Task<(GeocodedLocation? Location, DataSource Source)> ResolveAsync(
        string query, CancellationToken ct = default)
    {
        var postcodeMatch = PostcodeRegex.Match(query);
        if (postcodeMatch.Success)
        {
            var postcode = postcodeMatch.Value.ToUpperInvariant();
            var client = httpFactory.CreateClient("postcodes");
            try
            {
                var res = await client.GetAsync($"postcodes/{Uri.EscapeDataString(postcode)}", ct);
                if (!res.IsSuccessStatusCode)
                    return (null, new DataSource("postcodes-io", "Postcodes.io", "error", "Postcode not found"));

                using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
                var result = doc.RootElement.GetProperty("result");
                var lat = result.GetProperty("latitude").GetDouble();
                var lng = result.GetProperty("longitude").GetDouble();
                var label = query.Trim();
                return (new GeocodedLocation(label, lat, lng), new DataSource("postcodes-io", "Postcodes.io", "ok"));
            }
            catch (Exception ex)
            {
                return (null, new DataSource("postcodes-io", "Postcodes.io", "error", ex.Message));
            }
        }

        var (locFull, sourceFull) = await NominatimSearchAsync(query + ", London, UK", query, ct);
        if (locFull is not null)
            return (locFull, sourceFull);

        var cleaned = CleanPlaceQuery(query);
        if (!string.Equals(cleaned, query, StringComparison.OrdinalIgnoreCase) && cleaned.Length >= 2)
        {
            var (locClean, sourceClean) = await NominatimSearchAsync(cleaned + ", London, UK", cleaned, ct);
            if (locClean is not null)
                return (locClean, sourceClean);
        }

        return (null, sourceFull);
    }

    private async Task<(GeocodedLocation? Location, DataSource Source)> NominatimSearchAsync(
        string searchText, string labelFallback, CancellationToken ct)
    {
        var nominatim = httpFactory.CreateClient("nominatim");
        try
        {
            var url = $"search?q={Uri.EscapeDataString(searchText)}&format=json&limit=1&countrycodes=gb";
            var res = await nominatim.GetAsync(url, ct);
            if (!res.IsSuccessStatusCode)
                return (null, new DataSource("nominatim", "OpenStreetMap Nominatim", "error", "Geocoding failed"));

            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            if (doc.RootElement.GetArrayLength() == 0)
                return (null, new DataSource("nominatim", "OpenStreetMap Nominatim", "error", "Address not found"));

            var item = doc.RootElement[0];
            var lat = double.Parse(item.GetProperty("lat").GetString()!, CultureInfo.InvariantCulture);
            var lng = double.Parse(item.GetProperty("lon").GetString()!, CultureInfo.InvariantCulture);
            var display = item.GetProperty("display_name").GetString() ?? labelFallback;
            return (new GeocodedLocation(display, lat, lng), new DataSource("nominatim", "OpenStreetMap Nominatim", "ok"));
        }
        catch (Exception ex)
        {
            return (null, new DataSource("nominatim", "OpenStreetMap Nominatim", "error", ex.Message));
        }
    }

    internal static string CleanPlaceQuery(string query)
    {
        var q = query.Trim().TrimEnd('?').Trim();

        string[] prefixes =
        [
            "how safe is ", "is ", "what is ", "what's ", "tell me about ", "recommend me ",
            "recommend ", "find me ", "show me ", "best ", "good ", "nice ",
        ];

        foreach (var prefix in prefixes)
        {
            if (q.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                q = q[prefix.Length..].Trim();
                break;
            }
        }

        string[] suffixes =
        [
            " safe", " like", " area", " neighbourhood", " neighborhood", " london",
        ];

        foreach (var suffix in suffixes)
        {
            if (q.EndsWith(suffix, StringComparison.OrdinalIgnoreCase))
            {
                q = q[..^suffix.Length].Trim();
            }
        }

        return q;
    }

    [GeneratedRegex(@"\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b", RegexOptions.IgnoreCase)]
    private static partial Regex MyRegex();
}

public record GeocodedLocation(string Label, double Lat, double Lng)
{
    public Coordinates ToCoordinates() => new(Lat, Lng);
}
