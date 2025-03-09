const express = require("express");
const app = express();
const http = require("http").createServer(app);
const cors = require("cors");

// Aplica CORS para todas as rotas do Express
app.use(
  cors({
    origin: "https://chat-frontend.fly.dev",
  })
);

const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Rota simples para teste
app.get("/", (req, res) => {
  res.send("Servidor de chat com Socket.IO funcionando!");
});

io.on("connection", (socket) => {
  console.log("Usuário conectado");
  let messages = [];

  io.emit("new user entered", {});

  // Espera receber um objeto { user, message }
  socket.on("chat message", (data) => {
    console.log(`Mensagem recebida: ${JSON.stringify(data)}`);
    messages.push(data);
    io.emit("chat message", data);
  });

  socket.on("disconnect", () => {
    console.log("Usuário desconectado");
  });
});

const PORT = process.env.PORT || 8080;
http.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
