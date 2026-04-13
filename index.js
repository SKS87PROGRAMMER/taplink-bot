import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* 🧠 память */
const userMemory = {};

/* тестовый справочник */
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
          }
        ]
      }
    ];
  }

  return [];
}

app.post("/chat", async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!userMemory[userId]) {
      userMemory[userId] = [];
    }

    userMemory[userId].push({
      role: "user",
      content: message
    });

    const matches = findMatches(message);

    if (matches.length > 0) {
      return res.json({
        type: "cards",
        data: matches
      });
    }

    const history = userMemory[userId].slice(-10);

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
            content: "Ты помощник справочника. Учитывай прошлые сообщения."
          },
          ...history
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Ничего не найдено";

    userMemory[userId].push({
      role: "assistant",
      content: reply
    });

    res.json({ type: "text", reply });

  } catch (e) {
    console.error(e);
    res.json({ type: "text", reply: "Ошибка сервера 😢" });
  }
});

app.listen(3000, () => console.log("Server running"));
