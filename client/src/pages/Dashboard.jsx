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
    setCvId(data.cvId);
    setOriginalContent(data.content); // Use preview content from upload
    setUserCvs((prevCvs) => [
      {
        _id: data.cvId,
        originalFilename: data.originalFilename,
        createdAt: new Date().toISOString(),
      },
      ...prevCvs,
    ]);
  };

  const handleSelectCv = async (id) => {
    try {
      const response = await api.get(`/files/${id}`);
      setCvId(id);
      setOriginalContent(response.data.data.originalContent);
    } catch (error) {
      console.error("Error selecting CV:", error);
      toast.error("Failed to load CV");
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
                      <p className="cv-filename">
                        {cv.originalFilename}
                      </p>
                      <p className="cv-date">
                        {new Date(cv.createdAt).toLocaleDateString()}
                      </p>
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
          <CVEditor cvId={cvId} originalContent={originalContent} onUpdate={() => handleSelectCv(cvId)} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;