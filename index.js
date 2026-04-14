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
  } else {
    reply = "Ничего не найдено 😕 Попробуй название или тип (магазин, сервис)";
  }

  db.messages.push({
    user: userMessage,
    bot: reply,
    time: Date.now()
  });

  saveDB(db);

  res.json({ reply });
});

// получить историю
app.get("/api/history", (req, res) => {
  const db = loadDB();
  res.json(db.messages.slice(-20));
});

app.listen(PORT, () => {
  console.log("Server started on " + PORT);
});
