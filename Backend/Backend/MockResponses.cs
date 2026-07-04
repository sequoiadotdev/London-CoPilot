using Backend.Models;

namespace Backend;

public static class MockResponses
{
    public static QueryResponse Housing => new(
        Intent: "housing",
        Status: "partial",
        Summary: "Great area for young professionals. Excellent transport. Crime is slightly above average around the station after midnight. Air quality is moderate. Three major housing developments may increase noise over the next two years.",
        Data: new HousingData(
            Type: "housing",
            Address: "123 High Street, Hackney, London E8 1AA",
            Coordinates: new Coordinates(51.5450, -0.0553),
            Scores:
            [
                new Score("Transport", 9.2, 10),
                new Score("Safety", 6.8, 10),
                new Score("Green space", 7.1, 10),
                new Score("Air quality", 6.4, 10),
                new Score("Amenities", 8.5, 10)
            ],
            Pins:
            [
                new MapPin(51.5450, -0.0553, "123 High Street", "property"),
                new MapPin(51.5472, -0.0754, "Hackney Central", "transit"),
                new MapPin(51.5438, -0.0612, "London Fields", "poi"),
                new MapPin(51.5461, -0.0589, "Broadway Market", "poi")
            ],
            Insights:
            [
                new HousingInsight("tfl", "TfL", "🚇",
                    "Excellent transport — Hackney Central and London Fields both within 8 minutes walk. Night buses run every 10 minutes.", 9.2, 10),
                new HousingInsight("crime", "Crime", "🚓",
                    "Crime is slightly above average around the station after midnight. Daytime safety is good; stick to lit routes late at night.", 6.8, 10),
                new HousingInsight("green-space", "Green space", "🌳",
                    "London Fields is a 6-minute walk — one of the best green spaces in East London.", 7.1, 10),
                new HousingInsight("air-quality", "Air quality", "🌫",
                    "Air quality is moderate. Main road exposure on High Street; quieter at the back of the building.", 6.4, 10),
                new HousingInsight("restaurants", "Restaurants", "🍜",
                    "Broadway Market and Mare Street offer 40+ independent restaurants within 10 minutes.", 8.8, 10),
                new HousingInsight("schools", "Schools", "🏫",
                    "Two Outstanding-rated primaries within 1km. Secondary options improving with recent academy openings.", 7.5, 10),
                new HousingInsight("accessibility", "Accessibility", "♿",
                    "Hackney Central has step-free access. Bus routes 26 and 48 serve the street with low-floor vehicles.", 7.9, 10),
                new HousingInsight("planning", "Planning", "🏗",
                    "Three major housing developments approved within 500m — expect construction noise 2026–2028.", null, null),
                new HousingInsight("property-prices", "Property prices", "📈",
                    "1-bed flats average £1,750/mo; 2-bed £2,400/mo. Prices rose 4.2% year-on-year.", null, null),
                new HousingInsight("hidden-gems", "Hidden gems", "⭐",
                    "Netil Corner market on Saturdays, the Regent's Canal towpath, and Clapton Pond are local favourites most visitors miss.", null, null)
            ]
        ),
        Sources:
        [
            new DataSource("postcodes-io", "Postcodes.io", "ok"),
            new DataSource("tfl", "TfL Unified API", "ok"),
            new DataSource("police-uk", "Police.uk Crime Data", "ok"),
            new DataSource("defra-aq", "DEFRA Air Quality", "ok"),
            new DataSource("openstreetmap", "OpenStreetMap", "ok"),
            new DataSource("ofsted", "Ofsted Schools", "ok"),
            new DataSource("planning-london", "London Planning Datahub", "ok"),
            new DataSource("land-registry", "HM Land Registry", "ok")
        ]
    );

