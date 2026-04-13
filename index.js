import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// 🔥 iframe фикс (Taplink)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});

// 📁 статика
app.use(express.static("public"));

// 🧠 память
const userMemory = {};

// 🟢 проверка
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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-site.com",
        "X-Title": "Chikoy App"
      },
      body: JSON.stringify({
        // 🔥 стабильная модель OpenRouter
        model: "openai/gpt-4.1-mini",
        messages: userMemory[userId]
      })
    });

    const data = await response.json();

    console.log("OPENROUTER:", JSON.stringify(data, null, 2));

    if (data.error) {
      return res.json({
        reply: "Ошибка API 😢: " + data.error.message
      });
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      "Нет ответа 😢";

    userMemory[userId].push({
      role: "assistant",
      content: reply
    });

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Ошибка сервера 😢" });
  }
});

// 🚀 запуск
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
