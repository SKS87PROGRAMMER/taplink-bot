import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// 🔥 фикс для Taplink iframe
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});

// 📁 статика
app.use(express.static("public"));

// 🧠 память пользователей
const userMemory = {};

// 🟢 проверка (для пинга)
app.get("/", (req, res) => {
  res.send("OK");
});

// 🤖 чат
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.ip;

    if (!message) {
      return res.json({ reply: "Напиши что-нибудь 🙂" });
    }

    if (!userMemory[userId]) {
      userMemory[userId] = [];
    }

    // сохраняем сообщение
    userMemory[userId].push({
      role: "user",
      content: message
    });

    // 🔥 ограничиваем память (последние 10 сообщений)
    if (userMemory[userId].length > 10) {
      userMemory[userId] = userMemory[userId].slice(-10);
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-site.com",
        "X-Title": "Chikoy App"
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini", // 🔥 стабильная модель
        messages: userMemory[userId],
        max_tokens: 500,              // 🔥 фикс ошибки кредитов
        temperature: 0.7
      })
    });

    const data = await response.json();

    console.log("OPENROUTER:", JSON.stringify(data, null, 2));

    // ❌ ошибка API
    if (data.error) {
      return res.json({
        reply: "Ошибка API 😢: " + data.error.message
      });
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      "Не смог ответить 😢";

    // сохраняем ответ
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
