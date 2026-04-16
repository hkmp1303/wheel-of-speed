using WheelOfSpeed.Models;
using WheelOfSpeed.Services;

namespace WheelOfSpeed.Api;

public static class MatchEndpoints
{
    public static IEndpointRouteBuilder MapMatchEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/matches");

        group.MapPost("", async (CreateMatchRequest request, IMatchService service) =>
        {
            var match = await service.CreateMatchAsync(request.HostName);
            return Results.Ok(match);
        });

        group.MapGet("/{guidCode}", async (string guidCode, IMatchService service) =>
        {
            var match = await service.GetMatchAsync(guidCode);
            return Results.Ok(match);
        });

        group.MapPost("/{guidCode}/join", async (string guidCode, JoinMatchRequest request, IMatchService service) =>
        {
            var match = await service.JoinMatchAsync(guidCode, request.PlayerName);
            return Results.Ok(match);
        });

        group.MapPost("/{guidCode}/ready", async (string guidCode, ReadyRequest request, IMatchService service) =>
        {
            var match = await service.MarkReadyAsync(guidCode, request.PlayerId);
            return Results.Ok(match);
        });

        group.MapPost("/{guidCode}/spin", async (string guidCode, SpinRequest request, IMatchService service) =>
        {
            var match = await service.SpinAsync(guidCode, request.PlayerId);
            return Results.Ok(match);
        });

        group.MapPost("/{guidCode}/guess", async (string guidCode, GuessRequest request, IMatchService service) =>
        {
            var match = await service.GuessAsync(guidCode, request.PlayerId, request.Guess);
            return Results.Ok(match);
        });

        return app;
    }
}
