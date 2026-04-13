import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// 🔥 ВАЖНО — разрешаем iframe (Taplink)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});

// 📁 раздаём статические файлы (chat.html)
app.use(express.static("public"));

// 🧠 память пользователей
const userMemory = {};

// 🤖 чат endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  // 👤 определяем пользователя (можно улучшить позже)
  const userId = req.ip;

  if (!userMemory[userId]) {
    userMemory[userId] = [];
  }

  // сохраняем сообщение
  userMemory[userId].push({ role: "user", content: message });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: userMemory[userId]
      })
    });

    const data = await response.json();

    const reply = data.choices?.[0]?.message?.content || "Ошибка 😢";

    // сохраняем ответ
    userMemory[userId].push({ role: "assistant", content: reply });

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Ошибка сервера 😢" });
  }
});

// 🚀 запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
