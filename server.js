import express from "express";
import cors from "cors";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 ВАЖНО — раздача файлов
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// главная
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// AI endpoint
app.post("/ai", async (req, res) => {
  try {
    const { message } = req.body;

    const answer = "AI думает 🤖: " + message;

    res.json({ answer });

  } catch (err) {
    console.error(err);
    res.status(500).json({ answer: "Ошибка 😢" });
  }
});

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
