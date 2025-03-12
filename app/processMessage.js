const axios = require("axios");

/**
 * @description Descrição da decideTolkyResponse.
 * @param {Object} req
 * @return {{ data: object, error: String }} req
 */
const decideTolkyResponse = async (req) => {
  let msg = `Entrando em decideTolkyResponse()...`;
  console.log(msg);
  try {
    let message = req?.message;
    let contextData = JSON.stringify(req?.messages);
    let data = null;

    // Usar regex para verificar se existe '@tolky' na mensagem. Se sim, retornar 'true'.
    let isTolky = /@tolky/i.test(message);
    if (isTolky) {
      let { data: tolkyResponse, error } = await callTolky({
        question: message,
        contextData,
      });
      if (error) {
        throw new Error(error);
      }

      data = tolkyResponse;
    }

    return { data, error: null };
  } catch (e) {
    let err = `${e?.message}\nStack:\n${e?.stack}`;
    let errMsg = `ERRO: decideTolkyResponse() ->` + err;
    console.error(errMsg);
    return { data: null, error: errMsg };
  }
};

/**
 * @description Chamar o tolky.
 * @param {Object} req
 * @param {String} req.question
 * @return {{ data: object, error: String }} req
 */
const callTolky = async (req) => {
  let msg = `Entrando em callTolky()...`;
  console.log(msg);
  try {
    const question = req?.question;
    const contextData = `--- <group_message_instructions> A seguir, os dados de contexto. Esta mensagem é uma mensagem enviada por alguém em um grupo. A pesar dos dados do usuário associado a esta conversa via sistema, neste caso o dado de usuário que está válido é o que vem nesta parte do contexto: ${req?.contextData} </group_message_instructions>`;
    const userName = req?.userName;
    async function callTolkyReasoning() {
      const url =
        "https://api-dev.tolky.to/api/externalAPIs/public/tolkyReasoning";
      const token = "J0AsPSblS1pCJmuLJsS1SJM9dMUvR0DNWnqvY6OEiqS"; // Token de autorização

      const promptDdata = {
        question,
        originalDIalogue: [],
        sessionId: "2fb5ff4a-f114-47f1-9cb8-53227090f128",
        conversationId: "358020f7-f8bc-4909-87f8-1c6b9740f3a3",
        contextData,
        dialogueInsertString: null,
        returnDialogue: false,
        userData: {
          externalUserId: null,
          tolkyUserId: null,
          tolkyLeadId: null,
          userName,
          email: null,
          phone: null,
        },
      };

      try {
        const response = await axios.post(url, promptDdata, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Response data:", response.data);
        return {
          assistantResponse: response?.data?.data?.assistantResponse?.string,
        };
      } catch (error) {
        console.error(
          "Erro ao chamar a API Tolky Reasoning:",
          error.response ? error.response.data : error.message
        );
        throw error;
      }
    }

    let data = await callTolkyReasoning({});
    return { data, error: null };
  } catch (e) {
    let err = `${e?.message}\nStack:\n${e?.stack}`;
    let errMsg = `ERRO: callTolky() ->` + err;
    console.error(errMsg);
    return { data: null, error: errMsg };
  }
};

module.exports = { decideTolkyResponse };
