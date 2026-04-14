<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Чат Чикой</title>

<style>
:root {
  --msg-size: 18px;
}

body {
  margin: 0;
  font-family: Arial;
  background: #e5ddd5;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 🔝 HEADER (ЗАКРЕПЛЁННЫЙ) */
#header {
  position: fixed;
  top: 0;
  width: 100%;
  padding: 10px;
  background: #cfd8df;
  z-index: 1000;
}

/* выравнивание */
.header-inner {
  max-width: 600px;
  margin: 0 auto;
}

/* кнопка назад */
.back-btn {
  display: block;
  width: 100%;
  text-align: center;
  background: #d9ccc2;
  padding: 16px;
  border-radius: 16px;

  text-decoration: none;
  color: black;
  font-weight: 700;
  font-size: 18px;
  text-transform: uppercase;

  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* ⋯ */
.menu-btn {
  position: absolute;
  right: 20px;
  top: 20px;
  font-size: 22px;
  cursor: pointer;
}

/* 💬 чат */
#chat {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  max-width: 600px;
  margin: 90px auto 0; /* отступ под фикс хедер */
}

/* сообщения */
.row {
  display: flex;
  align-items: flex-end;
  margin: 8px 0;

  opacity: 0;
  transform: translateY(10px) scale(0.98);
  animation: messageIn 0.25s ease forwards;
}

.user-row { justify-content: flex-end; }
.bot-row { justify-content: flex-start; }

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #ccc;
  margin: 0 6px;
}

.bubble {
  max-width: 75%;
  padding: 14px 18px;
  border-radius: 18px;
  font-size: var(--msg-size);
  line-height: 1.4;
}

.user {
  background: #0088cc;
  color: white;
}

.bot {
  background: white;
}

/* ✨ НОВАЯ АНИМАЦИЯ */
@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ввод */
#inputArea {
  display: flex;
  padding: 10px;
  background: #f0f0f0;
}

#input {
  flex: 1;
  padding: 14px;
  border-radius: 22px;
  border: none;
  font-size: var(--msg-size);
}

button {
  margin-left: 10px;
  border: none;
  background: #0088cc;
  color: white;
  padding: 14px 18px;
  border-radius: 22px;
  font-size: var(--msg-size);
}
</style>
</head>

<body>

<!-- 🔝 HEADER -->
<div id="header">
  <div class="header-inner">
    <a href="https://taplink.cc/chikoyapp" class="back-btn">НАЗАД</a>
  </div>
  <div class="menu-btn">⋯</div>
</div>

<!-- 💬 ЧАТ -->
<div id="chat"></div>

<!-- ⌨️ ВВОД -->
<div id="inputArea">
  <input id="input" placeholder="Сообщение..." />
  <button onclick="send()">➤</button>
</div>

<script>
const chat = document.getElementById("chat");

/* 🧠 userId */
let userId = localStorage.getItem("userId") || Date.now().toString();
localStorage.setItem("userId", userId);

/* сообщение */
function createMessage(text, sender) {
  const row = document.createElement("div");
  row.classList.add("row", sender + "-row");

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");

  const bubble = document.createElement("div");
  bubble.classList.add("bubble", sender);
  bubble.textContent = text;

  if (sender === "bot") {
    row.appendChild(avatar);
    row.appendChild(bubble);
  } else {
    row.appendChild(bubble);
    row.appendChild(avatar);
  }

  chat.appendChild(row);

  // гарантируем скролл вниз
  setTimeout(() => {
    row.scrollIntoView({ behavior: "smooth" });
  }, 50);
}

/* отправка */
async function send() {
  const input = document.getElementById("input");
  const text = input.value.trim();

  if (!text) return;

  createMessage(text, "user");
  input.value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      message: text,
      userId: userId
    })
  });

  const data = await res.json();

  createMessage(data.reply, "bot");
}

document.getElementById("input").addEventListener("keypress", e => {
  if (e.key === "Enter") send();
});
</script>

</body>
</html>
