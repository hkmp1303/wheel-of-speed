using Microsoft.AspNetCore.SignalR;

namespace WheelOfSpeed.Hubs;

public sealed class MatchHub : Hub
{
    public Task JoinMatchGroup(string guidCode)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, guidCode);
    }

    public Task LeaveMatchGroup(string guidCode)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, guidCode);
    }
}
