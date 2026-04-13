import express from "express";
import cors from "cors";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// фиксим __dirname для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// проверка сервера
app.get("/", (req, res) => {
  res.send("Bot is running");
});

// чат
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Ты помощник сайта. Помогаешь найти услуги и куда нажать. Отвечай коротко."
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
    res.status(500).json({ reply: "Ошибка сервера" });
  }
});

// запуск
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
