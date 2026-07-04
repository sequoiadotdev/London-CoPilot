using System.Net.Http.Headers;
using Backend.Configuration;
using Backend.Models;
using Backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Development.local.json", optional: true, reloadOnChange: true);

var apiSettings = new ApiSettings
{
    TflAppId = builder.Configuration["TFL_APP_ID"] ?? Environment.GetEnvironmentVariable("TFL_APP_ID"),
    TflAppKey = builder.Configuration["TFL_API_KEY"]
        ?? builder.Configuration["TFL_APP_KEY"]
        ?? Environment.GetEnvironmentVariable("TFL_API_KEY")
        ?? Environment.GetEnvironmentVariable("TFL_APP_KEY"),
    GeminiApiKey = builder.Configuration["GEMINI_API_KEY"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY"),
    GeminiModel = builder.Configuration["GEMINI_MODEL"] ?? Environment.GetEnvironmentVariable("GEMINI_MODEL") ?? "gemini-3.1-flash-lite",
    FoursquareApiKey = builder.Configuration["FOURSQUARE_API_KEY"] ?? Environment.GetEnvironmentVariable("FOURSQUARE_API_KEY"),
};

builder.Services.AddSingleton(apiSettings);
builder.Services.AddHttpClient("postcodes", c => c.BaseAddress = new Uri("https://api.postcodes.io/"));
builder.Services.AddHttpClient("nominatim", c =>
{
    c.BaseAddress = new Uri("https://nominatim.openstreetmap.org/");
    c.DefaultRequestHeaders.Add("User-Agent", "LondonCopilot/1.0");
});
builder.Services.AddHttpClient("police", c => c.BaseAddress = new Uri("https://data.police.uk/api/"));
builder.Services.AddHttpClient("openmeteo", c => c.BaseAddress = new Uri("https://air-quality-api.open-meteo.com/v1/"));
builder.Services.AddHttpClient("openmeteo-weather", c => c.BaseAddress = new Uri("https://api.open-meteo.com/v1/"));
builder.Services.AddHttpClient("tfl", c => c.BaseAddress = new Uri("https://api.tfl.gov.uk/"));
builder.Services.AddHttpClient("overpass", c =>
{
    c.DefaultRequestHeaders.Add("User-Agent", "LondonCopilot/1.0 (housing insights)");
});
builder.Services.AddHttpClient("foursquare", c =>
{
    c.BaseAddress = new Uri("https://places-api.foursquare.com/");
    c.DefaultRequestHeaders.Add("Accept", "application/json");
    c.DefaultRequestHeaders.Add("X-Places-Api-Version", "2025-06-17");
})
.ConfigureHttpClient((sp, c) =>
{
    var s = sp.GetRequiredService<ApiSettings>();
    if (s.HasFoursquare)
        c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", s.FoursquareApiKey!);
});
builder.Services.AddHttpClient("gemini", c => c.BaseAddress = new Uri("https://generativelanguage.googleapis.com/v1beta/"))
    .ConfigureHttpClient((sp, c) =>
    {
        var s = sp.GetRequiredService<ApiSettings>();
        if (s.HasGemini)
            c.DefaultRequestHeaders.Add("x-goog-api-key", s.GeminiApiKey!);
    });

builder.Services.AddSingleton<GeocodingService>();
builder.Services.AddSingleton<CrimeService>();
builder.Services.AddSingleton<AirQualityService>();
builder.Services.AddSingleton<WeatherService>();
builder.Services.AddSingleton<TflService>();
builder.Services.AddSingleton<OsmService>();
builder.Services.AddSingleton<PlacesService>();
builder.Services.AddSingleton<LlmSummaryService>();
builder.Services.AddSingleton<QueryOrchestrator>();

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

app.MapPost("/query", async (QueryRequest request, QueryOrchestrator orchestrator, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(request.Query))
    {
        return Results.BadRequest(new QueryResponse(
            Intent: "housing",
            Status: "error",
            Summary: "Please enter a query.",
            Data: new { type = "housing" },
            Sources: [],
            Error: new QueryError("INVALID_REQUEST", "query is required")
        ));
    }

    var response = await orchestrator.HandleAsync(request, ct);
    return Results.Ok(response);
});

app.MapGet("/place/details", async (
    string name,
    double lat,
    double lng,
    PlacesService places,
    CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(name))
        return Results.BadRequest(new { error = "name is required" });

    var details = await places.GetPlaceDetailsAsync(name, lat, lng, ct);
    return details is null ? Results.NotFound() : Results.Ok(details);
});

app.Run();
