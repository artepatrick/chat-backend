const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" }, // Permite conexões de qualquer origem (apenas para desenvolvimento)
});

// Rota simples para teste (opcional)
app.get("/", (req, res) => {
  res.send("Servidor de chat com Socket.IO funcionando!");
});

// Quando um novo cliente se conectar...
io.on("connection", (socket) => {
  console.log("Usuário conectado");

  // Escuta mensagens enviadas pelo cliente
  socket.on("chat message", (msg) => {
    // Reenvia a mensagem para todos os clientes conectados
    io.emit("chat message", msg);
  });

  // Quando o cliente se desconecta...
  socket.on("disconnect", () => {
    console.log("Usuário desconectado");
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
