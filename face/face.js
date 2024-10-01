const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isTracking = false;

// Adjusted indexes for mouth keypoints from FaceMesh
const BottomLipBottom = 14; // Bottom of inner lower lip
const TopLipTop = 13; // Top of inner upper lip

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

async function loadFaceMesh() {
    const model = await facemesh.load();
    return model;
}

async function detectFace(model) {
    const predictions = await model.estimateFaces(video, false);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (predictions.length > 0) {
        predictions.forEach(prediction => {
            const keypoints = prediction.scaledMesh;

            // Draw keypoints on the face
            for (let i = 0; i < keypoints.length; i++) {
                const [x, y] = keypoints[i];
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, 2 * Math.PI); // Draw small circles at keypoints
                ctx.fill();
            }

            // Check for tongue sticking out
            const mouthBottom = keypoints[BottomLipBottom]; // Bottom of inner lower lip
            const mouthTop = keypoints[TopLipTop]; // Top of inner upper lip
            const distance = mouthBottom[1] - mouthTop[1];

            if (distance > 20) { // Increased threshold for more reliable detection
                ctx.fillStyle = 'green';
                ctx.font = '30px Arial';
                ctx.fillText('Tongue Detected', 10, 50);
            } else {
                ctx.fillStyle = 'red';
                ctx.font = '30px Arial';
                ctx.fillText('No Tongue Detected', 10, 50);
            }
        });
    } else {
        // Clear the previous message if no face is detected
        ctx.clearRect(0, 0, canvas.width, 50);
        ctx.fillStyle = 'red';
        ctx.font = '30px Arial';
        ctx.fillText('No Face Detected', 10, 50);
    }
}

async function init() {
    await setupCamera();
    video.play();
    isTracking = true;

    const model = await loadFaceMesh();
    setInterval(() => {
        detectFace(model);
    }, 100);
}

// Start tracking as soon as the page loads
window.onload = init;


