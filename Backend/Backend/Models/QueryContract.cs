namespace Backend.Models;

public record QueryLocation(double Lat, double Lng);

public record QueryRequest(string Query, QueryLocation? Location = null);

public record Coordinates(double Lat, double Lng);

public record MapPin(double Lat, double Lng, string Label, string Kind);

public record Score(string Label, double Value, double OutOf);

public record HousingData(
    string Type,
    string Address,
    Coordinates Coordinates,
    Score[] Scores,
    MapPin[] Pins
);

public record RouteStep(
    string Instruction,
    string Mode,
    int DurationMinutes,
    string? From = null,
    string? To = null
);

public record RoutingEndpoint(double Lat, double Lng, string? Label = null);

public record RoutingData(
    string Type,
    RoutingEndpoint Origin,
    RoutingEndpoint Destination,
    int DurationMinutes,
    int DistanceMeters,
    double[][] Polyline,
    RouteStep[] Steps
);

public record ActivityItem(
    string Name,
    string StartTime,
    string EndTime,
    double CostGBP,
    string Category,
    Coordinates? Coordinates = null
);

public record ActivityData(
    string Type,
    double DurationHours,
    ActivityItem[] Items
);

public record DataSource(string Id, string Name, string Status, string? Error = null);

public record QueryError(string Code, string Message);

public record QueryResponse(
    string Intent,
    string Status,
    string Summary,
    object Data,
    DataSource[] Sources,
    QueryError? Error = null
);
