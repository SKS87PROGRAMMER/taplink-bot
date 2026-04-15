import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ОБЯЗАТЕЛЬНО для Railway
const PORT = process.env.PORT || 3000;

// тест
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// AI endpoint
app.post("/ai", async (req, res) => {
  const { message } = req.body;

  try {
    // пока простой ответ (проверка работы)
    const answer = "Ты спросил: " + message;

    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ answer: "Ошибка сервера 😢" });
  }
});

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
