import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* 🧠 память пользователей */
const userMemory = {};

/* 🔍 простой справочник */
function findMatches(message) {
  const text = message.toLowerCase();

  if (text.includes("страх")) {
    return [
      {
        category: "Автострахование",
        companies: [
          {
            name: "АльфаСтрахование",
            desc: "ОСАГО и КАСКО",
            phone: "+79991234567",
            site: "https://alfastrah.ru"
          },
          {
            name: "Росгосстрах",
            desc: "Все виды автострахования",
            phone: "+79997654321",
            site: "https://rgs.ru"
          }
        ]
      }
    ];
  }

  return [];
}

/* 🤖 API */
app.post("/chat", async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message || !userId) {
      return res.json({ type: "text", reply: "Ошибка запроса" });
    }

    /* 🧠 создаём память */
    if (!userMemory[userId]) {
      userMemory[userId] = [];
    }

    /* сохраняем сообщение */
    userMemory[userId].push({
      role: "user",
      content: message
    });

    /* 🔍 сначала ищем в справочнике */
    const matches = findMatches(message);

    if (matches.length > 0) {
      return res.json({
        type: "cards",
        data: matches
      });
    }

    /* 🧠 берём последние 10 сообщений */
    const history = userMemory[userId].slice(-10);

    let reply = "Ошибка ИИ 😢";

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Ты помощник справочника. Учитывай предыдущие сообщения и отвечай по делу."
            },
            ...history
          ]
        })
      });

      const data = await response.json();

      reply = data?.choices?.[0]?.message?.content || "Нет ответа";

    } catch (err) {
      console.error("AI ERROR:", err);
      reply = "ИИ временно недоступен 😢";
    }

    /* сохраняем ответ */
    userMemory[userId].push({
      role: "assistant",
      content: reply
    });

    res.json({
      type: "text",
      reply
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.json({ type: "text", reply: "Ошибка сервера 😢" });
  }
});

/* 🚀 запуск */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
