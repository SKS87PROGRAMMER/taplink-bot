import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// проверка
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// 🤖 AI endpoint
app.post("/ai", async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages
      })
    });

    const data = await response.json();

    const answer =
      data.choices?.[0]?.message?.content || "Ошибка ответа 😢";

    res.json({ answer });

  } catch (err) {
    console.error(err);
    res.status(500).json({ answer: "Ошибка AI 😢" });
  }
});

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
