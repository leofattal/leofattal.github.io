// Magic Stickman Battle - Player Movement Added

const words = ["fire", "zap", "heal", "shield", "storm", "frost", "flame", "light"];
const input = document.getElementById("input");
const enemyWordEl = document.getElementById("enemyWord");
const playerHealth = document.getElementById("playerHealth");
const enemyHealth = document.getElementById("enemyHealth");
const canvas = document.getElementById("battlefield");
const ctx = canvas.getContext("2d");

let currentWord = "";
let playerHP = 100;
let enemyHP = 100;
let timeLeft = 10;
let timerInterval = null;

let effectActive = false;
let effectType = "";

// Player movement
let playerX = 80;

function randomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

function updateHealthBars() {
  playerHealth.style.width = playerHP + "%";
  enemyHealth.style.width = enemyHP + "%";
}

function drawBattle() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player Stickman
  ctx.strokeStyle = "white";
  ctx.beginPath(); ctx.arc(playerX, 60, 20, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(playerX, 80); ctx.lineTo(playerX, 130); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(playerX, 90); ctx.lineTo(playerX - 20, 110); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(playerX, 90); ctx.lineTo(playerX + 20, 110); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(playerX, 130); ctx.lineTo(playerX - 20, 160); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(playerX, 130); ctx.lineTo(playerX + 20, 160); ctx.stroke();

  // Enemy Stickman
  ctx.strokeStyle = "red";
  ctx.beginPath(); ctx.arc(320, 60, 20, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(320, 80); ctx.lineTo(320, 130); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(320, 90); ctx.lineTo(300, 110); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(320, 90); ctx.lineTo(340, 110); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(320, 130); ctx.lineTo(300, 160); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(320, 130); ctx.lineTo(340, 160); ctx.stroke();

  // Cast animation
  if (effectActive) {
    let color = "white";
    if (effectType === "fire" || effectType === "flame") color = "orange";
    else if (effectType === "zap" || effectType === "light") color = "cyan";
    else if (effectType === "frost") color = "lightblue";
    else if (effectType === "storm") color = "purple";
    else if (effectType === "heal") color = "lime";
    else if (effectType === "shield") color = "gold";

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(playerX + 20, 100);
    ctx.lineTo(300, 100);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // Draw timer
  ctx.fillStyle = "white";
  ctx.font = "16px sans-serif";
  ctx.fillText(`Time left: ${timeLeft}s`, 160, 20);
}

function launchEffect(spell) {
  effectType = spell;
  effectActive = true;
  drawBattle();
  setTimeout(() => {
    effectActive = false;
    drawBattle();
  }, 500);
}

function shakeScreen() {
  const original = canvas.style.transform;
  let i = 0;
  const interval = setInterval(() => {
    canvas.style.transform = `translate(${Math.random() * 8 - 4}px, ${Math.random() * 8 - 4}px)`;
    i++;
    if (i > 10) {
      clearInterval(interval);
      canvas.style.transform = original;
    }
  }, 30);
}

function enemyAttack() {
  effectType = "storm";
  effectActive = true;
  shakeScreen();
  drawBattle();
  setTimeout(() => {
    effectActive = false;
    playerHP -= 10;
    if (playerHP < 0) playerHP = 0;
    updateHealthBars();
    drawBattle();
    if (playerHP === 0) {
      clearInterval(timerInterval);
      alert("You were defeated 😵");
    }
    startTimer();
  }, 500);
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 10;
  timerInterval = setInterval(() => {
    timeLeft--;
    drawBattle();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      playerHP -= 10;
      if (playerHP < 0) playerHP = 0;
      updateHealthBars();
      drawBattle();
      alert("Time's up! You got hit!");
      if (playerHP === 0) {
        alert("You were defeated 😵");
      } else {
        enemyAttack();
      }
    }
  }, 1000);
}

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const typed = input.value.trim().toLowerCase();
    clearInterval(timerInterval);
    if (typed === currentWord) {
      if (typed === "heal") {
        playerHP += 20;
        if (playerHP > 100) playerHP = 100;
      } else {
        enemyHP -= 20;
        if (enemyHP < 0) enemyHP = 0;
      }
      currentWord = randomWord();
      enemyWordEl.textContent = currentWord;
      input.value = "";
      launchEffect(typed);
      updateHealthBars();
      drawBattle();
      if (enemyHP === 0) {
        alert("You won the battle! 🎉");
      } else {
        setTimeout(enemyAttack, 700);
      }
    } else {
      input.value = "";
      playerHP -= 10;
      if (playerHP < 0) playerHP = 0;
      updateHealthBars();
      drawBattle();
      if (playerHP === 0) {
        alert("You were defeated 😵");
      } else {
        alert("Wrong spell! You got hit!");
        setTimeout(enemyAttack, 500);
      }
    }
  }
});

// Player movement (arrow keys)
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    playerX -= 10;
    if (playerX < 40) playerX = 40;
    drawBattle();
  } else if (e.key === "ArrowRight") {
    playerX += 10;
    if (playerX > 120) playerX = 120;
    drawBattle();
  }
});

function startGame() {
  currentWord = randomWord();
  enemyWordEl.textContent = currentWord;
  updateHealthBars();
  drawBattle();
  startTimer();
}

startGame();