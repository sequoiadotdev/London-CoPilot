namespace Backend.Configuration;

public sealed class ApiSettings
{
    public string? TflAppId { get; init; }
    public string? TflAppKey { get; init; }
    public string? GeminiApiKey { get; init; }
    public string GeminiModel { get; init; } = "gemini-3.1-flash-lite";
    public string? FoursquareApiKey { get; init; }

    public bool HasTfl => !string.IsNullOrWhiteSpace(TflAppKey);
    public bool HasGemini => !string.IsNullOrWhiteSpace(GeminiApiKey);
    public bool HasFoursquare => !string.IsNullOrWhiteSpace(FoursquareApiKey);
}
