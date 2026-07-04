using Backend.Models;

namespace Backend;

public static class MockResponses
{
    public static QueryResponse Housing => new(
        Intent: "housing",
        Status: "partial",
        Summary: "14 Clerkenwell Road is a solid choice for young professionals — excellent transport links and a vibrant neighbourhood, though street noise and limited green space are worth considering.",
        Data: new HousingData(
            Type: "housing",
            Address: "14 Clerkenwell Road, London EC1M 5RF",
            Coordinates: new Coordinates(51.5203, -0.1089),
            Scores:
            [
                new Score("Transport", 9.1, 10),
                new Score("Safety", 7.4, 10),
                new Score("Amenities", 8.6, 10),
                new Score("Affordability", 5.2, 10),
                new Score("Green space", 4.8, 10)
            ],
            Pins:
            [
                new MapPin(51.5203, -0.1089, "14 Clerkenwell Road", "property"),
                new MapPin(51.5198, -0.1056, "Farringdon", "transit"),
                new MapPin(51.5211, -0.1123, "Exmouth Market", "poi")
            ]
        ),
        Sources:
        [
            new DataSource("postcodes-io", "Postcodes.io", "ok"),
            new DataSource("tfl", "TfL Journey Planner", "ok"),
            new DataSource("police-uk", "Police.uk Crime Data", "error",
                "Rate limit exceeded — crime scores omitted")
        ]
    );

    public static QueryResponse Routing => new(
        Intent: "routing",
        Status: "complete",
        Summary: "Fastest route home: 34 minutes via Circle line from King's Cross St Pancras to Paddington, then a 6-minute walk. No disruptions on your line.",
        Data: new RoutingData(
            Type: "routing",
            Origin: new RoutingEndpoint(51.5308, -0.1238, "King's Cross St Pancras"),
            Destination: new RoutingEndpoint(51.5154, -0.1755, "Home — Paddington"),
            DurationMinutes: 34,
            DistanceMeters: 6200,
            Polyline:
            [
                [51.5308, -0.1238],
                [51.5289, -0.1312],
                [51.5234, -0.1589],
                [51.5189, -0.1698],
                [51.5154, -0.1755]
            ],
            Steps:
            [
                new RouteStep("Walk to King's Cross St Pancras (Circle line)", "walk", 3,
                    "Current location", "King's Cross St Pancras"),
                new RouteStep("Circle line towards Hammersmith — 4 stops to Paddington", "tube", 14,
                    "King's Cross St Pancras", "Paddington"),
                new RouteStep("Walk to destination", "walk", 6, "Paddington", "Home — Paddington")
            ]
        ),
        Sources:
        [
            new DataSource("tfl", "TfL Unified API", "ok"),
            new DataSource("openstreetmap", "OpenStreetMap", "ok")
        ]
    );

    public static QueryResponse Activity => new(
        Intent: "activity",
        Status: "complete",
        Summary: "Here's a relaxed 3-hour afternoon near Shoreditch: coffee, the Design Museum, and a canal-side stroll — all within walking distance, about £18 total.",
        Data: new ActivityData(
            Type: "activity",
            DurationHours: 3,
            Items:
            [
                new ActivityItem("Ozone Coffee Roasters", "2026-07-04T14:00:00+01:00",
                    "2026-07-04T14:45:00+01:00", 4.5, "coffee", new Coordinates(51.5231, -0.0789)),
                new ActivityItem("Design Museum", "2026-07-04T15:00:00+01:00",
                    "2026-07-04T16:15:00+01:00", 12.0, "museum", new Coordinates(51.4998, -0.1982)),
                new ActivityItem("Regent's Canal walk", "2026-07-04T16:30:00+01:00",
                    "2026-07-04T17:00:00+01:00", 0, "outdoors", new Coordinates(51.5278, -0.0756))
            ]
        ),
        Sources:
        [
            new DataSource("foursquare", "Foursquare Places", "ok"),
            new DataSource("opening-hours", "Opening Hours API", "ok")
        ]
    );

    public static QueryResponse DetectIntent(string query) =>
        query.ToLowerInvariant() switch
        {
            var q when q.Contains("home") || q.Contains("route") || q.Contains("get me") => Routing,
            var q when q.Contains("hour") || q.Contains("free") || q.Contains("do") || q.Contains("activity") => Activity,
            _ => Housing
        };
}
