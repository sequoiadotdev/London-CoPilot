using System.Text;
using System.Text.Json;
using Backend.Configuration;

namespace Backend.Services;

public sealed class LlmSummaryService(IHttpClientFactory httpFactory, ApiSettings settings)
{
    public async Task<string> SummarizeAsync(string pillar, object facts, CancellationToken ct = default)
    {
        if (!settings.HasGemini)
            return GetFallbackSummary(pillar);

        var client = httpFactory.CreateClient("gemini");
        var factsJson = JsonSerializer.Serialize(facts, new JsonSerializerOptions { WriteIndented = true });
        var systemPrompt = pillar switch
        {
            "housing" => """
                You are London Copilot. Write a 2-3 sentence narrative summary for someone deciding whether to live at an address.
                Be opinionated, practical, and specific. Mention transport, safety, air quality, and neighbourhood character.
                Do NOT use bullet points or JSON. Write plain prose only.
                """,
            "routing" => """
                You are London Copilot. Write a 1-2 sentence journey summary.
                CRITICAL: Use the exact durationMinutes value from the data for total journey time — do NOT estimate or recalculate.
                Mention key modes (tube, bus, walk) and any disruptions avoided.
                Plain prose only, no bullets.
                """,
            "activity" => """
                You are London Copilot. Write a 1-2 sentence activity plan summary. Mention what's nearby, timing, and total cost.
                Plain prose only, no bullets.
                """,
            _ => "Summarize the following London data in 2 sentences. Plain prose only."
        };

        var body = new
        {
            systemInstruction = new { parts = new[] { new { text = systemPrompt } } },
            contents = new[]
            {
                new { parts = new[] { new { text = $"Data:\n{factsJson}" } } }
            },
            generationConfig = new
            {
                maxOutputTokens = 200,
                temperature = 0.7
            }
        };

        try
        {
            var url = $"models/{settings.GeminiModel}:generateContent";
            var content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
            var res = await client.PostAsync(url, content, ct);
            if (!res.IsSuccessStatusCode)
                return GetFallbackSummary(pillar);

            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            return doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString()?.Trim() ?? GetFallbackSummary(pillar);
        }
        catch
        {
            return GetFallbackSummary(pillar);
        }
    }

    private static string GetFallbackSummary(string pillar) =>
        pillar switch
        {
            "housing" => "Area report compiled from available London data sources. Check individual insights for transport, safety, and amenities.",
            "routing" => "Route planned using TfL and OpenStreetMap data.",
            "activity" => "Activity suggestions based on nearby places and current conditions.",
            _ => "London Copilot response ready."
        };
}
