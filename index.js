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

// ===== ОГРАНИЧЕНИЕ ПАМЯТИ =====
const MAX_MESSAGES = 20;

function trimHistory(history) {
  if (history.length > MAX_MESSAGES) {
    return history.slice(-MAX_MESSAGES);
  }
  return history;
}

// ===== AI =====
async function askAI(messages) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return "❌ Нет OPENROUTER_API_KEY";
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: messages
      })
    });

    const data = await res.json();

    return data.choices?.[0]?.message?.content || "Ошибка AI";
  } catch (err) {
    return "Ошибка сервера";
  }
}

// ===== API =====

// история
app.get("/api/history", (req, res) => {
  const userId = req.query.user_id;
  const db = loadDB();

  if (!db.users[userId]) {
    return res.json([]);
  }

  res.json(db.users[userId]);
});

// чат
app.post("/api/chat", async (req, res) => {
  const { message, user_id } = req.body;

  if (!user_id) {
    return res.json({ reply: "Ошибка: нет user_id" });
  }

  const db = loadDB();

  if (!db.users[user_id]) {
    db.users[user_id] = [];
  }

  let userHistory = db.users[user_id];

  // ➕ пользователь
  userHistory.push({ role: "user", content: message });

  userHistory = trimHistory(userHistory);

  const messages = userHistory.map(m => ({
    role: m.role,
    content: m.content
  }));

  const reply = await askAI(messages);

  // ➕ бот
  userHistory.push({ role: "assistant", content: reply });

  userHistory = trimHistory(userHistory);

  db.users[user_id] = userHistory;

  saveDB(db);

  res.json({
    reply: reply,
    buttons: []
  });
});

// ===== СТАРТ =====
app.listen(PORT, () => {
  console.log("🚀 Server started on port " + PORT);
});
