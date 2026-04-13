import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.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}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo", // можно потом поменять
        messages: [
          {
            role: "system",
            content: "Ты помощник на сайте. Отвечай коротко и понятно."
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    const data = await response.json();

    console.log(data); // 👈 поможет если ошибка

    res.json({
      reply: data.choices?.[0]?.message?.content || "Нет ответа"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ reply: "Ошибка сервера" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
