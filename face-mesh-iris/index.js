const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const eyesBlinkedText = document.getElementById("eyesBlinkedCount");
let ctx;
let videoWidth, videoHeight;

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

function setupCanvas() {
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    ctx = canvas.getContext('2d');
}

async function loadFaceLandmarkDetectionModel() {
    return faceLandmarksDetection
        .load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
            { maxFaces: 1 });
}

async function renderPrediction() {
    const predictions = await model.estimateFaces({
        input: video
    });

    ctx.drawImage(
        video, 0, 0, video.width, video.height, 0, 0, canvas.width, canvas.height);
    
    //ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Display dots on the predicted keypoints
    //displayKeypoints(predictions);

    //Draw triangle mesh using the indexes provided by Google for triangulation
    //connectKeypointsToDrawTriangle(predictions);

    //Display dots on the outline of the face
    //drawFaceOutline(predictions);

    //Display dots on the outline of both eyes
    //drawEyesOutline(predictions);

    //Display iris location
    //displayIrisPosition(predictions);

    //Count number of times the eyes are blinked
    detectBlinkingEyes(predictions);

    window.requestAnimationFrame(renderPrediction);
}

function displayKeypoints(predictions) {
    if (predictions.length > 0) {
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
}

function connectKeypointsToDrawTriangle(predictions) {
    //ctx.strokeStyle = "grey";
    ctx.fillStyle = "grey";
    if(predictions.length > 0) {
        predictions.forEach(prediction => {
            const keypoints = prediction.scaledMesh;
            for(let i = 0; i < TRIANGULATION.length; i+=3) {
                let i1 = TRIANGULATION[i];
                let i2 = TRIANGULATION[i + 1];
                let i3 = TRIANGULATION[i + 2];
                ctx.fillStyle = getRandomColor();
                ctx.beginPath();
                ctx.moveTo(keypoints[i1][0], keypoints[i1][1]);
                ctx.lineTo(keypoints[i2][0], keypoints[i2][1]);
                ctx.lineTo(keypoints[i3][0], keypoints[i3][1]);
                ctx.closePath();
                //ctx.stroke();
                ctx.fill();
            }
        });
    }
}

function drawFaceOutline(predictions) {
    ctx.fillStyle = "red";
    if(predictions.length > 0) {
        predictions.forEach(prediction => {
            const faceOutlinePoints = prediction.annotations.silhouette;
            faceOutlinePoints.forEach(point => {
                ctx.beginPath();
                ctx.rect(point[0], point[1], 2, 2);
                ctx.fill();
            });
        });
    }
}

function drawEyesOutline(predictions) {
    ctx.fillStyle = "red";
    
    if(predictions.length > 0) {
        predictions.forEach(prediction => {
            const rightEyeUpper0 = prediction.annotations.rightEyeUpper0;
            const rightEyeLower0 = prediction.annotations.rightEyeLower0;
            const rightEyeUpper1 = prediction.annotations.rightEyeUpper1;
            const rightEyeLower1 = prediction.annotations.rightEyeLower1;
            const rightEyeUpper2 = prediction.annotations.rightEyeUpper2;
            const rightEyeLower2 = prediction.annotations.rightEyeLower2;
            const rightEyeLower3 = prediction.annotations.rightEyeLower3;
            const leftEyeUpper0 = prediction.annotations.leftEyeUpper0;
            const leftEyeLower0 = prediction.annotations.leftEyeLower0;
            const leftEyeUpper1 = prediction.annotations.leftEyeUpper1;
            const leftEyeLower1 = prediction.annotations.leftEyeLower1;
            const leftEyeUpper2 = prediction.annotations.leftEyeUpper2;
            const leftEyeLower2 = prediction.annotations.leftEyeLower2;
            const leftEyeLower3 = prediction.annotations.leftEyeLower3;

            const eyeOutlinePoints = rightEyeUpper0.concat(rightEyeLower0, rightEyeUpper1, rightEyeLower1,
                                                   rightEyeUpper2, rightEyeLower2, rightEyeLower3,
                                                   leftEyeUpper0, leftEyeLower0, leftEyeUpper1,
                                                   leftEyeLower1, leftEyeUpper2, leftEyeLower2,
                                                   leftEyeLower3);

            eyeOutlinePoints.forEach(point => {
                ctx.beginPath();
                ctx.rect(point[0], point[1], 2, 2);
                ctx.fill();
            });
        });
    }
}

function displayIrisPosition(predictions) {
    ctx.strokeStyle = "red";
    if(predictions.length > 0) {
        predictions.forEach(prediction => {
            const keypoints = prediction.scaledMesh;
            if(keypoints.length == 478) {
                for(let i = 468; i < 478; i++) {
                    let x = keypoints[i][0];
                    let y = keypoints[i][1];

                    ctx.beginPath();
                    ctx.rect(x, y, 2, 2);
                    ctx.stroke();
                }
            }
        });
    }
}

let eyesBlinkedCounter = 0;
let eyesClosed = 0;
function detectBlinkingEyes(predictions) {
    ctx.fillStyle = "red";
    
    if(predictions.length > 0) {
        predictions.forEach(prediction => {
            const rightEyeUpper0 = prediction.annotations.rightEyeUpper0;
            const rightEyeLower0 = prediction.annotations.rightEyeLower0;
            const leftEyeUpper0 = prediction.annotations.leftEyeUpper0;
            const leftEyeLower0 = prediction.annotations.leftEyeLower0;
            
            const eyeOutlinePoints = rightEyeUpper0.concat(rightEyeLower0, leftEyeUpper0, leftEyeLower0);

            let rightEyeCenterPointDistance = Math.abs(rightEyeUpper0[3][1] - rightEyeLower0[4][1]);
            let leftEyeCenterPointDistance = Math.abs(leftEyeUpper0[3][1] - leftEyeLower0[4][1]);
            /* console.log("---------------");
            console.log(`right: [${rightEyeUpper0[3][0]}, ${rightEyeUpper0[3][1]}], [${rightEyeLower0[4][0]}, ${rightEyeLower0[4][1]}`);
            console.log(`left: [${leftEyeUpper0[3][0]}, ${leftEyeUpper0[3][1]}], [${leftEyeLower0[4][0]}, ${leftEyeLower0[4][1]}`);
            console.log(`right distance: ${rightEyeCenterPointDistance}, left distance: ${leftEyeCenterPointDistance}`); */

            if(rightEyeCenterPointDistance < 7 || leftEyeCenterPointDistance < 7) {
                eyesClosed = 1;
            }

            if(eyesClosed == 1 && (rightEyeCenterPointDistance > 9 || leftEyeCenterPointDistance > 9)) {
                eyesBlinkedCounter++;
                eyesClosed = 0;
            }

            //console.log(`# of times blinked: ${eyesBlinkedCounter}`);
            eyesBlinkedText.style.visibility = "visible";
            eyesBlinkedText.innerHTML = "# of times blinked: " + eyesBlinkedCounter;

            eyeOutlinePoints.forEach(point => {
                ctx.beginPath();
                ctx.rect(point[0], point[1], 2, 2);
                ctx.fill();
            });
        });
    }
}

function getRandomColor() {
    return '#' + Math.floor(Math.random()*82456975).toString(16);
}

async function main() {
    //Set up camera
    await setupCamera();

    //Set up canvas
    setupCanvas();

    //Load the model
    model = await loadFaceLandmarkDetectionModel();

    //Render Face Mesh Prediction
    renderPrediction();
}

main();