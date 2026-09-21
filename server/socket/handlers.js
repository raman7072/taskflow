const onlineUsers = new Map(); // socketId -> { userId, boardId }

export const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join a project board room
    socket.on('board:join', ({ projectId, userId, userName }) => {
      socket.join(projectId);
      onlineUsers.set(socket.id, { userId, userName, projectId });

      // Broadcast presence to room
      const usersInRoom = [...onlineUsers.values()]
        .filter(u => u.projectId === projectId);
      io.to(projectId).emit('board:presence', usersInRoom);
      console.log(`👤 ${userName} joined board ${projectId}`);
    });

    // Leave a project board room
    socket.on('board:leave', ({ projectId }) => {
      socket.leave(projectId);
      onlineUsers.delete(socket.id);
      const usersInRoom = [...onlineUsers.values()]
        .filter(u => u.projectId === projectId);
      io.to(projectId).emit('board:presence', usersInRoom);
    });

    // Typing in comment box
    socket.on('task:typing', ({ projectId, taskId, userName }) => {
      socket.to(projectId).emit('task:typing', { taskId, userName });
    });

    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        onlineUsers.delete(socket.id);
        const usersInRoom = [...onlineUsers.values()]
          .filter(u => u.projectId === user.projectId);
        io.to(user.projectId).emit('board:presence', usersInRoom);
      }
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};
