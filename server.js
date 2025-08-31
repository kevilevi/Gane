const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve frontend files from /public
app.use(express.static(path.join(__dirname, "public")));

let rooms = {}; // roomId -> { players: {}, scores: {} }

io.on("connection", (socket) => {
  console.log("New player:", socket.id);

  // player joins a room
  socket.on("joinRoom", (roomId, name) => {
    if (!rooms[roomId]) rooms[roomId] = { players: {}, scores: {} };

    rooms[roomId].players[socket.id] = { name, x: 100, y: 100 };
    rooms[roomId].scores[socket.id] = 0;

    socket.join(roomId);
    io.to(roomId).emit("state", rooms[roomId]);
  });

  // player movement
  socket.on("move", (roomId, dir) => {
    const player = rooms[roomId]?.players[socket.id];
    if (!player) return;
    const speed = 10;
    if (dir === "up") player.y -= speed;
    if (dir === "down") player.y += speed;
    if (dir === "left") player.x -= speed;
    if (dir === "right") player.x += speed;

    io.to(roomId).emit("state", rooms[roomId]);
  });

  // coin collected
  socket.on("collectCoin", (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].scores[socket.id]++;
      io.to(roomId).emit("state", rooms[roomId]);
    }
  });

  // player disconnect
  socket.on("disconnect", () => {
    for (let roomId in rooms) {
      if (rooms[roomId].players[socket.id]) {
        delete rooms[roomId].players[socket.id];
        delete rooms[roomId].scores[socket.id];
        io.to(roomId).emit("state", rooms[roomId]);
      }
    }
  });
});

// ✅ Important: Render uses `process.env.PORT`
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
