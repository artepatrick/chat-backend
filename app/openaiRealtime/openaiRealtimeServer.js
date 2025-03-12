// server.js
import WebSocket from "ws";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

// Configuração do Express para servir os arquivos da interface
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Determina o diretório atual e configura a pasta 'public'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Conexão com a API Realtime da OpenAI via WebSocket
const realtimeUrl =
  "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
const realtimeWs = new WebSocket(realtimeUrl, {
  headers: {
    Authorization: "Bearer " + process.env.OPENAI_API_KEY,
    "OpenAI-Beta": "realtime=v1",
  },
});

realtimeWs.on("open", () => {
  console.log("Conectado à API Realtime da OpenAI.");
});

realtimeWs.on("message", (data) => {
  const message = JSON.parse(data.toString());
  console.log("Mensagem recebida da OpenAI:", message);
  // Encaminha as mensagens recebidas para todos os clientes conectados
  clientWss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
});

// Criação de um WebSocket server para os clientes (navegadores)
const clientWss = new WebSocket.Server({ server });

clientWss.on("connection", (clientSocket) => {
  console.log("Cliente conectado.");

  clientSocket.on("message", (message) => {
    console.log("Mensagem recebida do cliente:", message);
    // Aqui você pode decidir como processar os dados dos clientes.
    // Exemplo: encaminhar dados (como chunks de áudio) para a API Realtime
    realtimeWs.send(message);
  });

  clientSocket.on("close", () => {
    console.log("Cliente desconectado.");
  });
});

// Inicializa o servidor HTTP
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
