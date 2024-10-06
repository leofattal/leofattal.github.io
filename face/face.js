const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isTracking = false;

// Keypoints for facial features (based on FaceMesh)
const LeftMouthCorner = 61; // Left mouth corner
const RightMouthCorner = 291; // Right mouth corner
const UpperLip = 13; // Upper lip (inner)
const LowerLip = 14; // Lower lip (inner)
const LeftEyeUpper = 159; // Upper left eye
const LeftEyeLower = 145; // Lower left eye
const RightEyeUpper = 386; // Upper right eye
const RightEyeLower = 374; // Lower right eye
const LeftEyebrow = 70; // Left eyebrow
const RightEyebrow = 300; // Right eyebrow
const NoseBridge = 168; // Nose keypoint for detecting disgust

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

function detectMood(keypoints) {
    const leftMouthCorner = keypoints[LeftMouthCorner];
    const rightMouthCorner = keypoints[RightMouthCorner];
    const upperLip = keypoints[UpperLip];
    const lowerLip = keypoints[LowerLip];

    const leftEyeUpper = keypoints[LeftEyeUpper];
    const leftEyeLower = keypoints[LeftEyeLower];
    const rightEyeUpper = keypoints[RightEyeUpper];
    const rightEyeLower = keypoints[RightEyeLower];

    const leftEyebrow = keypoints[LeftEyebrow];
    const rightEyebrow = keypoints[RightEyebrow];
    const noseBridge = keypoints[NoseBridge];

    // Calculate distances for mood detection
    const mouthWidth = Math.abs(rightMouthCorner[0] - leftMouthCorner[0]); // Width of the smile
    const mouthHeight = Math.abs(upperLip[1] - lowerLip[1]); // Mouth openness (used for surprise)
    const leftEyeHeight = Math.abs(leftEyeUpper[1] - leftEyeLower[1]);
    const rightEyeHeight = Math.abs(rightEyeUpper[1] - rightEyeLower[1]);
    const eyebrowDistance = Math.abs(leftEyebrow[0] - rightEyebrow[0]);
    const eyebrowHeightDifference = Math.abs(leftEyebrow[1] - rightEyebrow[1]); // For confusion detection
    const noseBridgeY = noseBridge[1]; // For detecting disgust

    // Mood Detection Logic
    if (mouthHeight > 15 && (leftEyeHeight > 10 || rightEyeHeight > 10)) {
        return "Surprised";
    } else if (mouthWidth > 50 && mouthHeight < 10) {
        return "Happy";
    } else if (mouthWidth < 40 && eyebrowDistance < 90) {
        return "Sad";
    } else if (eyebrowHeightDifference > 5 && mouthHeight < 10) {
        return "Confused";
    } else if (eyebrowDistance < 75 && mouthHeight < 5) {
        return "Angry";
    } else if (mouthHeight < 5 && upperLip[1] < noseBridgeY - 5) {
        return "Disgusted";
    } else {
        return "Neutral";
    }
}

async function detectFace(model) {
    const predictions = await model.estimateFaces(video, false);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (predictions.length > 0) {
        predictions.forEach(prediction => {
            const keypoints = prediction.scaledMesh;

            // Detect mood based on keypoints
            const mood = detectMood(keypoints);

            // Display the detected mood
            ctx.fillStyle = 'blue';
            ctx.font = '30px Arial';
            ctx.fillText(`Mood: ${mood}`, 10, 50);
        });
    } else {
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





