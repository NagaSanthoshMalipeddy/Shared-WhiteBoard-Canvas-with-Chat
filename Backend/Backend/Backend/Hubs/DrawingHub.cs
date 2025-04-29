using Microsoft.AspNetCore.SignalR;

namespace Backend.Hubs
{
    public class DrawingHub : Hub
    {
        public async Task DrawOnBoard(float x, float y, string color, int thickness)
        {
            await Clients.All.SendAsync("DrawNow", x, y, color, thickness);
        }
        public async Task ClearBoard()
        {
            await Clients.All.SendAsync("ClearAll");
        }
        public async Task StartDrawing(float x, float y)
        {
            await Clients.All.SendAsync("StartDrawing", x, y);
        }
        public async Task StopDrawing()
        {
            await Clients.All.SendAsync("StopDrawing");
        }
        public async Task SendMessage(string id, string message)
        {
            await Clients.All.SendAsync("receiveMessage", id, message);
        }
    }
}
