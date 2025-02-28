document.addEventListener("DOMContentLoaded", () => {
  const video = document.createElement("video");
  video.id = "video";
  video.width = 720;
  video.height = 560;
  video.autoplay = true;
  video.muted = true;
  document.body.appendChild(video); // Ensure video is added to the DOM

  const captureBtn = document.createElement("button");
  captureBtn.textContent = "Capture Screenshot";
  document.body.appendChild(captureBtn);

  Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  ]).then(startVideo);

  function startVideo() {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
      })
      .catch((err) => console.error("Error accessing camera:", err));
  }

  captureBtn.addEventListener("click", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Draw video frame onto canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Run face detection
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    if (detections.length > 0) {
      const emotions = detections[0].expressions;

      // Find the most probable emotion
      const mostProbableEmotion = Object.keys(emotions).reduce((a, b) =>
        emotions[a] > emotions[b] ? a : b
      );

      console.log("Most probable emotion:", mostProbableEmotion);
    } else {
      console.log("No face detected.");
    }
  });
});
