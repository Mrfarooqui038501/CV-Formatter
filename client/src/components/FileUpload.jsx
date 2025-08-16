import React, { useState } from "react";
import api from "../api/axios";

const FileUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // Clear any previous messages when a new file is selected
    if (file) {
      setMessage(`Selected: ${file.name}`);
    } else {
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file first.");
      return;
    }

    try {
      setUploading(true);
      setMessage("Uploading file...");

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

      console.log("Upload response:", res.data); // Debug log

      setMessage(res.data.message || "File uploaded successfully!");
      
      // Clear the selected file after successful upload
      setSelectedFile(null);
      
      // Reset the file input
      const fileInput = document.querySelector('.file-input');
      if (fileInput) fileInput.value = '';

      // Call the success callback with the response data
      if (onUploadSuccess) {
        onUploadSuccess({
          cvId: res.data.cvId || res.data.data?.cvId,
          contentPreview: res.data.contentPreview || res.data.data?.contentPreview,
          content: res.data.content || res.data.data?.content,
          originalFilename: res.data.filename || res.data.data?.originalFilename,
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
      <div className="file-upload-container">
        <input 
          type="file" 
          onChange={handleFileChange} 
          className="file-input"
          accept=".pdf,.doc,.docx,.txt"
          disabled={uploading}
        />
        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className="btn btn-primary"
        >
          {uploading ? "Uploading..." : "Upload CV"}
        </button>
      </div>
      {message && (
        <p className={`upload-message ${message.includes('success') ? 'success' : message.includes('error') || message.includes('failed') ? 'error' : 'info'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default FileUpload;