    public static QueryResponse Routing => new(
        Intent: "routing",
        Status: "complete",
        Summary: "Home in 28 minutes via Victoria line — step-free throughout, avoids the closed lift at Green Park, and takes a quieter walking route for the final stretch.",
        Data: new RoutingData(
            Type: "routing",
            Origin: new RoutingEndpoint(51.5308, -0.1238, "Current location — King's Cross"),
            Destination: new RoutingEndpoint(51.5154, -0.1755, "Home — Paddington"),
            DurationMinutes: 28,
            DistanceMeters: 5800,
            Polyline:
            [
                [51.5308, -0.1238],
                [51.5306, -0.1245],
                [51.5303, -0.1252],
                [51.5301, -0.1258],
                [51.5300, -0.1262],
                [51.5302, -0.1268],
                [51.5305, -0.1270],
                [51.5285, -0.1295],
                [51.5255, -0.1335],
                [51.5220, -0.1375],
                [51.5185, -0.1405],
                [51.5154, -0.1419],
                [51.5156, -0.1480],
                [51.5158, -0.1550],
                [51.5162, -0.1620],
                [51.5165, -0.1685],
                [51.5168, -0.1769],
                [51.5165, -0.1765],
                [51.5162, -0.1760],
                [51.5159, -0.1758],
                [51.5157, -0.1756],
                [51.5154, -0.1755]
            ],
            Steps:
            [
                new RouteStep(
                    "Walk to King's Cross St Pancras (Victoria line, step-free)", "walk", 4,
                    "Current location", "King's Cross St Pancras",
                    Polyline:
                    [
                        [51.5308, -0.1238],
                        [51.5306, -0.1245],
                        [51.5303, -0.1252],
                        [51.5301, -0.1258],
                        [51.5300, -0.1262],
                        [51.5302, -0.1268],
                        [51.5305, -0.1270]
                    ],
                    FromCoords: new Coordinates(51.5308, -0.1238),
                    ToCoords: new Coordinates(51.5305, -0.1270)),
                new RouteStep(
                    "Victoria line towards Walthamstow — 3 stops to Oxford Circus", "tube", 9,
                    "King's Cross St Pancras", "Oxford Circus",
                    Polyline:
                    [
                        [51.5305, -0.1270],
                        [51.5285, -0.1295],
                        [51.5255, -0.1335],
                        [51.5220, -0.1375],
                        [51.5185, -0.1405],
                        [51.5154, -0.1419]
                    ],
                    FromCoords: new Coordinates(51.5305, -0.1270),
                    ToCoords: new Coordinates(51.5154, -0.1419),
                    LineName: "Victoria line",
                    Direction: "Walthamstow Central",
                    StopCount: 3,
                    DetailedInstruction: "Board Victoria line (southbound platform). Alight at Oxford Circus after 3 stops."),
                new RouteStep(
                    "Change to Bakerloo line — 2 stops to Paddington", "tube", 8,
                    "Oxford Circus", "Paddington",
                    Polyline:
                    [
                        [51.5154, -0.1419],
                        [51.5156, -0.1480],
                        [51.5158, -0.1550],
                        [51.5162, -0.1620],
                        [51.5165, -0.1685],
                        [51.5168, -0.1769]
                    ],
                    FromCoords: new Coordinates(51.5154, -0.1419),
                    ToCoords: new Coordinates(51.5168, -0.1769),
                    LineName: "Bakerloo line",
                    Direction: "Queen's Park",
                    StopCount: 2,
                    DetailedInstruction: "Change at Oxford Circus for Bakerloo line towards Queen's Park. Alight at Paddington."),
                new RouteStep(
                    "Walk via quieter side streets (well-lit route)", "walk", 7,
                    "Paddington", "Home — Paddington",
                    Polyline:
                    [
                        [51.5168, -0.1769],
                        [51.5165, -0.1765],
                        [51.5162, -0.1760],
                        [51.5159, -0.1758],
                        [51.5157, -0.1756],
                        [51.5154, -0.1755]
                    ],
                    FromCoords: new Coordinates(51.5168, -0.1769),
                    ToCoords: new Coordinates(51.5154, -0.1755))
            ],
            PreferencesApplied: ["step-free", "avoid closed stations", "avoid lift failures", "safest walking route at night"]
        ),
        Sources:
        [
            new DataSource("tfl", "TfL Unified API", "ok"),
            new DataSource("tfl-disruptions", "TfL Disruptions", "ok"),
            new DataSource("openstreetmap", "OpenStreetMap", "ok")
        ]
    );

