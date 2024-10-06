const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let knownFaces = []; // Array to hold known face embeddings
let labels = []; // Array to hold names associated with embeddings

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadFaceModel() {
    try {
        // Correct model loading for face-landmarks-detection
        const model = await faceLandmarksDetection.load(
            faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
        );
        console.log("Face model loaded successfully");
        return model;
    } catch (error) {
        console.error("Error loading the face model:", error);
    }
}

function distance(emb1, emb2) {
    return Math.sqrt(emb1.reduce((sum, val, i) => sum + Math.pow(val - emb2[i], 2), 0));
}

async function recognizeFace(embeddings) {
    let minDistance = Infinity;
    let bestMatch = "unknown";

    for (let i = 0; i < knownFaces.length; i++) {
        const dist = distance(embeddings, knownFaces[i]);
        if (dist < minDistance) {
            minDistance = dist;
            bestMatch = labels[i];
        }
    }

    if (minDistance > 0.6) { // Adjust the threshold for unknown faces
        return "unknown";
    }
    return bestMatch;
}

async function detectFace(model) {
    const predictions = await model.estimateFaces(video);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (predictions.length > 0) {
        const face = predictions[0];
        const embeddings = face.mesh.flat(); // Get the face mesh as embeddings

        const recognizedFace = await recognizeFace(embeddings);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous text
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // Draw video feed
        ctx.fillStyle = 'black'; // Text color
        ctx.font = '30px Arial';
        ctx.fillText(`Recognized: ${recognizedFace}`, 10, 50); // Show the recognized face
        console.log("Recognized face:", recognizedFace);
    } else {
        ctx.clearRect(0, 0, canvas.width, 50);
        ctx.fillStyle = 'red';
        ctx.font = '30px Arial';
        ctx.fillText('No Face Detected', 10, 50);
        console.log("No face detected");
    }
}

async function init() {
    await setupCamera();
    video.play();

    const model = await loadFaceModel();
    if (model) {
        setInterval(() => {
            detectFace(model);
        }, 100);
    }
}

// Load known faces from local storage
function loadKnownFaces() {
    const savedFaces = JSON.parse(localStorage.getItem('faces')) || [];
    
    if (savedFaces.length === 0) {
        console.log("No faces found in local storage.");
    } else {
        savedFaces.forEach(face => {
            knownFaces.push(face.embeddings);
            labels.push(face.label);
        });
        console.log("Loaded known faces from local storage:", savedFaces);
    }
}

// Start the app
window.onload = async () => {
    loadKnownFaces(); // Load embeddings from local storage
    await init(); // Start the recognition app
};






