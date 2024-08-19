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
    randomNumber = Math.floor(Math.random() * 101); // Generate a new random number
    tries = 0; // Reset tries counter
    document.getElementById('guess').value = ''; // Clear the input field
    document.getElementById('feedback').textContent = ''; // Clear the feedback
    document.getElementById('triesCount').textContent = 'Tries: 0'; // Reset tries display
    document.getElementById('restartButton').style.display = 'none'; // Hide the restart button
}
