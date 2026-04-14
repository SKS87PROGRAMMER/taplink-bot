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

// ===== AI (OPENROUTER) =====
async function askAI(messages) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return "❌ Нет OPENROUTER_API_KEY";
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://taplink.cc",
        "X-Title": "Chikoy Chat"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o"
        messages: messages
      })
    });

    const data = await res.json();

    if (!data.choices) {
      console.log("AI ERROR:", data);
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

  // последние 10 сообщений для контекста
  const history = db.messages.slice(-10).flatMap(m => ([
    { role: "user", content: m.user },
    { role: "assistant", content: m.bot }
  ]));

  const messages = [
    {
      role: "system",
      content: "Ты дружелюбный чат-помощник. Отвечай просто, понятно и по делу."
    },
    ...history,
    {
      role: "user",
      content: userMessage
    }
  ];

  const reply = await askAI(messages);

  db.messages.push({
    user: userMessage,
    bot: reply,
    time: Date.now()
  });

  saveDB(db);

  res.json({ reply, buttons: [] });
});

// ===== ИСТОРИЯ =====
app.get("/api/history", (req, res) => {
  const db = loadDB();
  res.json(db.messages.slice(-20));
});

app.listen(PORT, () => {
  console.log("Server started on " + PORT);
});
