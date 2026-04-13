import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
Ты помощник сайта. Помогаешь найти услуги и разделы.
Отвечай коротко и понятно.
`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
    });

    res.json({
      reply: completion.choices[0].message.content,
    });

  } catch (e) {
    console.log(e);
    res.status(500).send("Ошибка");
  }
});

app.listen(3000, () => console.log("Server started"));
