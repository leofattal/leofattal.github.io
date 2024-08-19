let randomNumber = Math.floor(Math.random() * 101);

function checkGuess() {
    const userGuess = document.getElementById('userGuess').value;
    const feedback = document.getElementById('feedback');

    if (userGuess == randomNumber) {
        feedback.textContent = 'Congratulations! You guessed the right number!';
    } else if (userGuess > randomNumber) {
        feedback.textContent = 'Too high! Try again.';
    } else if (userGuess < randomNumber) {
        feedback.textContent = 'Too low! Try again.';
    } else {
        feedback.textContent = 'Please enter a valid number.';
    }
}