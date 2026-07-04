namespace Backend.Models;

public record QueryLocation(double Lat, double Lng);

public record QueryPreferences(
    bool? StepFree = null,
    bool? AvoidDisruptions = null,
    bool? NoStairs = null,
    bool? AvoidLiftFailures = null,
    bool? SafestWalking = null,
    bool? LowestPollution = null
);

public record QueryRequest(string Query, QueryLocation? Location = null, QueryPreferences? Preferences = null);

public record Coordinates(double Lat, double Lng);

public record MapPin(double Lat, double Lng, string Label, string Kind);

public record Score(string Label, double Value, double OutOf);

public record HousingInsight(
    string Id,
    string Label,
    string Emoji,
    string Summary,
    double? Score = null,
    double? OutOf = null
);

public record HousingFacts(
    int? CrimeCount = null,
    double? Aqi = null,
    double? Pm25 = null,
    int RestaurantCount = 0,
    int ParkCount = 0,
    int SchoolCount = 0,
    int ConstructionSites = 0,
    string[]? NearbyStations = null,
    string[]? SampleRestaurants = null,
    string[]? HiddenGems = null,
    int StepFreeCount = 0,
    int StationCount = 0
);

public record HousingData(
    string Type,
    string Address,
    Coordinates Coordinates,
    Score[] Scores,
    MapPin[] Pins,
    HousingInsight[] Insights,
    HousingFacts? Facts = null
);

public record RouteStep(
    string Instruction,
    string Mode,
    int DurationMinutes,
    string? From = null,
    string? To = null,
    double[][]? Polyline = null,
    Coordinates? FromCoords = null,
    Coordinates? ToCoords = null,
    string? LineName = null,
    string? Direction = null,
    string? RouteNumber = null,
    int? StopCount = null,
    string? DetailedInstruction = null,
    string? DepartureTime = null,
    string? ArrivalTime = null,
    string? DeparturePlatform = null,
    string? InterchangeHint = null,
    int? DistanceMeters = null
);

public record RoutingEndpoint(double Lat, double Lng, string? Label = null);

public record RoutingData(
    string Type,
    RoutingEndpoint Origin,
    RoutingEndpoint Destination,
    int DurationMinutes,
    int DistanceMeters,
    double[][] Polyline,
    RouteStep[] Steps,
    string[]? PreferencesApplied = null,
    string? RerouteNotice = null,
    string[]? Disruptions = null,
    string? StartDateTime = null,
    string? ArrivalDateTime = null
);

public record ActivityItem(
    string Name,
    string StartTime,
    string EndTime,
    double CostGBP,
    string Category,
    Coordinates? Coordinates = null
);

public record ActivityContext(
    string? Weather = null,
    string? LocationLabel = null,
    double? BudgetGBP = null,
    double? TempC = null
);

public record ActivityData(
    string Type,
    double DurationHours,
    ActivityItem[] Items,
    double TotalCostGBP,
    ActivityContext? Context = null
);

public record DataSource(string Id, string Name, string Status, string? Error = null);

public record QueryError(string Code, string Message);

public record PlaceReview(string Text, double? Rating, string? Author);

public record PlaceDetails(
    string Name,
    string? Category,
    double? Rating,
    int? ReviewCount,
    PlaceReview[] Reviews
);

public record QueryResponse(
    string Intent,
    string Status,
    string Summary,
    object Data,
    DataSource[] Sources,
    QueryError? Error = null
);
