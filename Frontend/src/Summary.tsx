import ReactMarkdown from "react-markdown";

import React, { useState } from "react";
import axios from "axios";

const Summary: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [asking, setAsking] = useState<boolean>(false);

  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [answerAudioUrl, setAnswerAudioUrl] = useState<string>("");
  const [recording, setRecording] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSaveAsPdf = async () => {
    const res = await fetch("http://localhost:5000/save-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: summary }), // send the markdown
    });
    const data = await res.json();
    if (data.pdfUrl) {
      window.open(`http://localhost:5000${data.pdfUrl}`, "_blank");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setSummary("");
      setAudioUrl("");

      // 📝 extract text
      const extractRes = await axios.post(
        "http://localhost:5000/extract-text",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const extractedText = extractRes.data.text;

      // 📝 summarize
      const summaryRes = await axios.post("http://localhost:5000/summarize", {
        text: extractedText,
      });

      const summarizedText = summaryRes.data.summary;
      setSummary(summarizedText);

      // 🔊 generate TTS
      const ttsRes = await axios.post("http://localhost:5000/tts", {
        text: summarizedText,
      });

      setAudioUrl(ttsRes.data.audioUrl || "");
    } catch (err) {
      console.error(err);
      setSummary("Error: could not process the document.");
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = async () => {
    if (!question.trim()) return;

    setAnswer("");
    setAnswerAudioUrl("");
    setAsking(true);

    try {
      const res = await axios.post("http://localhost:5000/ask", {
        text: question,
      });
      setAnswer(res.data.text);
      setAnswerAudioUrl(res.data.audioUrl || "");
    } catch (err) {
      console.error(err);
      setAnswer("Error: could not get response.");
    } finally {
    setAsking(false);
  }
  };

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;

    recognition.onstart = () => setRecording(true);
    recognition.onend = () => setRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };

    recognition.start();
  };

  return (
    <div style={styles.app}>
      <h1 style={styles.title}>🎓 STUDENT COMPANION</h1>
      {/* // <div className="app"> */}
      {/* //   <h1>STUDENT COMPANION</h1> */}

      {/* imported code */}
      <div style={styles.row}>
        {/* 📁 Row 1: Upload + Summary */}
        <div style={styles.tom}>
          <div style={styles.sectionHeaderOuter}>

            <h3 style={{textAlign: 'center', fontSize:'20px', margin: 0}}>Learn with Tom</h3>
          <div style={styles.sectionHeader}>
            <input
              type="file"
              accept=".pdf,.docx,.pptx,.txt"
              onChange={handleFileChange}
              style={{backgroundColor: 'white', marginRight: '10px'}}
            />
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              style={styles.primaryBtn}
            >
              {loading ? "Processing..." : "Upload & Generate"}
            </button>
          </div>
          </div>

          <div style={styles.scrollArea}>
            {summary && (
              <div className="summary">
                <h2>📋 Questions & Answers:</h2>
                <div style={styles.card}>
                  <button onClick={handleSaveAsPdf} style={styles.saveBtn}>
                    📄 Save as PDF
                  </button>
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              </div>
            )}

            {audioUrl && (
              <div className="audio" style={styles.audio}>
                <h3>🔊 Audio Summary:</h3>
                <audio controls src={audioUrl} style={{ width: "100%" }} />
                {/* <a href={audioUrl} download style={styles.downloadBtn}>
                  ⬇️ Download Summary Audio
                </a> */}
              </div>
            )}
          </div>
        </div>

        {/* <hr /> */}

        {/* 🤖 Row 2: Secondary AI */}
        <div style={styles.jerry}>
          <div style={styles.jerryHeader}>
            <div style={styles.jerryHeaderInner}>
            <h3 style={{textAlign: 'center', color: 'white', fontSize: '18px'}}>Ask Jerry</h3>
              <textarea
                value={question}
                rows={6}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder='e.g. "Explain question 2…"'
                style={styles.jerryInput}
              ></textarea>

              <button onClick={handleVoiceInput} style={styles.secondaryBtn}>
                {recording ? "🎙️ Listening…" : "🎤 Speak"}
              </button>

              <button
                onClick={handleAskAI}
                disabled={!question.trim()}
                style={styles.primaryBtn}
              >
                 {asking ? "Generating..." : "Ask"}
              </button>
            </div>
          </div>

          <div style={styles.scrollArea}>
            {answer && (
              <div className="answer">
                <h3>📝 Answer:</h3>
                <div style={styles.card}>
                  <ReactMarkdown>{answer}</ReactMarkdown>
                </div>
              </div>
            )}

            {answerAudioUrl && (
              <div className="answer-audio" style={styles.audio}>
                <h3>🔊 Answer Audio:</h3>
                <audio
                  controls
                  src={answerAudioUrl}
                  style={{ width: "100%" }}
                />
                <a href={answerAudioUrl} download style={styles.downloadBtn}>
                  ⬇️ Download Answer Audio
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        {/* orginal code  */}
        {/* 


      <input type="file" accept=".pdf,.docx,.pptx,.txt" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? "Processing..." : "Upload & Summarize"}
      </button>

      {summary && (
        <div className="summary">
          <h2>QUESTIONS AND ANSWERS:</h2>
          <div style={{ border: "solid", padding: "1opx" }}>
          <button
      onClick={handleSaveAsPdf}
      style={{
        marginTop: "10px",
        padding: "8px 16px",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        cursor: "pointer"
      }}
    >
      📄 Save as PDF
    </button>
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </div>
      )}

      {audioUrl && (
  <div className="audio">
    <h3>Audio Summary:</h3>

    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <audio controls src={audioUrl} style={{ width: "100%" }} />

      <a
        href={audioUrl}
        download
        style={{
          display: "inline-block",
          padding: "6px 12px",
          background: "#28a745",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "4px"
        }}
      >
        ⬇️ Download Summary Audio
      </a>
    </div>
  </div>
)}


      <hr />

      <div className="ai-helper">
        <h2>Ask Secondary AI</h2>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder='e.g. "ChatGPT explain question 2…"'
          style={{ width: "80%", marginRight: "10px" }}
        />
        <button onClick={handleVoiceInput}>
          {recording ? "🎙️ Listening…" : "🎤 Speak"}
        </button>
        <button onClick={handleAskAI} disabled={!question.trim()}>
          Ask
        </button>

        {answer && (
          <div className="answer">
            <h3>Answer:</h3>
            <div style={{ border: "solid", padding: "10px" }}>
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* {answerAudioUrl && (
          <div className="answer-audio">
            <h3>Answer Audio:</h3>
            <button
              onClick={() => new Audio(answerAudioUrl).play()}
              style={{
                fontSize: "2rem",
                background: "none",
                border: "none",
                cursor: "pointer"
              }}
              title="Play Answer"
            >
              🗣️
            </button>
          </div>

        )} 

{answerAudioUrl && (
  <div className="answer-audio">
    <h3>Answer Audio:</h3>

    <audio controls src={answerAudioUrl} style={{ width: "100%" }} />

    <a
      href={answerAudioUrl}
      download
      style={{
        display: "inline-block",
        marginTop: "10px",
        padding: "6px 12px",
        background: "#28a745",
        color: "#fff",
        textDecoration: "none",
        borderRadius: "4px"
      }}
    >
      ⬇️ Download Answer Audio
    </a>
  </div>
)}
      </div>

 */}
      </div>
    </div>
  );
};

export default Summary;

const styles: Record<string, React.CSSProperties> = {
  app: {
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', sans-serif",
    color: 'black'
    // padding: "20px 5%"
  },
  title: {
    textAlign: "center",
    color: "#2c3e50",
  },
  row: {
    display: "flex",
    // flexDirection: "column",
    gap: "20px",
    marginTop: "20px",
  },
  tom: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 5px rgba(1,2,1,0.4)",
    width: "65%",
    height: "85vh",
  },
  jerry: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 5px rgba(0,0,0,0.4)",
    width: "35%",
    height: "85vh",
  },
  section: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  sectionHeader: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    height: "8vh"
  },
  sectionHeaderOuter: {
    background: "lightgreen",
    padding: "20px",

  },
  jerryHeader: {
    background: "skyblue",
    // background: "#f7f7f7",
    padding: "10px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  jerryHeaderInner: {
    // background: "transparent",
  },
  scrollArea: {
    // maxHeight: "300px",
    // backgroundColor: 'green',
    overflowY: "auto",
    padding: "10px",
    height: "85%",
  },
  card: {
    border: "1px solid #ccc",
    padding: "10px",
    borderRadius: "6px",
    background: "transparent",
    color: 'black'
  },
  saveBtn: {
    marginBottom: "10px",
    padding: "6px 12px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    cursor: "pointer",
    borderRadius: "4px",
  },
  audio: {
    marginTop: "20px",
  },
  downloadBtn: {
    display: "inline-block",
    marginTop: "10px",
    padding: "6px 12px",
    background: "#28a745",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "4px",
  },
  jerryInput: {
    flex: "1",
    padding: "6px 8px",
    background: "white",
    border: "none",
    width: "370px",
    outline: "none",
    resize: "none",
    borderRadius: "8px",
    marginBottom: "7px",
  },
  input: {
    flex: "1",
    padding: "6px 8px",
    // background: "transparent",
  },
  primaryBtn: {
    padding: "6px 12px",
    background: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "6px 12px",
    background: "#f39c12",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: '10px'
  },
};
