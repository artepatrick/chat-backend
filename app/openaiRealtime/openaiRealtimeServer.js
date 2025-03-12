// server.js
import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

// Configuração: defina sua chave de API da OpenAI na variável de ambiente OPENAI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("Defina a variável OPENAI_API_KEY em seu ambiente.");
  process.exit(1);
}

// Função para conectar à API Realtime da OpenAI
function connectToOpenAI() {
  const openaiUrl =
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
  const headers = {
    Authorization: "Bearer " + OPENAI_API_KEY,
    "OpenAI-Beta": "realtime=v1",
  };
  return new WebSocket(openaiUrl, { headers });
}

// Cria o servidor WebSocket para o front-end na porta 8080
const server = new WebSocketServer({ port: 8080 }, () => {
  console.log("Servidor WebSocket rodando na porta 8080.");
});

server.on("connection", (clientSocket) => {
  console.log("Cliente conectado.");

  // Para cada conexão de cliente, conecta à API Realtime da OpenAI
  const openaiSocket = connectToOpenAI();

  openaiSocket.on("open", () => {
    console.log("Conectado à OpenAI Realtime API.");
    clientSocket.send(
      JSON.stringify({ message: "Conectado à OpenAI Realtime API." })
    );
  });

  // Encaminha mensagens da OpenAI para o cliente
  openaiSocket.on("message", (data) => {
    console.log("Openai mandou alguma coisa de volta: " + data);
    // Se a mensagem for texto, encaminha como string; caso contrário, trata como binário
    if (typeof data === "string") {
      clientSocket.send(data);
    } else {
      clientSocket.send(data);
    }
  });

  openaiSocket.on("error", (err) => {
    console.error("Erro na conexão com a OpenAI:", err);
    clientSocket.send(
      JSON.stringify({ error: "Erro na conexão com a OpenAI: " + err.message })
    );
  });

  openaiSocket.on("close", () => {
    console.log("Conexão com a OpenAI encerrada.");
    clientSocket.send(
      JSON.stringify({ message: "Conexão com a OpenAI encerrada." })
    );
  });

  // Trata as mensagens vindas do cliente
  clientSocket.on("message", (data) => {
    if (typeof data === "string") {
      // Encaminha diretamente a mensagem JSON enviada pelo client
      console.log("Mensagem do cliente: " + data);
      openaiSocket.send(data);
    } else {
      // Se for um chunk binário, encapsula e envia
      const base64Audio = data.toString("base64");
      const event = {
        event_id: uuidv4(),
        type: "input_audio_buffer.append",
        audio: base64Audio,
      };
      openaiSocket.send(JSON.stringify(event));
      console.log("Chunk de áudio encaminhado para a OpenAI.");
    }
  });

  clientSocket.on("close", () => {
    console.log("Cliente desconectado.");
    // Se o cliente desconectar, encerramos também a conexão com a OpenAI
    if (
      openaiSocket.readyState === WebSocket.OPEN ||
      openaiSocket.readyState === WebSocket.CONNECTING
    ) {
      openaiSocket.close();
    }
  });

  clientSocket.on("error", (err) => {
    console.error("Erro na conexão do cliente:", err);
  });
});
