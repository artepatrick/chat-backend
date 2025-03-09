const express = require("express");
const app = express();
const http = require("http").createServer(app);
const cors = require("cors");
const { wppSend } = require("./app/wppSend");
const { decideTolkyResponse } = require("./app/processMessage");

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

// Variáveis globais para armazenar mensagens e usuários conectados
const messages = [];
const connectedUsers = {};

// Função para atualizar e emitir as estatísticas (total de mensagens e usuários conectados)
function updateStats() {
  io.emit("stats", {
    messagesCount: messages.length,
    usersCount: Object.keys(connectedUsers).length,
  });
}

// Função para emitir a lista de nomes dos usuários conectados
function updateUserList() {
  // Extrai os nomes dos usuários conectados
  const userList = Object.values(connectedUsers);
  io.emit("users", userList);
}

io.on("connection", (socket) => {
  console.log("Usuário conectado: ", socket.id);

  wppSend().then((res) => {
    console.log(`Aviso enviado ao Whatssap sobre a entrada de alguém na sala`);
  });

  // Adiciona o usuário com um nome padrão "anônimo"
  connectedUsers[socket.id] = "anônimo";

  // Envia o histórico de mensagens para o novo usuário
  socket.emit("chat history", messages);

  // Atualiza as estatísticas e a lista de usuários para todos
  updateStats();
  updateUserList();

  // Emite um aviso de novo usuário entrando na sala
  io.emit("new user entered", { user: connectedUsers[socket.id] });

  // Ao receber uma mensagem
  socket.on("chat message", (data) => {
    console.log(`Mensagem recebida: ${JSON.stringify(data)}`);

    // Se o usuário não for informado, mantém como "anônimo"
    if (!data.user || data.user === "") {
      data.user = null;
    }

    let params = {
      messages,
      message: data?.message,
    };

    decideTolkyResponse(params).then((res) => {
      console.log(`Resposta do Tolky: ${JSON.stringify(res)}`);
      io.emit("chat message", {
        user: "tolky",
        message: res?.data?.assistantResponse,
      });
    });

    // Atualiza o nome do usuário para este socket (permite atualização em tempo real)
    connectedUsers[socket.id] = data.user;

    // Salva a mensagem no histórico global
    messages.push(data);

    // Emite a mensagem para todos os clientes conectados
    io.emit("chat message", data);

    // Atualiza estatísticas e lista de usuários
    updateStats();
    updateUserList();
  });

  // Ao desconectar
  socket.on("disconnect", () => {
    console.log("Usuário desconectado: ", socket.id);
    io.emit("user desconected", { user: connectedUsers[socket.id] });
    // Remove o usuário desconectado da lista
    delete connectedUsers[socket.id];
    updateStats();
    updateUserList();
  });
});

const PORT = process.env.PORT || 8080;
http.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
