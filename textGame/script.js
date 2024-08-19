let randomNumber = Math.floor(Math.random() * 101);
let tries = 0;

function checkGuess() {
    const userGuess = document.getElementById('guess').value;
    const feedback = document.getElementById('feedback');
    const restartButton = document.getElementById('restartButton');
    const triesCount = document.getElementById('triesCount');

    tries++;

    if (userGuess == randomNumber) {
        feedback.textContent = 'Congratulations! You guessed the right number!';
        restartButton.style.display = 'inline';
    } else if (userGuess > randomNumber) {
        feedback.textContent = 'Too high! Try again.';
    } else if (userGuess < randomNumber) {
        feedback.textContent = 'Too low! Try again.';
    } else {
        feedback.textContent = 'Please enter a valid number.';
    }

    triesCount.textContent = `Tries: ${tries}`;
}

function restartGame() {
    randomNumber = Math.floor(Math.random() * 101);
    tries = 0;
    document.getElementById('guess').value = '';
    document.getElementById('feedback').textContent = '';
    document.getElementById('triesCount').textContent = 'Tries: 0';
    document.getElementById('restartButton').style.display = 'none';
}

function toggleLanguageMenu() {
    const languageMenu = document.getElementById('languageMenu');
    languageMenu.style.display = languageMenu.style.display === 'none' ? 'block' : 'none';
}

function translatePage(language) {
    const translations = {
        en: {
            title: "Guess The Number",
            instructions: "I'm thinking of a number between 0 and 100. Can you guess it?",
            guessPlaceholder: "Enter your guess",
            guessButton: "Guess",
            translateButton: "Translate",
            restartButton: "Restart",
            feedback: "Congratulations! You guessed the right number!",
            tooHigh: "Too high! Try again.",
            tooLow: "Too low! Try again.",
            tries: "Tries"
        },
        zh: {
            title: "猜数字",
            instructions: "我在想一个 0 到 100 之间的数字。你能猜到吗？",
            guessPlaceholder: "输入你的猜测",
            guessButton: "猜测",
            translateButton: "翻译",
            restartButton: "重新开始",
            feedback: "恭喜！你猜对了！",
            tooHigh: "太高了！再试一次。",
            tooLow: "太低了！再试一次。",
            tries: "尝试次数"
        },
        es: {
            title: "Adivina el Número",
            instructions: "Estoy pensando en un número entre 0 y 100. ¿Puedes adivinarlo?",
            guessPlaceholder: "Ingresa tu suposición",
            guessButton: "Adivinar",
            translateButton: "Traducir",
            restartButton: "Reiniciar",
            feedback: "¡Felicitaciones! ¡Adivinaste el número correcto!",
            tooHigh: "¡Demasiado alto! Intenta nuevamente.",
            tooLow: "¡Demasiado bajo! Intenta nuevamente.",
            tries: "Intentos"
        },
        fr: {
            title: "Devinez le Nombre",
            instructions: "Je pense à un nombre entre 0 et 100. Pouvez-vous le deviner?",
            guessPlaceholder: "Entrez votre supposition",
            guessButton: "Deviner",
            translateButton: "Traduire",
            restartButton: "Redémarrer",
            feedback: "Félicitations! Vous avez deviné le bon nombre!",
            tooHigh: "Trop haut! Réessayez.",
            tooLow: "Trop bas! Réessayez.",
            tries: "Essais"
        }
    };

    const selectedLanguage = translations[language];
    document.getElementById('title').textContent = selectedLanguage.title;
    document.getElementById('instructions').textContent = selectedLanguage.instructions;
    document.getElementById('guess').placeholder = selectedLanguage.guessPlaceholder;
    document.getElementById('guessButton').textContent = selectedLanguage.guessButton;
    document.querySelector('button[onclick="toggleLanguageMenu()"]').textContent = selectedLanguage.translateButton;
    document.getElementById('restartButton').textContent = selectedLanguage.restartButton;

    const feedback = document.getElementById('feedback').textContent;

    if (feedback.includes("Congratulations") || feedback.includes("恭喜") || feedback.includes("¡Felicitaciones!") || feedback.includes("Félicitations")) {
        document.getElementById('feedback').textContent = selectedLanguage.feedback;
    } else if (feedback.includes("Too high") || feedback.includes("太高了") || feedback.includes("¡Demasiado alto!") || feedback.includes("Trop haut")) {
        document.getElementById('feedback').textContent = selectedLanguage.tooHigh;
    } else if (feedback.includes("Too low") || feedback.includes("太低了") || feedback.includes("¡Demasiado bajo!") || feedback.includes("Trop bas")) {
        document.getElementById('feedback').textContent = selectedLanguage.tooLow;
    }

    document.getElementById('triesCount').textContent = `${selectedLanguage.tries}: ${tries}`;
}




