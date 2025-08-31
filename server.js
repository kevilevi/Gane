const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let rooms = {}; // roomId -> { players: {}, scores: {} }

app.use(express.static("public")); // serve frontend files

io.on("connection", (socket) => {
  console.log("New player:", socket.id);

  socket.on("joinRoom", (roomId, name) => {
    if (!rooms[roomId]) rooms[roomId] = { players: {}, scores: {} };

    rooms[roomId].players[socket.id] = { name, x: 100, y: 100 };
    rooms[roomId].scores[socket.id] = 0;

    socket.join(roomId);
    io.to(roomId).emit("state", rooms[roomId]);
  });

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

  socket.on("collectCoin", (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].scores[socket.id]++;
      io.to(roomId).emit("state", rooms[roomId]);
    }
  });

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

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
