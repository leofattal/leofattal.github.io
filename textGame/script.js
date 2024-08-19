let randomNumber = Math.floor(Math.random() * 101);

function checkGuess() {
    const userGuess = document.getElementById('userGuess').value;
    const feedback = document.getElementById('feedback');
    const restartButton = document.getElementById('restartButton');

    if (userGuess == randomNumber) {
        feedback.textContent = 'Congratulations! You guessed the right number!';
        restartButton.style.display = 'inline'; // Show the restart button
    } else if (userGuess > randomNumber) {
        feedback.textContent = 'Too high! Try again.';
    } else if (userGuess < randomNumber) {
        feedback.textContent = 'Too low! Try again.';
    } else {
        feedback.textContent = 'Please enter a valid number.';
    }
}

function restartGame() {
    randomNumber = Math.floor(Math.random() * 101); // Generate a new random number
    document.getElementById('userGuess').value = ''; // Clear the input field
    document.getElementById('feedback').textContent = ''; // Clear the feedback
    document.getElementById('restartButton').style.display = 'none'; // Hide the restart button
}