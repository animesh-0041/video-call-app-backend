const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const rooms = {};
io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  // Join a room
  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);

    // Notify other users in the room
    socket.to(roomId).emit("user-connected", socket.id);

    // Listen for WebRTC offer
    socket.on("offer", (offer, receiverId) => {
      io.to(receiverId).emit("receive-offer", offer, socket.id);
    });

    // Listen for WebRTC answer
    socket.on("answer", (answer, senderId) => {
      io.to(senderId).emit("receive-answer", answer, socket.id);
    });

    // Listen for ICE candidates
    socket.on("ice-candidate", (candidate, receiverId) => {
      io.to(receiverId).emit("ice-candidate", candidate, socket.id);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.id} disconnected`);
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      socket.to(roomId).emit("user-disconnected", socket.id);
    });
  });
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
