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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Запрашивает у пользователя доступ к устройствам ввода мультимедиа (в данном случае микрофону). { audio: true } указывает, что нужно получить только аудиопоток.
      const audioContext = new AudioContext(); // Интерфейс Web Audio API, представляющий аудиообработку.Он используется для создания и управления аудиографами(цепочек аудиосигналов).Создание экземпляра: new AudioContext() создает новый контекст, который управляет воспроизведением и обработкой аудио.
      const source = audioContext.createMediaStreamSource(stream); // Возвращает: Промис, который разрешается с объектом MediaStream, представляющим поток аудио данных.
      // await: Ждет завершения запроса доступа к микрофону и сохраняет результат в переменную stream.
      const analyser = audioContext.createAnalyser(); // Метод создает источник аудиосигналов из объекта MediaStream. Возвращает: Объект MediaStreamAudioSourceNode, представляющий источник аудиосигналов для аудиографа.
      analyser.fftSize = 256; // Свойство узла AnalyserNode, определяющее размер используемого для анализа Fast Fourier Transform (FFT).  Это значение должно быть степенью двойки (например, 32, 64, 128, 256 и т. д.).  Что это дает: Чем больше размер FFT, тем выше детализация анализа частот, но тем больше вычислительных ресурсов требуется.

      source.connect(analyser); //  Метод, который соединяет текущий узел (source) с другим узлом (analyser) в аудиографе. sorce - Источник аудио, созданный из потока микрофона
      analyserRef.current = analyser; // analyser: Узел-анализатор, который обрабатывает аудиосигнал для анализа частот или временной диаграммы.

      const chunks = []; // При записи аудио данные обычно поступают порциями (chunks). Эти порции затем объединяются в единый файл. 
      mediaRecorderRef.current = new MediaRecorder(stream); // React-ссылка (ref), которая используется для хранения ссылки на анализатор. React Ref: Способ сохранить доступ к объектам, которые не перерисовываются при обновлении компонента (например, аудиограф). MediaRecorder: Встроенный в браузер API для записи аудио- или видеопотоков.  Параметр stream: Поток данных, полученный из микрофона через getUserMedia.  Что делает: Создает объект MediaRecorder, который управляет процессом записи аудио. mediaRecorderRef.current: Ссылка React используется для хранения экземпляра MediaRecorder, чтобы можно было обращаться к нему в других функциях (например, start, stop). 

      mediaRecorderRef.current.ondataavailable = (event) => { // Событие ondataavailable срабатывает каждый раз, когда объект MediaRecorder готов предоставить часть записанных данных.
        if (event.data.size > 0) {
          chunks.push(event.data); // Фрагмент записанных аудио-данных (например, Blob).
        }
      };
      // Blob: Объект, представляющий необработанные бинарные данные. Здесь используется для объединения всех фрагментов записанного аудио.chunks: Массив фрагментов (порций) аудио, который был заполнен в обработчике ondataavailable.
      { type: "audio/wav" }: //Указывает тип создаваемого файла (звуковой файл в формате WAV).
      mediaRecorderRef.current.onstop = () => { // Это событие используется для обработки записанных данных (фрагментов), объединения их в один файл и выполнения дополнительных действий.
        const blob = new Blob(chunks, { type: "audio/wav" });
        setAudioBlob(blob); //  Функция состояния React, которая сохраняет объект Blob в состоянии компонента. Почему это важно: Это позволяет использовать объект Blob в других функциях (например, для отправки на сервер).
        setAudioUrl(URL.createObjectURL(blob)); // Создаем URL для воспроизведения записи  Создает временный URL, ссылающийся на данные объекта Blob. Например: blob:http://localhost:3000/12345-abcdef.  setAudioUrl: Сохраняет этот URL в состоянии компонента. Что происходит: Теперь вы можете использовать этот URL для воспроизведения аудио в элементе <audio>.
        cancelAnimationFrame(animationRef.current); //  Останавливает ранее запущенную анимацию, связанную с отслеживанием звука.  animationRef.current: Ссылка на идентификатор анимации, сохраненная ранее. Что происходит: Анимация (например, индикация уровня звука) прекращается, так как запись завершена.
        setHasSound(false);
      };

      mediaRecorderRef.current.start(); // Запускает процесс записи аудио.
      setRecording(true); // запускающий процесс запис. происходит: После вызова start(): Запись аудио начинается. События, такие как ondataavailable, начинают срабатывать для сохранения порций аудио. По умолчанию: Если не указаны параметры, запись продолжается до вызова метода stop().

      monitorSound(); // Обновляет состояние, показывающее, есть ли звук (например, для индикации активности записи).
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const monitorSound = () => {
    const analyser = analyserRef.current; // Получает текущий экземпляр AnalyserNode, который ранее был сохранен в ссылке     Что происходит: Ссылка на узел-анализатор используется для получения данных о текущем состоянии аудиосигнала.
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const detectSound = () => {
      analyser.getByteFrequencyData(dataArray);
      const avgFrequency = dataArray.reduce((a, b) => a + b, 0) / dataArray.length; // Инициализируется массив, в котором будут храниться данные частотного спектра (амплитуда сигнала для каждого частотного диапазона).

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
      const response = await axios.post("http://localhost:5001/upload", formData, {
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
