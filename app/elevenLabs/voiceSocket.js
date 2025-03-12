const WebSocket = require("ws");

// Configurações da ElevenLabs
const ELEVEN_LABS_KEY = process.env.ELEVEN_LABS_KEY;
const VOICE_ID = "oJebhZNaPllxk6W0LSBA";
const MODEL = "eleven_turbo_v2_5";
const LANG = "pt";
const wsUrl = `wss://api.elevenlabs.io/v1/voices/${VOICE_ID}/stream?model=${MODEL}&lang=${LANG}&logging=true`;
const PORT = process.env.PORT || 8081;

// server.js
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const tolkyReasoning = require("./tolkyReasoning"); // função importada que processa a pergunta
const express = require("express");
const app = express();
const cors = require("cors");
app.use(
  cors({
    origin: "https://chat-frontend.fly.dev",
  })
);

// Cria o servidor HTTP
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Backend de voz rodando.");
});

// Inicializa o Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Quando um cliente se conecta via Socket.IO
io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  // Evento para receber a pergunta (texto transcrito) do cliente
  socket.on("question", async (data) => {
    const questionText = data.text;
    console.log("Pergunta recebida:", questionText);

    try {
      // Gera a resposta usando a função importada
      const answerText = await tolkyReasoning(questionText);
      console.log("Resposta gerada:", answerText);

      // Conecta ao ElevenLabs via WebSocket
      // A URL abaixo é um exemplo; consulte a documentação e ajuste os parâmetros conforme sua necessidade.
      const elevenLabsUrl = wsUrl; // `wss://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`;
      const elevenWs = new WebSocket(elevenLabsUrl, {
        headers: {
          "xi-api-key": ELEVEN_LABS_KEY,
        },
      });

      // Quando a conexão com o ElevenLabs estiver aberta
      elevenWs.on("open", () => {
        console.log("Conectado ao ElevenLabs via WebSocket");

        // Primeira mensagem: envia um espaço para inicializar conforme documentação
        const initMessage = JSON.stringify({ text: " ", flush: false });
        elevenWs.send(initMessage);

        // Em seguida, envia o texto da resposta com um espaço final (conforme exigido) e o comando flush
        const answerMessage = JSON.stringify({
          text: answerText + " ",
          flush: true,
        });
        elevenWs.send(answerMessage);
      });

      // Ao receber mensagens (chunks de áudio) do ElevenLabs
      elevenWs.on("message", (data) => {
        let message;
        try {
          message = JSON.parse(data);
        } catch (error) {
          console.error("Erro ao parsear mensagem do ElevenLabs:", error);
          return;
        }

        // Se o chunk de áudio estiver presente, encaminha para o cliente
        if (message.audio) {
          // O áudio é enviado como string base64 (por padrão em MP3)
          socket.emit("audioChunk", { audio: message.audio });
        }

        // Se a mensagem indicar que a geração está completa, sinaliza o fim da transmissão
        if (message.complete === true) {
          socket.emit("audioComplete", { message: "Áudio finalizado" });
          elevenWs.close();
        }
      });

      elevenWs.on("error", (err) => {
        console.error("Erro na conexão com o ElevenLabs:", err);
        socket.emit("error", {
          message: "Erro na conexão com o serviço de voz.",
        });
      });
    } catch (error) {
      console.error("Erro ao processar a pergunta:", error);
      socket.emit("error", { message: "Erro ao processar sua pergunta." });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

// Inicia o servidor
PORT = "8081";
server.listen(PORT, () => {
  console.log(`Servidor 2 rodando na porta ${PORT}`);
});
