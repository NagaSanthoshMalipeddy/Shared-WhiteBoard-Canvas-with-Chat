using Microsoft.AspNetCore.SignalR;

namespace Backend.Hubs
{
    public class ChatHub : Hub
    {
        public async Task SendMessage(string id, string message)
        {
            await Clients.All.SendAsync("receiveMessage", id, message);
        }
    }
}
