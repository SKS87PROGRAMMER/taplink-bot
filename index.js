import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// 🔥 фикс для Taplink (iframe)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});

// 📁 раздаём chat.html
app.use(express.static("public"));

// 🧠 память пользователей (простая)
const userMemory = {};

// 🟢 проверка сервера (для пинга)
app.get("/", (req, res) => {
  res.send("OK");
});

// 🤖 чат
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.ip;

    if (!message) {
      return res.json({ reply: "Пустое сообщение 🤔" });
    }

    if (!userMemory[userId]) {
      userMemory[userId] = [];
    }

    userMemory[userId].push({
      role: "user",
      content: message
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // 🔥 более стабильная модель
        model: "gpt-4.1-mini",
        messages: userMemory[userId],
        temperature: 0.7
      })
    });

    const data = await response.json();

    // 🔍 лог для отладки
    console.log("OPENAI RESPONSE:", JSON.stringify(data, null, 2));

    // ❌ если ошибка от OpenAI
    if (data.error) {
      return res.json({
        reply: "Ошибка API 😢: " + data.error.message
      });
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      "Не удалось получить ответ 😢";

    userMemory[userId].push({
      role: "assistant",
      content: reply
    });

    res.json({ reply });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.json({ reply: "Ошибка сервера 😢" });
  }
});

// 🚀 запуск
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
