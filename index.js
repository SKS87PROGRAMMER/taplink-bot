import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🧠 Хранилище диалога (в памяти)
let messages = [
  {
    role: "system",
    content: "Ты помощник на сайте. Отвечай коротко и понятно."
  }
];

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    // добавляем сообщение пользователя
    messages.push({
      role: "user",
      content: userMessage
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: messages
      })
    });

    const data = await response.json();

    const botReply = data.choices?.[0]?.message?.content || "Нет ответа";

    // добавляем ответ бота в память
    messages.push({
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
