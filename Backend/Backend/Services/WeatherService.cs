using System.Text.Json;
using Backend.Models;

namespace Backend.Services;

public sealed class WeatherService(IHttpClientFactory httpFactory)
{
    private static readonly Dictionary<int, string> WeatherCodes = new()
    {
        [0] = "Clear sky", [1] = "Mainly clear", [2] = "Partly cloudy", [3] = "Overcast",
        [45] = "Foggy", [48] = "Foggy", [51] = "Light drizzle", [61] = "Light rain",
        [63] = "Rain", [80] = "Rain showers", [95] = "Thunderstorm"
    };

    public async Task<(string Description, double TempC, DataSource Source)> GetWeatherAsync(
        double lat, double lng, CancellationToken ct = default)
    {
        var client = httpFactory.CreateClient("openmeteo-weather");
        try
        {
            var url = $"forecast?latitude={lat}&longitude={lng}&current=temperature_2m,weather_code&timezone=Europe%2FLondon";
            var res = await client.GetAsync(url, ct);
            if (!res.IsSuccessStatusCode)
                return ("Weather unavailable", 15, new DataSource("open-meteo", "Open-Meteo Weather", "error", "Request failed"));

            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var current = doc.RootElement.GetProperty("current");
            var temp = current.GetProperty("temperature_2m").GetDouble();
            var code = current.GetProperty("weather_code").GetInt32();
            var label = WeatherCodes.GetValueOrDefault(code, "Variable conditions");
            var desc = $"{label}, {temp:F0}°C";

            return (desc, temp, new DataSource("open-meteo", "Open-Meteo Weather", "ok"));
        }
        catch (Exception ex)
        {
            return ("Weather unavailable", 15, new DataSource("open-meteo", "Open-Meteo Weather", "error", ex.Message));
        }
    }
}
