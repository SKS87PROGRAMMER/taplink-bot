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
  if (!fs.existsSync(DB_FILE)) {
    return { users: {}, faq: [] };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ===== УМНЫЙ ПОИСК =====
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

function findAnswer(message, faq) {
  if (!Array.isArray(faq)) return null;

  const text = normalize(message);
  const words = text.split(" ").filter(w => w.length > 2);

  let bestMatch = null;
  let bestScore = 0;

  for (let item of faq) {
    const q = normalize(item.q);

    if (text === q) return item.a;

    let score = 0;
    for (let word of words) {
      if (q.includes(word)) score++;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (bestScore > 0) {
    return bestMatch.a;
  }

  return null;
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
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
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

// ===== ОБУЧЕНИЕ =====
app.post("/api/teach", (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.json({ status: "error" });
  }

  const db = loadDB();

  if (!db.faq) db.faq = [];

  db.faq.push({
    q: question,
    a: answer
  });

  saveDB(db);

  res.json({ status: "ok" });
});

// ===== ИСТОРИЯ =====
app.get("/api/history", (req, res) => {
  const userId = req.query.user_id;
  const db = loadDB();

  res.json(db.users[userId] || []);
});

// ===== ЧАТ =====
app.post("/api/chat", async (req, res) => {
  const { message, user_id } = req.body;

  if (!user_id) {
    return res.json({ reply: "Ошибка: нет user_id" });
  }

  const db = loadDB();

  if (!db.users[user_id]) {
    db.users[user_id] = [];
  }

  // ➕ пользователь
  db.users[user_id].push({ role: "user", content: message });

  // 🔎 сначала ищем в FAQ
  const faqReply = findAnswer(message, db.faq);

  if (faqReply) {
    db.users[user_id].push({ role: "assistant", content: faqReply });
    saveDB(db);

    return res.json({
      reply: faqReply,
      buttons: []
    });
  }

  // 🤖 если нет — идём в AI
  const messages = db.users[user_id];

  const reply = await askAI(messages);

  db.users[user_id].push({ role: "assistant", content: reply });

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
