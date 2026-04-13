import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // отдаём фронт

// 🧠 СПРАВОЧНИК
const directory = [
  {
    category: "Автострахование",
    keywords: ["страховка", "осаго", "каско", "страх", "автострах"],
    companies: [
      { name: "АльфаСтрахование", desc: "ОСАГО и КАСКО" },
      { name: "Росгосстрах", desc: "Все виды автострахования" }
    ]
  },
  {
    category: "Салоны красоты",
    keywords: ["маникюр", "ногти", "стрижка", "парикмахер"],
    companies: [
      { name: "Beauty Studio", desc: "Маникюр и уход" }
    ]
  },
  {
    category: "Автосервисы",
    keywords: ["ремонт авто", "сто", "шиномонтаж", "автосервис"],
    companies: [
      { name: "AutoFix", desc: "Ремонт и диагностика" }
    ]
  }
];

// 🔍 ПОИСК
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

// 🤖 API
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const matches = findMatches(message);

    let context = "";

    if (matches.length > 0) {
      context = `
Найдены категории:
${matches.map(m => `
📂 ${m.category}
${m.companies.map(c => `- ${c.name} (${c.desc})`).join("\n")}
`).join("\n")}
`;
    } else {
      context = "Ничего не найдено в справочнике.";
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `
Ты помощник справочника.

${context}

Правила:
- отвечай кратко
- показывай категории
- показывай компании
- не выдумывай данные
- если не найдено — предложи похожее
`
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
      reply: data.choices?.[0]?.message?.content || "Ошибка ответа 😢"
    });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Ошибка сервера 😢" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
