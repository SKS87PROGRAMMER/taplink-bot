app.get("/api/history", (req, res) => {
  const userId = req.query.user_id;
  const db = loadDB();

  if (!db.users[userId]) {
    return res.json([]);
  }

  res.json(db.users[userId]);
});

app.post("/api/chat", async (req, res) => {
  const { message, user_id } = req.body;

  if (!user_id) {
    return res.json({ reply: "Ошибка: нет user_id" });
  }

  const db = loadDB();

  if (!db.users[user_id]) {
    db.users[user_id] = [];
  }

  const userHistory = db.users[user_id];

  // добавляем сообщение пользователя
  userHistory.push({ role: "user", content: message });

  // формируем messages для AI
  const messages = userHistory.map(m => ({
    role: m.role,
    content: m.content
  }));

  const reply = await askAI(messages);

  // добавляем ответ бота
  userHistory.push({ role: "assistant", content: reply });

  // сохраняем
  saveDB(db);

  res.json({
    reply: reply,
    buttons: []
  });
});
