import express from "express";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const DB_FILE = "data.json";

// загрузка базы
function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

// сохранение
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// поиск компании
function findCompany(query, companies) {
  query = query.toLowerCase();

  return companies.find(c =>
    c.name.toLowerCase().includes(query) ||
    c.type.toLowerCase().includes(query)
  );
}

// простой "ИИ"
function generateSmartReply(message, lastCompany) {
  const text = message.toLowerCase();

  // базовое общение
  if (text.includes("привет")) return "Привет! 👋 Я помогу найти компанию или отвечу на вопросы.";
  if (text.includes("спасибо")) return "Всегда пожалуйста 😊";
  if (text.includes("как дела")) return "Отлично! Готов помочь 💪";

  // работа с контекстом
  if (lastCompany) {
    if (text.includes("телефон")) return `📞 ${lastCompany.phone}`;
    if (text.includes("адрес")) return `📍 ${lastCompany.address}`;
    if (text.includes("время") || text.includes("часы")) return `⏰ ${lastCompany.hours}`;
  }

  // fallback
  return "Я могу найти компанию или подсказать информацию. Попробуй написать название или тип 👍";
}

// API
app.post("/api/chat", (req, res) => {
  const userMessage = req.body.message;
  const db = loadDB();

  const company = findCompany(userMessage, db.companies);

  let reply;

  if (company) {
    reply =
`🏢 ${company.name}
📍 ${company.address}
⏰ ${company.hours}
📞 ${company.phone}`;

    // сохраняем как последний контекст
    db.lastCompany = company;

  } else {
    reply = generateSmartReply(userMessage, db.lastCompany);
  }

  db.messages.push({
    user: userMessage,
    bot: reply,
    time: Date.now()
  });

  saveDB(db);

  res.json({ reply });
});

// история
app.get("/api/history", (req, res) => {
  const db = loadDB();
  res.json(db.messages.slice(-20));
});

app.listen(PORT, () => {
  console.log("Server started on " + PORT);
});