    public static QueryResponse RoutingRerouted => new(
        Intent: "routing",
        Status: "complete",
        Summary: "Rerouted — the lift at Green Park just failed. New route adds 4 minutes but stays step-free via Oxford Circus.",
        Data: new RoutingData(
            Type: "routing",
            Origin: new RoutingEndpoint(51.5308, -0.1238, "Current location — King's Cross"),
            Destination: new RoutingEndpoint(51.5154, -0.1755, "Home — Paddington"),
            DurationMinutes: 32,
            DistanceMeters: 6100,
            Polyline:
            [
                [51.5308, -0.1238],
                [51.5305, -0.1248],
                [51.5302, -0.1258],
                [51.5300, -0.1268],
                [51.5302, -0.1275],
                [51.5305, -0.1270],
                [51.5278, -0.1305],
                [51.5245, -0.1345],
                [51.5205, -0.1385],
                [51.5175, -0.1408],
                [51.5154, -0.1419],
                [51.5155, -0.1495],
                [51.5159, -0.1570],
                [51.5163, -0.1645],
                [51.5168, -0.1769],
                [51.5164, -0.1762],
                [51.5160, -0.1758],
                [51.5157, -0.1756],
                [51.5154, -0.1755]
            ],
            Steps:
            [
                new RouteStep(
                    "Walk to King's Cross St Pancras", "walk", 4,
                    "Current location", "King's Cross St Pancras",
                    Polyline:
                    [
                        [51.5308, -0.1238],
                        [51.5305, -0.1248],
                        [51.5302, -0.1258],
                        [51.5300, -0.1268],
                        [51.5302, -0.1275],
                        [51.5305, -0.1270]
                    ],
                    FromCoords: new Coordinates(51.5308, -0.1238),
                    ToCoords: new Coordinates(51.5305, -0.1270)),
                new RouteStep(
                    "Victoria line to Oxford Circus (avoiding Green Park)", "tube", 9,
                    "King's Cross St Pancras", "Oxford Circus",
                    Polyline:
                    [
                        [51.5305, -0.1270],
                        [51.5278, -0.1305],
                        [51.5245, -0.1345],
                        [51.5205, -0.1385],
                        [51.5175, -0.1408],
                        [51.5154, -0.1419]
                    ],
                    FromCoords: new Coordinates(51.5305, -0.1270),
                    ToCoords: new Coordinates(51.5154, -0.1419)),
                new RouteStep(
                    "Bakerloo line to Paddington", "tube", 8,
                    "Oxford Circus", "Paddington",
                    Polyline:
                    [
                        [51.5154, -0.1419],
                        [51.5155, -0.1495],
                        [51.5159, -0.1570],
                        [51.5163, -0.1645],
                        [51.5168, -0.1769]
                    ],
                    FromCoords: new Coordinates(51.5154, -0.1419),
                    ToCoords: new Coordinates(51.5168, -0.1769)),
                new RouteStep(
                    "Walk to destination", "walk", 7,
                    "Paddington", "Home — Paddington",
                    Polyline:
                    [
                        [51.5168, -0.1769],
                        [51.5164, -0.1762],
                        [51.5160, -0.1758],
                        [51.5157, -0.1756],
                        [51.5154, -0.1755]
                    ],
                    FromCoords: new Coordinates(51.5168, -0.1769),
                    ToCoords: new Coordinates(51.5154, -0.1755))
            ],
            PreferencesApplied: ["step-free", "avoid lift failures", "avoid closed stations"],
            RerouteNotice: "Lift failure at Green Park detected — route updated to avoid Jubilee line interchange."
        ),
        Sources:
        [
            new DataSource("tfl", "TfL Unified API", "ok"),
            new DataSource("tfl-disruptions", "TfL Disruptions", "ok"),
            new DataSource("openstreetmap", "OpenStreetMap", "ok")
        ]
    );

    public static QueryResponse Activity => new(
        Intent: "activity",
        Status: "complete",
        Summary: "There's a jazz performance 12 minutes away, an outdoor food market nearby, and a comedy show starting in 45 minutes. Total cost: £18.",
        Data: new ActivityData(
            Type: "activity",
            DurationHours: 3,
            TotalCostGBP: 18,
            Context: new ActivityContext(
                Weather: "Partly cloudy, 19°C — good for outdoor markets",
                LocationLabel: "Near Hackney",
                BudgetGBP: 25
            ),
            Items:
            [
                new ActivityItem("Ronnie Scott's late lunch jazz set", "2026-07-04T14:00:00+01:00",
                    "2026-07-04T14:45:00+01:00", 8.0, "music", new Coordinates(51.5450, -0.0553)),
                new ActivityItem("Broadway Market food stalls", "2026-07-04T15:00:00+01:00",
                    "2026-07-04T15:45:00+01:00", 5.0, "food", new Coordinates(51.5461, -0.0589)),
                new ActivityItem("Angel Comedy Club early show", "2026-07-04T16:00:00+01:00",
                    "2026-07-04T17:00:00+01:00", 5.0, "comedy", new Coordinates(51.5340, -0.1050))
            ]
        ),
        Sources:
        [
            new DataSource("foursquare", "Foursquare Places", "ok"),
            new DataSource("opening-hours", "Opening Hours API", "ok"),
            new DataSource("open-meteo", "Open-Meteo Weather", "ok"),
            new DataSource("tfl", "TfL Journey Planner", "ok")
        ]
    );

    public static QueryResponse DetectIntent(string query)
    {
        var q = query.ToLowerInvariant();

        if (q.Contains("lift") || q.Contains("failed") || q.Contains("disruption") || q.Contains("reroute"))
            return RoutingRerouted;

        if (q.Contains("home") || q.Contains("route") || q.Contains("get me") || q.Contains("journey"))
            return Routing;

        if (q.Contains("hour") || q.Contains("free") || q.Contains("do") || q.Contains("activity"))
            return Activity;

        return Housing;
    }
}
