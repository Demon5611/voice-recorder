import React, { useState, useRef } from "react";
import axios from "axios";

function App() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [hasSound, setHasSound] = useState(false);
  const mediaRecorderRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      source.connect(analyser);
      analyserRef.current = analyser;

      const chunks = [];
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob)); // Создаем URL для воспроизведения записи
        cancelAnimationFrame(animationRef.current);
        setHasSound(false);
      };

      mediaRecorderRef.current.start();
      setRecording(true);

      monitorSound();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const monitorSound = () => {
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const detectSound = () => {
      analyser.getByteFrequencyData(dataArray);
      const avgFrequency = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      // Устанавливаем порог для определения наличия звука
      setHasSound(avgFrequency > 10);

      animationRef.current = requestAnimationFrame(detectSound);
    };

    detectSound();
  };

  const sendAudioToServer = async () => {
    if (!audioBlob) {
      alert("Нет записанного аудио!");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Server response:", response.data);
    } catch (error) {
      console.error("Error uploading audio:", error);
    }
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center' , width:'100vw', height: '100vh', justifyContent: 'center'}}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h1>Voice Recorder</h1>
      {!recording ? (
        <button onClick={startRecording}>Start Recording</button>
      ) : (
        <button onClick={stopRecording}>Stop Recording</button>
      )}
      <div
        style={{
          width: "50px",
          height: "50px",
          margin: "20px auto",
          borderRadius: "50%",
          backgroundColor: recording ? (hasSound ? "green" : "red") : "gray",
        }}
      ></div>
      <div style={{ margin: "20px" }}>
        {audioUrl && (
          <audio controls src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
      <button onClick={sendAudioToServer} disabled={!audioBlob}>
        Upload Recording
      </button>
      </div>
      
    </div>
  );
}

export default App;
