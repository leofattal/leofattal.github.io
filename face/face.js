const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isTracking = false;

// Indexes for mouth keypoints
const BottomLipBottom = 17; // Index for the bottom lip
const TopLipTop = 0; // Index for the top lip

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

            // Draw keypoints
            for (let i = 0; i < keypoints.length; i++) {
                const [x, y] = keypoints[i];
                ctx.fillStyle = 'red';
                ctx.fillRect(canvas.width-x, y, 5, 5);
            }

            // Check for tongue sticking out (using keypoints)
            const mouthBottom = keypoints[BottomLipBottom]; // Bottom lip
            const mouthTop = keypoints[TopLipTop]; // Top lip
            const distance = mouthBottom[1] - mouthTop[1];

            if (distance > 10) { // Adjust threshold as needed
                ctx.fillStyle = 'green';
                ctx.font = '30px Arial';
                ctx.fillText('Tongue Sticking Out!', 10, 50);
            }
        });
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




        







