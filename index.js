import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🧠 память по пользователям
const userMemory = {};

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.post("/chat", async (req, res) => {
  try {
    const { message, userId } = req.body;

    // если нет userId — создаём дефолт
    const id = userId || "default";

    // если у пользователя нет истории — создаём
    if (!userMemory[id]) {
      userMemory[id] = [
        {
          role: "system",
          content: "Ты помощник на сайте. Отвечай коротко и понятно."
        }
      ];
    }

    // добавляем сообщение пользователя
    userMemory[id].push({
      role: "user",
      content: message
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: userMemory[id]
      })
    });

    const data = await response.json();

    const botReply = data.choices?.[0]?.message?.content || "Нет ответа";

    // сохраняем ответ
    userMemory[id].push({
      role: "assistant",
      content: botReply
    });

    res.json({ reply: botReply });

  } catch (error) {
    console.log(error);
    res.status(500).json({ reply: "Ошибка сервера" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
