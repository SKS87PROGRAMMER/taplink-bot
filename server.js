import express from "express";
import cors from "cors";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 ВАЖНО — раздача фронта
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// главная (если нет index.html)
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// 🤖 AI endpoint
app.post("/ai", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Ты полезный помощник. Отвечай кратко и понятно на русском."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    const answer = data.choices?.[0]?.message?.content || "Не знаю 😅";

    res.json({ answer });

  } catch (err) {
    console.error(err);
    res.status(500).json({ answer: "Ошибка AI 😢" });
  }
});

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
