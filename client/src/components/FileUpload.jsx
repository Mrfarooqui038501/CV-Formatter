import React, { useState } from "react";
import api from "../api/axios";

const FileUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file first.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await api.post(
        "/files", 
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(res.data.message || "File uploaded successfully!");
      // If you want to auto-pick the uploaded CV for editing:
      if (onUploadSuccess) {
        onUploadSuccess({
          cvId: res.data.cvId,
          content: res.data.contentPreview, // Using the first 500 chars for preview
          originalFilename: res.data.filename,
        });
      }
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      setMessage(
        error.response?.data?.message || "File upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <input type="file" onChange={handleFileChange} className="file-input" />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="btn btn-primary"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {message && <p className="upload-message">{message}</p>}
    </div>
  );
};

export default FileUpload;