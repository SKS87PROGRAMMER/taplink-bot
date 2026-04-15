import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_KEY = "ТВОЙ_OPENAI_API_KEY";

app.post("/ai", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Ты полезный помощник." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    res.json({
      answer: data.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка AI");
  }
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
