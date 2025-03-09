/**
 * @description Envia uma notificação fixa via API externa.
 * @param {Object} req
 * @return {Promise<{ data: object, error: String }>}
 */
const axios = require("axios");

const wppSend = async () => {
  let msg = `Entrando em wppSend()...`;
  console.log(msg);
  try {
    const response = await axios({
      method: "post",
      url: "https://api-dev.tolky.to/api/externalAPIs/public/externalNotificationFixed",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer J0AsPSblS1pCJmuLJsS1SJM9dMUvR0DNWnqvY6OEiqS",
      },
      data: {
        data: [
          {
            userName: "Patrick",
            phone: "(31)991391722",
          },
        ],
        fixedMessage: "Entrou alguém aqui! https://chat-frontend.fly.dev/",
      },
    });
    const data = response.data;
    return { data, error: null };
  } catch (e) {
    let err = `${e?.message}\nStack:\n${e?.stack}`;
    let errMsg = `ERRO: wppSend() ->` + err;
    console.error(errMsg);
    return { data: null, error: errMsg };
  }
};

module.exports = { wppSend };
