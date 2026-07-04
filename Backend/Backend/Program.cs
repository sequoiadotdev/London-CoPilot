using Backend.Models;

// MockResponses lives in the Backend namespace
using Backend;

var builder = WebApplication.CreateBuilder(args);

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

app.MapPost("/query", (QueryRequest request) =>
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

    return Results.Ok(MockResponses.DetectIntent(request.Query));
});

app.Run();
