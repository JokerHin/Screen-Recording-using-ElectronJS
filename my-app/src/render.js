document.addEventListener("DOMContentLoaded", () => {
  let mediaRecorder;
  let recordedChunks = [];
  let recordingInterval;
  let recordingStartTime;

  // Elements
  const videoElement = document.querySelector("video");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const videoSelectBtn = document.getElementById("videoSelectBtn");
  const selectMenu = document.getElementById("selectMenu");
  const recordingIndicator = document.getElementById("recordingIndicator");
  const recordingTime = document.getElementById("recordingTime");

  // Event Listeners
  videoSelectBtn.onclick = getVideoSources;
  selectMenu.onchange = previewSelectedSource;
  startBtn.onclick = () => {
    startRecording();
    startBtn.innerText = "Recording...";
    startBtn.disabled = true;
    stopBtn.disabled = false;
    recordingIndicator.style.display = "flex"; // Show red dot and timer
    recordingStartTime = Date.now();
    recordingInterval = setInterval(updateRecordingTime, 1000);
  };
  stopBtn.onclick = () => {
    if (mediaRecorder) {
      try {
        mediaRecorder.stop();
        startBtn.innerText = "Start";
        startBtn.disabled = false;
        stopBtn.disabled = true;
        recordingIndicator.style.display = "none"; // Hide red dot and timer
        clearInterval(recordingInterval);
      } catch (error) {
        console.error("❌ Error stopping MediaRecorder:", error);
        alert("An error occurred while stopping the recording.");
      }
    } else {
      console.error("❌ MediaRecorder not initialized!");
    }
  };

  // Fetch available video sources
  async function getVideoSources() {
    if (!window.electron || !window.electron.invoke) {
      console.error("❌ window.electron.invoke is not defined!");
      return;
    }

    const inputSources = await window.electron.invoke("getSources");

    if (!selectMenu) {
      console.error("❌ selectMenu element not found!");
      return;
    }

    selectMenu.innerHTML = ""; // Clear existing options
    inputSources.forEach((source) => {
      const element = document.createElement("option");
      element.value = source.id;
      element.innerHTML = source.name;
      selectMenu.appendChild(element);
    });
  }

  // Preview the selected screen
  async function previewSelectedSource() {
    if (!selectMenu || !selectMenu.options.length) {
      console.error("❌ No source selected or selectMenu not found!");
      return;
    }

    const screenId = selectMenu.options[selectMenu.selectedIndex].value;

    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: screenId,
          maxWidth: 1024, // Further reduce resolution
          maxHeight: 576,
          maxFrameRate: 15, // Further limit frame rate
        },
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = stream;
      await videoElement.play();
    } catch (error) {
      console.error("❌ Error previewing source:", error);
      alert(
        "Selected source is not capturable. Please select a different source."
      );
    }
  }

  // Start recording
  async function startRecording() {
    if (!videoElement.srcObject) {
      console.error("❌ No video source to record!");
      return;
    }

    try {
      mediaRecorder = new MediaRecorder(videoElement.srcObject, {
        mimeType: "video/webm; codecs=vp9",
      });

      mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
      mediaRecorder.onstop = stopRecordingHandler;
      mediaRecorder.onerror = (error) => {
        console.error("❌ MediaRecorder error:", error);
        alert("An error occurred during recording. Please try again.");
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("❌ Error starting recording:", error);
      alert("An error occurred while starting the recording.");
    }
  }

  // Stop recording and save the video
  async function stopRecordingHandler() {
    try {
      videoElement.srcObject = null;

      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const arrayBuffer = await blob.arrayBuffer(); // Send ArrayBuffer directly

      recordedChunks = []; // Reset recordedChunks

      const { canceled, filePath } = await window.electron.invoke(
        "showSaveDialog"
      );
      if (canceled || !filePath) return;

      window.electron.invoke("saveVideo", filePath, arrayBuffer);
      console.log("✅ Video saved successfully at:", filePath);
    } catch (error) {
      console.error("❌ Error during stopRecordingHandler:", error);
      alert("An error occurred while saving the recording.");
    }
  }

  // Update the recording time
  function updateRecordingTime() {
    const elapsedTime = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = String(Math.floor(elapsedTime / 60)).padStart(2, "0");
    const seconds = String(elapsedTime % 60).padStart(2, "0");
    recordingTime.textContent = `${minutes}:${seconds}`;
  }
});
