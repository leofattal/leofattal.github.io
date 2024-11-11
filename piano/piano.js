// JavaScript to handle preloading audio, playing sounds, and providing visual feedback

// Object to hold preloaded audio files
const audioFiles = {};

// Array of note names covering small and first octaves
const notes = [
  'C3', 'C3s', 'D3', 'D3s', 'E3', 'F3', 'F3s', 'G3', 'G3s', 'A3', 'A3s', 'B3',
  'C4', 'C4s', 'D4', 'D4s', 'E4', 'F4', 'F4s', 'G4', 'G4s', 'A4', 'A4s', 'B4'
];


// Preload all audio files
notes.forEach(note => {
  audioFiles[note] = new Audio(`sounds/${note}.mp3`);
  console.log(`sounds/${note}.mp3`);
});

// Function to play sound for a given note
function playSound(note) {
  const audio = audioFiles[note];
  if (audio) {
    audio.currentTime = 0; // Reset audio to the beginning
    audio.play();
  }
}

// Function to highlight a key briefly
function highlightKey(key) {
  key.classList.add('active');
  setTimeout(() => {
    key.classList.remove('active');
  }, 200); // Highlight duration in milliseconds
}

// Get all keys and add click events to each
document.querySelectorAll('.key').forEach(key => {
  key.addEventListener('click', () => {
    const note = key.getAttribute('data-note');
    playSound(note); // Play the sound
    highlightKey(key); // Highlight the key
  });
});

  