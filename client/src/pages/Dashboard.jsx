import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import FileUpload from "../components/FileUpload";
import CVEditor from "../components/CVEditor";

const Dashboard = () => {
  const [cvId, setCvId] = useState(null);
  const [originalContent, setOriginalContent] = useState("");
  const [userCvs, setUserCvs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showBothResumes, setShowBothResumes] = useState(false);
  const [processedPreview, setProcessedPreview] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserCvs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/files");
        const cvs = Array.isArray(response?.data?.data) ? response.data.data : [];
        setUserCvs(cvs);
      } catch (error) {
        console.error("Error fetching CVs:", error);
        setError("Failed to load CVs");
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserCvs();
  }, [navigate]);

  const handleUploadSuccess = (data) => {
    console.log("Upload success data:", data); // Debug log
    
    setCvId(data.cvId);
    // Fix: Use contentPreview instead of content
    setOriginalContent(data.contentPreview || data.content || ""); 
    setShowBothResumes(false); // Reset to show only original initially
    setProcessedPreview(""); // Clear any previous processed content
    
    // Update the CV list with the new upload
    setUserCvs((prevCvs) => [
      {
        _id: data.cvId,
        originalFilename: data.originalFilename,
        createdAt: new Date().toISOString(),
        originalContent: data.contentPreview || data.content || "", // Store content for quick access
        processingStatus: 'pending'
      },
      ...prevCvs,
    ]);
    
    toast.success("CV uploaded and ready for processing!");
  };

  const handleSelectCv = async (id) => {
    try {
      // First check if we already have the content in our state
      const existingCv = userCvs.find(cv => cv._id === id);
      if (existingCv && existingCv.originalContent) {
        setCvId(id);
        setOriginalContent(existingCv.originalContent);
        
        // Check if this CV has been processed and load preview if available
        if (existingCv.processingStatus === 'completed' && existingCv.previewHtml) {
          setProcessedPreview(existingCv.previewHtml);
          setShowBothResumes(true);
        } else {
          setShowBothResumes(false);
          setProcessedPreview("");
        }
        return;
      }

      // Otherwise fetch from API
      const response = await api.get(`/files/${id}`);
      const cvData = response.data.data;
      setCvId(id);
      setOriginalContent(cvData.originalContent || "");
      
      // Check if processed and show both resumes if available
      if (cvData.processingStatus === 'completed' && cvData.previewHtml) {
        setProcessedPreview(cvData.previewHtml);
        setShowBothResumes(true);
      } else {
        setShowBothResumes(false);
        setProcessedPreview("");
      }
    } catch (error) {
      console.error("Error selecting CV:", error);
      toast.error("Failed to load CV content");
    }
  };

  const handleCvUpdate = (updateData) => {
    // Handle CV processing completion
    if (updateData && updateData.previewHtml) {
      setProcessedPreview(updateData.previewHtml);
      setShowBothResumes(true);
      
      // Update the CV in the list to mark it as processed
      setUserCvs(prevCvs => 
        prevCvs.map(cv => 
          cv._id === updateData.cvId 
            ? { 
                ...cv, 
                processingStatus: 'completed',
                previewHtml: updateData.previewHtml,
                formattedStructured: updateData.formattedStructured
              }
            : cv
        )
      );
    } else if (cvId) {
      // Fallback: refresh the CV content after processing
      handleSelectCv(cvId);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="page-title">
        AI-Powered CV Formatter
      </h1>

      <div className="dashboard-grid">
        <div>
          <div className="card">
            <h2 className="card-title">
              Your CVs
            </h2>
            <FileUpload onUploadSuccess={handleUploadSuccess} />

            {loading ? (
              <div className="loading-spinner">
                <div className="spinner spinner-medium"></div>
              </div>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : (
              <div className="cv-list">
                {userCvs.length > 0 ? (
                  userCvs.map((cv) => (
                    <div
                      key={cv._id}
                      onClick={() => handleSelectCv(cv._id)}
                      className={`cv-item ${
                        cvId === cv._id ? "active" : "inactive"
                      }`}
                    >
                      <div className="cv-item-content">
                        <p className="cv-filename">
                          {cv.originalFilename}
                        </p>
                        <p className="cv-date">
                          {new Date(cv.createdAt).toLocaleDateString()}
                        </p>
                        {cv.processingStatus === 'completed' && (
                          <span className="cv-status-indicator processed">
                            ✓ Processed
                          </span>
                        )}
                        {cv.processingStatus === 'processing' && (
                          <span className="cv-status-indicator processing">
                            ⏳ Processing
                          </span>
                        )}
                        {cvId === cv._id && (
                          <span className="cv-selected-indicator">✓ Selected</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-cvs-message">
                    No CVs found. Upload your first CV to get started.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          {!showBothResumes ? (
            <CVEditor 
              cvId={cvId} 
              originalContent={originalContent} 
              onUpdate={handleCvUpdate} 
            />
          ) : (
            <div className="resume-comparison">
              <div className="comparison-header">
                <h2 className="card-title">Resume Comparison</h2>
                <button 
                  onClick={() => setShowBothResumes(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Back to Editor
                </button>
              </div>
              
              <div className="cv-display-grid">
                <div className="cv-panel">
                  <h3 className="cv-panel-title">Original Resume</h3>
                  <div className="cv-content">
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {originalContent}
                    </pre>
                  </div>
                </div>
                
                <div className="cv-panel">
                  <h3 className="cv-panel-title">Processed Resume</h3>
                  <div 
                    className="cv-content" 
                    style={{ fontFamily: "Palatino Linotype, serif" }} 
                    dangerouslySetInnerHTML={{ __html: processedPreview }} 
                  />
                </div>
              </div>
              
              <div className="comparison-actions">
                <button 
                  onClick={() => {
                    const exportFinal = async () => {
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
                        toast.error("Failed to export Final CV");
                      }
                    };
                    exportFinal();
                  }}
                  className="btn btn-success"
                  disabled={!cvId}
                >
                  Export Processed CV
                </button>
                
                <button 
                  onClick={() => {
                    const exportRegistration = async () => {
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
                        toast.error("Failed to export Registration Form");
                      }
                    };
                    exportRegistration();
                  }}
                  className="btn btn-secondary"
                  disabled={!cvId}
                >
                  Export Registration Form
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;