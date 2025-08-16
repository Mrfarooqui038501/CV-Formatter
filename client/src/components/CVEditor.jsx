// client/components/CVEditor.jsx
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";
import Spinner from "./Spinner";

const CVEditor = ({ cvId, originalContent, onUpdate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt4");
  const [previewHtml, setPreviewHtml] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    setPreviewHtml("");
  }, [cvId]);

  const processCV = async () => {
    if (!cvId) return;
    try {
      setIsProcessing(true);
      const { data } = await api.post("/ai/process", { cvId, model: selectedModel });
      setPreviewHtml(data?.data?.previewHtml || "");
      toast.success("CV processed successfully!");
      onUpdate && onUpdate();
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(error.response?.data?.message || "Failed to process CV");
    } finally {
      setIsProcessing(false);
    }
  };

  const exportFinal = async () => {
    try {
      const res = await api.get(`/files/${cvId}/export/cv`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "Client_CV.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Failed to export Final CV");
    }
  };

  const exportRegistration = async () => {
    try {
      const res = await api.get(`/files/${cvId}/export/registration`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "Registration_Form.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Failed to export Registration Form");
    }
  };

  const uploadHeadshot = async (file) => {
    if (!file) return;
    if (!cvId) return toast.error("Select a CV first");
    const form = new FormData();
    form.append("photo", file);
    try {
      setPhotoUploading(true);
      await api.post(`/files/${cvId}/headshot`, form, { headers: { "Content-Type": "multipart/form-data" }});
      toast.success("Headshot uploaded");
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Failed to upload headshot");
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <div className="cv-editor">
      <div className="editor-controls">
        <div className="editor-primary-controls">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="model-select"
            disabled={isProcessing}
          >
            <option value="gpt4">GPT-4</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
          </select>
          <button
            onClick={processCV}
            disabled={isProcessing || !originalContent}
            className="btn btn-primary"
          >
            {isProcessing ? <Spinner size="small" /> : "Process CV"}
          </button>
        </div>

        <div className="editor-secondary-controls">
          <label className="btn">
            {photoUploading ? "Uploading..." : "Upload Headshot"}
            <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e)=>uploadHeadshot(e.target.files?.[0])}/>
          </label>
          <button onClick={exportFinal} className="btn btn-success">Export Final CV</button>
          <button onClick={exportRegistration} className="btn btn-secondary">Export Registration</button>
        </div>
      </div>

      {previewHtml ? (
        <div className="cv-display-grid">
          <div className="cv-panel">
            <h3 className="cv-panel-title">Original CV</h3>
            <div className="cv-content">{originalContent}</div>
          </div>
          <div className="cv-panel">
            <h3 className="cv-panel-title">Template Preview</h3>
            <div className="cv-content" style={{ fontFamily: "Palatino Linotype, serif" }} dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-state-text">Upload a CV and click "Process CV" to generate the template output.</p>
        </div>
      )}
    </div>
  );
};

export default CVEditor;
