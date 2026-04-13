import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* 🧠 СПРАВОЧНИК */
const directory = [
  {
    category: "Автострахование",
    keywords: ["страховка", "осаго", "каско", "страх", "автострах"],
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
  },
  {
    category: "Салоны красоты",
    keywords: ["маникюр", "ногти", "стрижка"],
    companies: [
      {
        name: "Beauty Studio",
        desc: "Маникюр и уход",
        phone: "+79990001122",
        site: "https://example.com"
      }
    ]
  }
];

/* 🔍 ПОИСК */
function findMatches(message) {
  const text = message.toLowerCase();
  let results = [];

  for (const item of directory) {
    for (const key of item.keywords) {
      if (text.includes(key)) {
        results.push(item);
        break;
      }
    }
  }

  return results;
}

/* 🤖 API */
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const matches = findMatches(message);

    // ✅ если нашли — отдаём карточки
    if (matches.length > 0) {
      return res.json({
        type: "cards",
        data: matches
      });
    }

    // 🤖 если не нашли — ИИ
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content: "Ты помощник справочника. Если не знаешь — предложи уточнить запрос."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    res.json({
      type: "text",
      reply: data.choices?.[0]?.message?.content || "Ничего не найдено 😢"
    });

  } catch (e) {
    console.error(e);
    res.json({ type: "text", reply: "Ошибка сервера 😢" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
