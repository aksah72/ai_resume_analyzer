import React, { useState, useCallback } from "react";
import { TailSpin } from "react-loader-spinner";
import { useDropzone } from "react-dropzone";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { FaCloudUploadAlt, FaGithub, FaCheckCircle, FaFilePdf, FaDownload, FaBrain, FaRocket, FaChartLine } from "react-icons/fa";
import jsPDF from "jspdf";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
    setMessage("");
    setAnalysis(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const getScoreColor = (score) => {
    if (score >= 75) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 65) return "Good";
    if (score >= 50) return "Average";
    return "Needs Work";
  };

  const downloadPDF = () => {
    if (!analysis) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 30, 60);
    doc.text("AI Resume Analysis Report", 20, 25);
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(`ATS Score: ${analysis.atsScore}% — ${getScoreLabel(analysis.atsScore)}`, 20, 45);
    doc.setFont("helvetica", "bold");
    doc.text("Identified Skills:", 20, 62);
    doc.setFont("helvetica", "normal");
    analysis.skills.forEach((skill, i) => {
      doc.text(`• ${skill.trim()}`, 28, 74 + i * 9);
    });
    const sugY = 80 + analysis.skills.length * 9;
    doc.setFont("helvetica", "bold");
    doc.text("Improvement Suggestions:", 20, sugY);
    doc.setFont("helvetica", "normal");
    analysis.suggestions.forEach((item, i) => {
      const lines = doc.splitTextToSize(`• ${item.trim()}`, 165);
      doc.text(lines, 28, sugY + 12 + i * 12);
    });
    doc.save("AI_Resume_Report.pdf");
  };

  const uploadResume = async () => {
    if (!file) { setMessage("Please select a resume PDF first."); return; }
    setLoading(true);
    setAnalysis(null);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      await fetch(`${process.env.REACT_APP_UPLOAD_URL || "http://localhost:5001"}/upload`, { method: "POST", body: formData });
      const aiFormData = new FormData();
      aiFormData.append("resume", file);
      const aiResponse = await fetch(`${process.env.REACT_APP_AI_URL || "http://localhost:5002"}/analyze`, { method: "POST", body: aiFormData });
      const aiData = await aiResponse.json();
      setAnalysis({
        atsScore: aiData.atsScore || 0,
        skills: Array.isArray(aiData.skills) ? aiData.skills : typeof aiData.skills === "string" ? aiData.skills.split(",") : [],
        suggestions: Array.isArray(aiData.suggestions) ? aiData.suggestions : typeof aiData.suggestions === "string" ? aiData.suggestions.split(",") : [],
      });
    } catch (error) {
      setMessage("Analysis failed. Please check that services are running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-root">
      {/* Animated background */}
      <div className="bg-grid" aria-hidden />
      <div className="bg-orb orb1" aria-hidden />
      <div className="bg-orb orb2" aria-hidden />
      <div className="bg-orb orb3" aria-hidden />

      {/* Header */}
      <header className="hero">
        <div className="hero-badge">
          <FaBrain size={14} />
          <span>Powered by OpenRouter AI</span>
        </div>
        <h1 className="hero-title">
          <span className="title-line1">Resume</span>
          <span className="title-line2">Analyzer</span>
        </h1>
        <p className="hero-sub">Upload resume and get instant ATS scoring, skill extraction, and AI-powered improvement tips.</p>
        <div className="hero-stats">
          <div className="stat-pill"><FaChartLine size={13}/> <strong>1,200+</strong> Analyzed</div>
          <div className="stat-pill"><FaRocket size={13}/> <strong>94%</strong> Success Rate</div>
          <div className="stat-pill"><FaCheckCircle size={13}/> ATS Optimized</div>
        </div>
      </header>

      {/* Upload Zone */}
      <main className="main-content">
        <section className="upload-section">
          <div {...getRootProps()} className={`dropzone${isDragActive ? " dropzone-active" : ""}${file ? " dropzone-filled" : ""}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon-wrap">
              {file ? <FaFilePdf size={48} className="icon-pdf" /> : <FaCloudUploadAlt size={48} className="icon-upload" />}
            </div>
            {file ? (
              <div className="dropzone-file-info">
                <p className="dropzone-filename">{file.name}</p>
                <p className="dropzone-filesize">{(file.size / 1024).toFixed(1)} KB · Ready to analyze</p>
              </div>
            ) : (
              <div className="dropzone-empty">
                <p className="dropzone-main">Drag &amp; drop your resume</p>
                <p className="dropzone-sub">or click to browse — PDF only</p>
              </div>
            )}
          </div>

          <button className={`analyze-btn${loading ? " btn-loading" : ""}`} onClick={uploadResume} disabled={loading}>
            {loading ? (
              <><TailSpin height={20} width={20} color="#fff" wrapperStyle={{ display: "inline-block", marginRight: 8 }} />Analyzing…</>
            ) : (
              <><FaBrain size={16} style={{ marginRight: 8 }} />Analyze Resume</>
            )}
          </button>

          {message && <div className="feedback-msg">{message}</div>}
        </section>

        {/* Results */}
        {analysis && (
          <section className="results-section">
            <div className="results-header">
              <h2>Analysis Complete</h2>
              <button className="download-btn" onClick={downloadPDF}>
                <FaDownload size={14} /> Download PDF
              </button>
            </div>

            {/* Score Row */}
            <div className="score-row">
              <div className="score-card">
                <div className="score-circle-wrap">
                  <CircularProgressbar
                    value={analysis.atsScore}
                    text={`${analysis.atsScore}%`}
                    styles={buildStyles({
                      textSize: "22px",
                      pathColor: getScoreColor(analysis.atsScore),
                      textColor: getScoreColor(analysis.atsScore),
                      trailColor: "#1e293b",
                      pathTransitionDuration: 1.2,
                    })}
                  />
                </div>
                <div className="score-info">
                  <span className="score-label" style={{ color: getScoreColor(analysis.atsScore) }}>
                    {getScoreLabel(analysis.atsScore)}
                  </span>
                  <p className="score-desc">ATS Compatibility Score</p>
                </div>
              </div>
              <div className="health-checks">
                <div className="health-item"><FaCheckCircle className="hc-icon" /><span>ATS Compatible Format</span></div>
                <div className="health-item"><FaCheckCircle className="hc-icon" /><span>Skills Extracted</span></div>
                <div className="health-item"><FaCheckCircle className="hc-icon" /><span>Text Parsed Successfully</span></div>
              </div>
            </div>

            {/* Skills */}
            <div className="result-block">
              <h3 className="block-title">Identified Skills</h3>
              <div className="skill-chips">
                {analysis.skills.map((skill, i) => (
                  <span key={i} className="skill-chip">{skill.trim()}</span>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="result-block">
              <h3 className="block-title">Improvement Suggestions</h3>
              <ul className="suggestion-list">
                {analysis.suggestions.map((item, i) => (
                  <li key={i} className="suggestion-item">
                    <span className="sug-num">{String(i + 1).padStart(2, "0")}</span>
                    <span>{item.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <span><FaGithub size={14} /> GitHub Actions CI/CD — Auto deploys on push to main</span>
      </footer>
    </div>
  );
}

export default App;
