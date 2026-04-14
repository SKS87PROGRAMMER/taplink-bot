import express from "express";
import fs from "fs";

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

// ===== ПОИСК =====
function findCompanySmart(query, companies) {
  query = query.toLowerCase();

  return companies.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.type.toLowerCase().includes(query)
  );
}

// ===== AI =====
async function askAI(message, context) {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Ты умный помощник справочника компаний. Отвечай кратко и по делу."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Ошибка AI 🤖";
  } catch (e) {
    return "Ошибка подключения к AI 😕";
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
      { text: "Открыть карту", action: `https://maps.google.com/?q=${encodeURIComponent(c.address)}` }
    ];

    db.lastCompany = c;

  } else {
    // если не нашли — подключаем AI
    reply = await askAI(userMessage, db.lastCompany);
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

// история
app.get("/api/history", (req, res) => {
  const db = loadDB();
  res.json(db.messages.slice(-20));
});

app.listen(PORT, () => {
  console.log("Server started on " + PORT);
});
