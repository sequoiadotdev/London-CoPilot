using System.Globalization;
using System.Text.Json;
using Backend.Models;

namespace Backend.Services;

public sealed class AirQualityService(IHttpClientFactory httpFactory)
{
    public async Task<(double Score, double? UsAqi, double? Pm25, DataSource Source)> GetAirQualityAsync(
        double lat, double lng, CancellationToken ct = default)
    {
        var client = httpFactory.CreateClient("openmeteo");
        try
        {
            var url = $"air-quality?latitude={lat}&longitude={lng}&current=us_aqi,pm2_5";
            var res = await client.GetAsync(url, ct);
            if (!res.IsSuccessStatusCode)
                return (6.5, null, null, new DataSource("open-meteo-aq", "Open-Meteo Air Quality", "error", "Request failed"));

            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var current = doc.RootElement.GetProperty("current");
            double? aqi = current.TryGetProperty("us_aqi", out var aqiEl) ? aqiEl.GetDouble() : null;
            double? pm25 = current.TryGetProperty("pm2_5", out var pmEl) ? pmEl.GetDouble() : null;

            var score = aqi switch
            {
                null => 6.5,
                <= 50 => 9.0,
                <= 100 => 7.5,
                <= 150 => 6.0,
                <= 200 => 4.5,
                _ => 3.0
            };

            return (score, aqi, pm25, new DataSource("open-meteo-aq", "Open-Meteo Air Quality", "ok"));
        }
        catch (Exception ex)
        {
            return (6.5, null, null, new DataSource("open-meteo-aq", "Open-Meteo Air Quality", "error", ex.Message));
        }
    }
}
