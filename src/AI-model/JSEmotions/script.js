const video = document.getElementById('video');
const captureBtn = document.createElement('button');
captureBtn.textContent = "Capture Screenshot";
document.body.appendChild(captureBtn);

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => console.error(err));
}

captureBtn.addEventListener('click', async () => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');

  // Draw video frame onto canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Run face detection
  const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions();

  faceapi.draw.drawDetections(canvas, detections);
  faceapi.draw.drawFaceLandmarks(canvas, detections);
  faceapi.draw.drawFaceExpressions(canvas, detections);

  // Add the screenshot to the page
  document.body.appendChild(canvas);

  // Optional: Convert canvas to image and download
  const image = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = image;
  link.download = 'screenshot.png';
  link.textContent = "Download Screenshot";
  document.body.appendChild(link);
});
