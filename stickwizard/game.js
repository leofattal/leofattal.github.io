const prepWords = ["apple","chair","cloud","river","house"];
const spellWords = ["fire","zap","heal","shield","storm","frost","flame","light"];

const input = document.getElementById("input");
const enemyWordEl = document.getElementById("enemyWord");
const playerHealth = document.getElementById("playerHealth");
const enemyHealth = document.getElementById("enemyHealth");
const canvas = document.getElementById("battlefield");
const ctx = canvas.getContext("2d");

const attackBtn = document.getElementById("attackBtn");
const defenseBtn = document.getElementById("defenseBtn");
const startSpendBtn = document.getElementById("startSpend");
const startAttackBtn = document.getElementById("startAttack");
const attackCount = document.getElementById("attackCount");
const defenseCount = document.getElementById("defenseCount");

let roundPhase = "prepare";
let currentWord = "";
let playerHP = 100, enemyHP = 100;
let playerPoints = 10, playerAttack = 5, playerDefense = 5;
let effectActive = false, effectType = "";
let playerX = 80;

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function updateBars() {
  playerHealth.style.width = playerHP + "%";
  enemyHealth.style.width = enemyHP + "%";
}
function drawBattle() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle="white";
  ctx.beginPath(); ctx.arc(playerX,60,20,0,2*Math.PI); ctx.stroke();
  ctx.moveTo(playerX,80); ctx.lineTo(playerX,130); ctx.stroke();
  ctx.moveTo(playerX,90); ctx.lineTo(playerX-20,110); ctx.stroke();
  ctx.moveTo(playerX,90); ctx.lineTo(playerX+20,110); ctx.stroke();
  ctx.moveTo(playerX,130); ctx.lineTo(playerX-20,160); ctx.stroke();
  ctx.moveTo(playerX,130); ctx.lineTo(playerX+20,160); ctx.stroke();
  ctx.strokeStyle="red"; ctx.beginPath(); ctx.arc(320,60,20,0,2*Math.PI); ctx.stroke();
  ctx.moveTo(320,80); ctx.lineTo(320,130); ctx.stroke();
  ctx.moveTo(320,90); ctx.lineTo(300,110); ctx.stroke();
  ctx.moveTo(320,90); ctx.lineTo(340,110); ctx.stroke();
  ctx.moveTo(320,130); ctx.lineTo(300,160); ctx.stroke();
  ctx.moveTo(320,130); ctx.lineTo(340,160); ctx.stroke();
  if(effectActive) {
    ctx.strokeStyle = effectType==="heal" ? "lime" : "orange";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(playerX+20,100); ctx.lineTo(300,100); ctx.stroke();
    ctx.lineWidth=1;
  }
  ctx.fillStyle="white";
  ctx.font="14px sans-serif";
  ctx.fillText(`Phase: ${roundPhase.toUpperCase()}`,120,20);
  ctx.fillText(`Pts: ${playerPoints} | Atk: ${playerAttack} | Def: ${playerDefense}`,60,40);
}

function launchEffect(type) {
  effectType = type;
  effectActive = true;
  drawBattle();
  setTimeout(() => { effectActive = false; drawBattle(); }, 500);
}

function nextWord() {
  currentWord = rnd(roundPhase === "prepare" ? prepWords : spellWords);
  enemyWordEl.textContent = currentWord;
  input.value = "";
  input.focus();
}

function startSpend() {
  if (roundPhase === "prepare") {
    roundPhase = "spend";
    nextWord();
    drawBattle();
  }
}

function startAttack() {
  if (roundPhase === "spend") {
    roundPhase = "attack";
    nextWord();
    drawBattle();
  }
}

input.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const typed = input.value.trim().toLowerCase();

  if (roundPhase === "prepare") {
    if (typed === currentWord) {
      playerPoints += 2;
      alert("+2 points!");
      nextWord();
      drawBattle();
    }
  } else if (roundPhase === "attack") {
    if (typed === currentWord) {
      if (typed === "heal") {
        playerHP = Math.min(100, playerHP + playerAttack * 2);
        launchEffect("heal");
      } else {
        enemyHP = Math.max(0, enemyHP - playerAttack);
        launchEffect(typed);
      }
      updateBars(); drawBattle();
      if (enemyHP === 0) return alert("Victory! 🎉");
      const dmg = Math.max(0, 10 - playerDefense);
      playerHP = Math.max(0, playerHP - dmg);
      updateBars();
      if (playerHP === 0) return alert("Defeated 😵");
    } else {
      playerHP = Math.max(0, playerHP - 5);
      updateBars();
      alert("Missed! -5 HP");
      if (playerHP === 0) return alert("Defeated 😵");
    }
    nextWord();
  }
});

function addStat(type) {
  if (roundPhase !== "spend" || playerPoints <= 0) return;
  if (type === "attack") playerAttack++, attackCount.textContent = playerAttack;
  if (type === "defense") playerDefense++, defenseCount.textContent = playerDefense;
  playerPoints--;
  drawBattle();
}

attackBtn.addEventListener("click", () => addStat("attack"));
defenseBtn.addEventListener("click", () => addStat("defense"));
startSpendBtn.addEventListener("click", startSpend);
startAttackBtn.addEventListener("click", startAttack);

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") playerX = Math.max(40, playerX - 10);
  if (e.key === "ArrowRight") playerX = Math.min(120, playerX + 10);
  drawBattle();
});

function startGame() {
  roundPhase = "prepare";
  updateBars();
  nextWord();
  drawBattle();
}

startGame();