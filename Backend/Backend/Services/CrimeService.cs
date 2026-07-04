using System.Text.Json;
using Backend.Models;

namespace Backend.Services;

public sealed class CrimeService(IHttpClientFactory httpFactory)
{
    public async Task<(double Score, int CrimeCount, DataSource Source)> GetSafetyScoreAsync(
        double lat, double lng, CancellationToken ct = default)
    {
        var client = httpFactory.CreateClient("police");
        var date = DateTime.UtcNow.AddMonths(-2).ToString("yyyy-MM");
        try
        {
            var url = $"crimes-street/all-crime?lat={lat}&lng={lng}&date={date}";
            var res = await client.GetAsync(url, ct);
            if (!res.IsSuccessStatusCode)
                return (7.0, 0, new DataSource("police-uk", "Police.uk Crime Data", "error", $"HTTP {(int)res.StatusCode}"));

            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var count = doc.RootElement.GetArrayLength();

            // Rough scoring: fewer crimes in 1-mile radius → higher score
            var score = count switch
            {
                <= 30 => 9.0,
                <= 60 => 8.0,
                <= 100 => 7.0,
                <= 150 => 6.5,
                <= 200 => 6.0,
                _ => 5.0
            };

            return (score, count, new DataSource("police-uk", "Police.uk Crime Data", "ok"));
        }
        catch (Exception ex)
        {
            return (7.0, 0, new DataSource("police-uk", "Police.uk Crime Data", "error", ex.Message));
        }
    }
}
