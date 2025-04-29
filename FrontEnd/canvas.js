//const { HubConnectionBuilder } = require("@microsoft/signalr");

const canvas = document.getElementById("drawing-board");
const clear = document.getElementById("clear");
const stroke = document.getElementById("stroke");
const lineWidthEle = document.getElementById("line-width");
const send = document.getElementById("send");

const ctx = canvas.getContext("2d");

// Set proper canvas width and height based on its container
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

// Initial resize
resizeCanvas();

// Optional: resize canvas when window size changes
window.addEventListener("resize", resizeCanvas);

const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5053/drawingHub")
  .configureLogging(signalR.LogLevel.Information)
  .build();

let isPainting = false;
let lineWidth = 1;

// Mouse down - user starts drawing
canvas.addEventListener("mousedown", (e) => {
  isPainting = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // ONLY inform server to start
  connection.invoke("StartDrawing", x, y, ctx.strokeStyle, ctx.lineWidth)
    .catch((err) => console.error("StartDrawing error:", err));
});

// Mouse move - user is drawing
canvas.addEventListener("mousemove", (e) => {
  if (!isPainting) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  connection.invoke("DrawOnBoard", x, y, ctx.strokeStyle, ctx.lineWidth)
    .catch((err) => console.error("DrawOnBoard error:", err));
});

// Mouse up - user stops drawing
canvas.addEventListener("mouseup", (e) => {
  if (!isPainting) return;
  isPainting = false;
  connection.invoke("StopDrawing")
    .catch((err) => console.error("StopDrawing error:", err));
});

// Mouse leaves canvas - also stop painting
canvas.addEventListener("mouseleave", (e) => {
  if (!isPainting) return;
  isPainting = false;
  connection.invoke("StopDrawing")
    .catch((err) => console.error("StopDrawing error:", err));
});

// Line thickness change
lineWidthEle.addEventListener("change", (e) => {
  lineWidth = e.target.value;
  ctx.lineWidth = lineWidth;
});

// Stroke color change
stroke.addEventListener("change", (e) => {
  ctx.strokeStyle = e.target.value;
});

// Clear canvas
clear.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath(); // Reset the path
  lineWidthEle.value = 1;
  stroke.value = "#000000"; 
  ctx.strokeStyle = stroke.value;
  ctx.lineWidth = lineWidthEle.value;

  connection.invoke("ClearBoard")
    .catch((err) => console.error("ClearBoard error:", err));
});


// ========== SIGNALR EVENTS ==========

// StartDrawing from another user
connection.on("StartDrawing", (x, y, color, thickness) => {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";
  ctx.moveTo(x, y);
});

// DrawNow from another user
connection.on("DrawNow", (x, y, color, thickness) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";
  ctx.lineTo(x, y);
  ctx.stroke();
});

// StopDrawing from another user
connection.on("StopDrawing", () => {
  ctx.beginPath();
});

// ClearAll from server
connection.on("ClearAll", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
});



send.addEventListener("click", () => {
  const message = document.getElementById("inputMessage").value;
  if(message) {
    connection.invoke("SendMessage", connection.connectionId, message).catch((err) => console.error("SendMessage error:", err));
    document.getElementById("message-box").innerHTML += `<div class='right message-text'>${message}</div>`;
    document.getElementById("message-box").scrollTo(0, document.getElementById("message-box").scrollHeight);
  }
});




// Reconnect if connection drops
connection.onclose(async () => {
  console.log("Connection to SignalR server closed. Reconnecting...");
  setTimeout(() => start(), 5000);
});

// Start the connection
async function start() {
  try {
    console.log("Connecting to SignalR server...");
    await connection.start();
    console.log("Connected to SignalR server.");
  } catch (err) {
    console.error("Connection error:", err);
    setTimeout(() => start(), 5000);
  }
}

connection.on('receiveMessage', (id, message) => {
  if(connection.connectionId !== id) {
    document.getElementById("message-box").innerHTML += `<div class='left message-text'">${message}</div>`;
    document.getElementById("message-box").scrollTo(0, document.getElementById("message-box").scrollHeight);
  }
});

start();
