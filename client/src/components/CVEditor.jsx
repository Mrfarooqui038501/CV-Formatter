import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";
import Spinner from "./Spinner";

const CVEditor = ({ cvId, originalContent, onUpdate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt4");
  const [previewHtml, setPreviewHtml] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);

  useEffect(() => {
    setPreviewHtml("");
    setProcessingStatus(null);
  }, [cvId]);

  const processCV = async () => {
    if (!cvId) {
      toast.error("No CV selected");
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus("Starting processing...");
      
      // Step 1: Start the long-running process on the backend
      const { data } = await api.post("/ai/process", { 
        cvId, 
        model: selectedModel 
      });
      
      const processingCvId = data?.data?.cvId || cvId;
      setProcessingStatus("Processing started. This may take a moment...");
      
      // Step 2: Begin polling for status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/ai/status/${processingCvId}`);
          const statusData = statusRes?.data?.data;
          const status = statusData?.processingStatus;

          console.log("Polling status:", status);
          
          if (status === "completed") {
            clearInterval(pollInterval);
            setProcessingStatus("Processing completed!");
            setPreviewHtml(statusData?.previewHtml || "");
            toast.success("CV processed successfully!");
            // Pass the updated CV data back to Dashboard
            onUpdate && onUpdate({
              cvId: processingCvId,
              previewHtml: statusData?.previewHtml,
              formattedStructured: statusData?.formattedStructured,
              isProcessed: true
            });
            setIsProcessing(false);
          } else if (status === "failed") {
            clearInterval(pollInterval);
            setProcessingStatus("Processing failed.");
            toast.error(statusData?.processingError || "Failed to process CV");
            setIsProcessing(false);
          } else if (status === "processing") {
            setProcessingStatus("Still processing...");
          }
        } catch (pollError) {
          console.error("Polling error:", pollError);
          
          // If it's a 404, the CV might not exist
          if (pollError.response?.status === 404) {
            clearInterval(pollInterval);
            toast.error("CV not found or access denied");
            setIsProcessing(false);
            setProcessingStatus("CV not found.");
          } else {
            // For other errors, continue polling but show warning
            console.warn("Polling failed, will retry...", pollError.message);
          }
        }
      }, 3000); // Poll every 3 seconds

      // Set a timeout to stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isProcessing) {
          setIsProcessing(false);
          setProcessingStatus("Processing timeout. Please check manually.");
          toast.warning("Processing is taking longer than expected. Please refresh to check status.");
        }
      }, 300000); // 5 minutes timeout

    } catch (error) {
      console.error("Processing error:", error);
      const errorMessage = error.response?.data?.message || "Failed to start CV processing";
      toast.error(errorMessage);
      setIsProcessing(false);
      setProcessingStatus(`Failed to start: ${errorMessage}`);
    }
  };

  const exportFinal = async () => {
    if (!cvId) {
      toast.error("No CV selected");
      return;
    }

    try {
      const res = await api.get(`/files/${cvId}/export/cv`, { 
        responseType: "blob" 
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "Client_CV.docx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CV exported successfully");
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Failed to export Final CV");
    }
  };

  const exportRegistration = async () => {
    if (!cvId) {
      toast.error("No CV selected");
      return;
    }

    try {
      const res = await api.get(`/files/${cvId}/export/registration`, { 
        responseType: "blob" 
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "Registration_Form.docx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Registration form exported successfully");
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Failed to export Registration Form");
    }
  };

  const uploadHeadshot = async (file) => {
    if (!file) return;
    if (!cvId) {
      toast.error("Select a CV first");
      return;
    }

    const form = new FormData();
    form.append("photo", file);
    
    try {
      setPhotoUploading(true);
      await api.post(`/files/${cvId}/headshot`, form, { 
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Headshot uploaded successfully");
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
            disabled={isProcessing || !originalContent || !cvId}
            className="btn btn-primary"
          >
            {isProcessing ? <Spinner size="small" /> : "Process CV"}
          </button>
        </div>

        <div className="editor-secondary-controls">
          <label className="btn">
            {photoUploading ? "Uploading..." : "Upload Headshot"}
            <input 
              type="file" 
              accept="image/png,image/jpeg,image/webp" 
              hidden 
              onChange={(e) => uploadHeadshot(e.target.files?.[0])}
              disabled={photoUploading || !cvId}
            />
          </label>
          <button 
            onClick={exportFinal} 
            className="btn btn-success"
            disabled={!cvId}
          >
            Export Final CV
          </button>
          <button 
            onClick={exportRegistration} 
            className="btn btn-secondary"
            disabled={!cvId}
          >
            Export Registration
          </button>
        </div>
      </div>
      
      {processingStatus && (
        <div className="processing-status">
          <p className="processing-status-message">{processingStatus}</p>
        </div>
      )}

      {previewHtml ? (
        <div className="cv-display-grid">
          <div className="cv-panel">
            <h3 className="cv-panel-title">Original CV</h3>
            <div className="cv-content">
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {originalContent}
              </pre>
            </div>
          </div>
          <div className="cv-panel">
            <h3 className="cv-panel-title">Processed CV Preview</h3>
            <div 
              className="cv-content" 
              style={{ fontFamily: "Palatino Linotype, serif" }} 
              dangerouslySetInnerHTML={{ __html: previewHtml }} 
            />
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-state-text">
            {!cvId 
              ? "Please select a CV first." 
              : !originalContent 
                ? "CV has no content to process." 
                : "Upload a CV and click 'Process CV' to generate the template output."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default CVEditor;