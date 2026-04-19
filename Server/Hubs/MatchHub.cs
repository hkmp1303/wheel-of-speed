using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;
using WheelOfSpeed.Services;

namespace WheelOfSpeed.Hubs;

public sealed class MatchHub : Hub
{
    private readonly WheelOfSpeed.Services.IMatchService _matchService;
    private readonly WheelOfSpeed.Services.IMatchEngine _matchEngine;

    public MatchHub(WheelOfSpeed.Services.IMatchService matchService, WheelOfSpeed.Services.IMatchEngine matchEngine)
    {
        _matchService = matchService ?? throw new ArgumentNullException(nameof(matchService));
        _matchEngine = matchEngine ?? throw new ArgumentNullException(nameof(matchEngine));
    }

    public Task JoinMatchGroup(string guidCode)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, guidCode);
    }

    public Task LeaveMatchGroup(string guidCode)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, guidCode);
    }

    /// <summary>
    /// Server-authoritative spin request. Validates caller is active player, generates reward,
    /// persists to match state and broadcasts SpinResult to clients in the match group.
    /// </summary>
    // Accept playerId from the caller. The frontend currently doesn't establish
    // an authenticated user identifier for SignalR connections, so require the
    // caller to pass the playerId explicitly. The service still validates that
    // the player is the active player for the match.
    public async Task<object> RequestSpin(string matchId, string playerId)
    {
        if (string.IsNullOrWhiteSpace(matchId))
            throw new HubException("Invalid match id");

        if (string.IsNullOrWhiteSpace(playerId))
            throw new HubException("Unauthorized");

        // Delegate spin logic to the match service which is authoritative for state
        // The service will apply the spin, persist it and broadcast the updated match DTO
        var dto = await _matchService.SpinAsync(matchId, playerId);

        // Return the DTO to the caller for convenience
        return dto;
    }
}
