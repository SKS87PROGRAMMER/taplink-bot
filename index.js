import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// чтобы принимать JSON
app.use(express.json());

// подключаем фронт
app.use(express.static("public"));

// простая "память" (временно)
let messages = [];

// API чата
app.post("/api/chat", (req, res) => {
  const userMessage = req.body.message;

  let reply = "Я пока думаю 🤔";

  // примитивный "умный справочник"
  if (userMessage.toLowerCase().includes("магазин")) {
    reply = "🛒 Магазин: Чикой Маркет\n📍 Адрес: центр города\n⏰ 09:00–21:00";
  } else if (userMessage.toLowerCase().includes("сервис")) {
    reply = "🔧 Сервис: Чикой Сервис\n📍 Ремонт техники\n📞 +7 XXX XXX";
  } else {
    reply = "Попробуй спросить про: магазин или сервис";
  }

  messages.push({ user: userMessage, bot: reply });

  res.json({ reply });
});

// тест
app.get("/api/test", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
