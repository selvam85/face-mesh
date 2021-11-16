const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
let ctx;
let videoWidth, videoHeight; 

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({video: true});
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            videoWidth = video.videoWidth;
            videoHeight = video.videoHeight;
            video.width = videoWidth;
            video.height = videoHeight;
            resolve(video);
        }; 
    });
}

async function setupCanvas() {
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.fillStyle = "green";
}

async function loadFaceLandmarkDetectionModel() {
    return faceLandmarksDetection
                .load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
                      {maxFaces: 1});
}

async function renderPrediction() {
    const predictions = await model.estimateFaces({
        input: video,
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: false
    });

    ctx.drawImage(
        video, 0, 0, video.width, video.height, 0, 0, canvas.width, canvas.height);

    if(predictions.length > 0) {
        predictions.forEach(prediction => {
            const keypoints = prediction.scaledMesh;
            for (let i = 0; i < keypoints.length; i++) {
                const x = keypoints[i][0];
                const y = keypoints[i][1];

                ctx.beginPath();
                ctx.arc(x, y, 2, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }

    window.requestAnimationFrame(renderPrediction);
}

async function main() {
    //Set up camera
    await setupCamera();

    //Set up canvas
    await setupCanvas();

    //Load the model
    model = await loadFaceLandmarkDetectionModel();

    //Render Face Mesh Prediction
    renderPrediction();
}

main();