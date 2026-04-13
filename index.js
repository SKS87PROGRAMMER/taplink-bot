import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // важно!

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
    });

    res.json({
      reply: response.choices[0].message.content
    });

  } catch (error) {
    console.log(error); // 👈 ОЧЕНЬ важно
    res.status(500).json({ reply: "Ошибка сервера" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
