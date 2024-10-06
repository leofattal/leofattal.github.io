const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
let faceModel;

async function loadFaceModel() {
    faceModel = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh);
}

function drawImage(image) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

async function computeEmbeddings(image, label) {
    const predictions = await faceModel.estimateFaces({input: image});
    
    if (predictions.length > 0) {
        const keypoints = predictions[0].scaledMesh;
        const embeddings = keypoints.flat(); // Flatten the keypoints into a single array
        
        // Save the embeddings to local storage with the label
        saveEmbeddings(embeddings, label);
        
        output.textContent = `Embeddings for ${label} saved!`;
    } else {
        output.textContent = 'No face detected.';
    }
}

function saveEmbeddings(embeddings, label) {
    let savedFaces = JSON.parse(localStorage.getItem('faces')) || [];
    
    // Add the new embedding and label
    savedFaces.push({ label, embeddings });
    
    // Save back to local storage
    localStorage.setItem('faces', JSON.stringify(savedFaces));
}

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const label = prompt("Enter the person's name:"); // Prompt user for name
        if (label) {
            const img = new Image();
            img.onload = () => {
                drawImage(img);
                computeEmbeddings(img, label);
            };
            img.src = URL.createObjectURL(file);
        } else {
            alert('Please enter a valid name.');
        }
    }
});

// Load the face model when the page loads
window.onload = async () => {
    await loadFaceModel();
};
