const video = document.getElementById('video');
let isTracking = false;

// Keypoints for mouth corners (based on FaceMesh)
const LeftMouthCorner = 61;
const RightMouthCorner = 291;
const UpperLip = 13;
const LowerLip = 14;

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

function detectSmile(keypoints) {
    const leftMouthCorner = keypoints[LeftMouthCorner];
    const rightMouthCorner = keypoints[RightMouthCorner];
    const upperLip = keypoints[UpperLip];
    const lowerLip = keypoints[LowerLip];

    // Calculate mouth width (distance between corners)
    const mouthWidth = Math.abs(rightMouthCorner[0] - leftMouthCorner[0]);

    // Calculate mouth height (distance between upper and lower lip)
    const mouthHeight = Math.abs(upperLip[1] - lowerLip[1]);

    // Smile detection logic: wider mouth and smaller mouth height (indicating a smile)
    if (mouthWidth > 50 && mouthHeight < 10) {
        return true;
    } else {
        return false;
    }
}

async function detectFace(model) {
    const predictions = await model.estimateFaces(video, false);

    if (predictions.length > 0) {
        predictions.forEach(prediction => {
            const keypoints = prediction.scaledMesh;

            // Check if smiling
            if (detectSmile(keypoints)) {
                document.body.style.backgroundColor = 'green'; // Turn screen green if smiling
            } else {
                document.body.style.backgroundColor = 'red'; // Turn screen red if not smiling
            }
        });
    } else {
        // Default to red if no face is detected
        document.body.style.backgroundColor = 'red';
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
