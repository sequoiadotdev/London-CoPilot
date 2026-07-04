namespace Backend.Services;

public static class IntentDetector
{
    public static string Detect(string query)
    {
        var q = query.ToLowerInvariant();

        if (q.Contains("lift") || q.Contains("failed") || q.Contains("disruption") || q.Contains("reroute"))
            return "routing-reroute";

        if (
            q.Contains("home") ||
            q.Contains("route") ||
            q.Contains("get me") ||
            q.Contains("take me") ||
            q.Contains("go to") ||
            q.Contains("go towards") ||
            q.Contains("navigate") ||
            q.Contains("directions") ||
            q.Contains("journey") ||
            q.Contains("train station") ||
            q.Contains("tube station") ||
            q.Contains("rail station") ||
            q.Contains("station in ") ||
            q.StartsWith("to "))
        {
            return "routing";
        }

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
