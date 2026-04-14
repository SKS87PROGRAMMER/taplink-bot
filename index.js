import express from "express";
import fs from "fs";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const DB_FILE = "data.json";

// ===== БАЗА =====
function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ===== УМНЫЙ ПОИСК =====
function findCompanySmart(query, companies) {
  query = query.toLowerCase();

  return companies.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.type.toLowerCase().includes(query)
  );
}

// ===== AI (OPENROUTER) =====
async function askAI(message, companies) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return "❌ Нет OPENROUTER_API_KEY";
    }

    // добавляем базу в контекст
    const companiesText = companies.map(c =>
      `${c.name} (${c.type}) — ${c.address}, ${c.hours}, ${c.phone}`
    ).join("\n");

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://taplink.cc",
        "X-Title": "Chikoy App"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
`Ты помощник справочника.

Вот список компаний:
${companiesText}

Правила:
- Если вопрос связан с компаниями — используй этот список
- Отвечай кратко
- Можешь рекомендовать`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await res.json();

    if (!data.choices) {
      console.log("OPENROUTER ERROR:", data);
      return "⚠️ Ошибка AI (смотри логи)";
    }

    return data.choices[0].message.content;

  } catch (e) {
    console.log("FETCH ERROR:", e);
    return "❌ Ошибка подключения к AI";
  }
}

// ===== API =====
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;
  const db = loadDB();

  const found = findCompanySmart(userMessage, db.companies);

  let reply;
  let buttons = [];

  if (found.length > 0) {
    const c = found[0];

    reply =
`🏢 ${c.name}
📍 ${c.address}
⏰ ${c.hours}
📞 ${c.phone}`;

    buttons = [
      { text: "Позвонить", action: `tel:${c.phone}` },
      { text: "Карта", action: `https://maps.google.com/?q=${encodeURIComponent(c.address)}` }
    ];

    db.lastCompany = c;

  } else {
    // AI с учетом базы
    reply = await askAI(userMessage, db.companies);
  }

  db.messages.push({
    user: userMessage,
    bot: reply,
    buttons,
    time: Date.now()
  });

  saveDB(db);

  res.json({ reply, buttons });
});

// ===== ИСТОРИЯ =====
app.get("/api/history", (req, res) => {
  const db = loadDB();
  res.json(db.messages.slice(-20));
});

app.listen(PORT, () => {
  console.log("Server started on " + PORT);
});
