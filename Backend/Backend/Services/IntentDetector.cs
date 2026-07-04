namespace Backend.Services;

public static class IntentDetector
{
    public static string Detect(string query)
    {
        var q = query.ToLowerInvariant();

        if (q.Contains("lift") || q.Contains("failed") || q.Contains("disruption") || q.Contains("reroute"))
            return "routing-reroute";

        if (q.Contains("home") || q.Contains("route") || q.Contains("get me") || q.Contains("journey"))
            return "routing";

        if (IsActivityQuery(q))
            return "activity";

        return "housing";
    }

    private static bool IsActivityQuery(string q)
    {
        string[] activityWords =
        [
            "hour", "free", "activity", "coffee", "cafe", "café", "restaurant", "food", "eat",
            "brunch", "lunch", "dinner", "bar", "pub", "spot", "spots", "recommend", "suggest",
            "places", "things to do", "what to do", "where to go", "visit", "drink", "bakery",
            "market", "shop", "shopping",
        ];

        return activityWords.Any(w => q.Contains(w));
    }
}
