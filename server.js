const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" },
});

// Rota simples para teste
app.get("/", (req, res) => {
  res.send("Servidor de chat com Socket.IO funcionando!");
});

io.on("connection", (socket) => {
  console.log("Usuário conectado");

  // Espera receber um objeto { user, message }
  socket.on("chat message", (data) => {
    io.emit("chat message", data);
  });

  socket.on("disconnect", () => {
    console.log("Usuário desconectado");
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
