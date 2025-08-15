import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";
import Spinner from "./Spinner";

const CVEditor = ({ cvId, originalContent, onUpdate }) => {
  const [formattedContent, setFormattedContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt4");
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    if (originalContent) {
      setEditedContent(originalContent);
    }
  }, [originalContent]);

  const processCV = async () => {
    if (!cvId) return;
    try {
      setIsProcessing(true);
      const response = await api.post("/ai/process", {
        cvId,
        model: selectedModel,
      });

      const formatted = response.data.data?.formattedContent || response.data.formattedContent;
      setFormattedContent(formatted);

      toast.success("CV processed successfully!");
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(error.response?.data?.message || "Failed to process CV");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put(`/files/${cvId}`, { formattedContent });
      toast.success("Changes saved successfully!");
      setEditMode(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.message || "Failed to save changes");
    }
  };

  const exportCV = async () => {
    try {
      const response = await api.get(`/files/${cvId}/export`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "formatted_cv.docx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error.response?.data?.message || "Failed to export CV");
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
        {formattedContent && (
          <div className="editor-secondary-controls">
            <button
              onClick={() => setEditMode(!editMode)}
              className="btn btn-secondary"
            >
              {editMode ? "Cancel" : "Edit"}
            </button>
            <button
              onClick={exportCV}
              className="btn btn-success"
            >
              Export CV
            </button>
          </div>
        )}
      </div>

      {formattedContent ? (
        <div className="cv-display-grid">
          <div className="cv-panel">
            <h3 className="cv-panel-title">
              Original CV
            </h3>
            <div className="cv-content">
              {originalContent}
            </div>
          </div>
          <div className="cv-panel">
            <h3 className="cv-panel-title">
              Formatted CV
            </h3>
            {editMode ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="cv-textarea"
              />
            ) : (
              <div
                className="cv-content"
                style={{ fontFamily: "Palatino Linotype, serif" }}
                dangerouslySetInnerHTML={{
                  __html: formattedContent.replace(/\n/g, "<br />"),
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-state-text">
            Upload a CV file and click "Process CV" to see the formatted version.
          </p>
        </div>
      )}

      {editMode && (
        <div className="save-container">
          <button
            onClick={handleSave}
            className="btn btn-primary btn-large"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default CVEditor;