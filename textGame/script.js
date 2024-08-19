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

function translatePage() {
    const translations = {
        title: "Adivina el Número",
        instructions: "Estoy pensando en un número entre 0 y 100. ¿Puedes adivinarlo?",
        guessPlaceholder: "Ingresa tu suposición",
        feedback: "¡Felicitaciones! ¡Adivinaste el número correcto!",
        tooHigh: "¡Demasiado alto! Intenta nuevamente.",
        tooLow: "¡Demasiado bajo! Intenta nuevamente.",
        tries: "Intentos"
    };

    document.getElementById('title').textContent = translations.title;
    document.getElementById('instructions').textContent = translations.instructions;
    document.getElementById('guess').placeholder = translations.guessPlaceholder;
    document.getElementById('triesCount').textContent = `${translations.tries}: ${tries}`;
    const feedback = document.getElementById('feedback').textContent;

    if (feedback === "Congratulations! You guessed the right number!") {
        document.getElementById('feedback').textContent = translations.feedback;
    } else if (feedback === "Too high! Try again.") {
        document.getElementById('feedback').textContent = translations.tooHigh;
    } else if (feedback === "Too low! Try again.") {
        document.getElementById('feedback').textContent = translations.tooLow;
    }
}

