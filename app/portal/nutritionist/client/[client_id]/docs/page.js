"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import rawAxios from "axios"; // Avoid custom interceptors adding auth headers to S3 requests
import {
  FaArrowLeft,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileAlt,
  FaFileImage,
  FaDownload,
  FaCloudUploadAlt,
  FaSpinner,
  FaCopy,
  FaCheckCircle,
  FaExclamationCircle,
  FaExternalLinkAlt,
  FaTrash
} from "react-icons/fa";
import { useSecureDelete, SecureDeleteModal } from "@/components/auth/SecureDeleteModal";

export default function ClientDocsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.client_id;

  const [client, setClient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingClient, setLoadingClient] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: '' }
  const fileInputRef = useRef(null);
  const { handleDeleteTrigger, secureDeleteProps } = useSecureDelete();

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch client details
  const fetchClientDetails = useCallback(async () => {
    try {
      setLoadingClient(true);
      const response = await axios.get(`/api/admin/nutritionist_sessions/client/${clientId}`);
      if (response.data?.success && response.data?.data) {
        setClient(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching client details:", err);
      showNotification("error", "Failed to retrieve client information.");
    } finally {
      setLoadingClient(false);
    }
  }, [clientId]);

  // Fetch all documents for client
  const fetchDocuments = useCallback(async () => {
    try {
      setLoadingDocs(true);
      const response = await axios.get(`/api/admin/nutritionist_sessions/client/${clientId}/docs`);
      if (response.data?.success && response.data?.data) {
        setDocuments(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      showNotification("error", "Failed to load uploaded documents.");
    } finally {
      setLoadingDocs(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
      fetchDocuments();
    }
  }, [clientId, fetchClientDetails, fetchDocuments]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Upload file function
  const handleFileUpload = async (file) => {
    if (!file) return;

    // Supported formats
    const allowedExtensions = [
      "pdf", "doc", "docx", "png", "jpg", "jpeg", "webp", "txt", "csv", "xlsx", "xls"
    ];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      showNotification(
        "error",
        `Unsupported file type. Allowed: ${allowedExtensions.join(", ").toUpperCase()}`
      );
      return;
    }

    // 20 MB size limit
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      showNotification("error", "File exceeds maximum size of 20MB.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setNotification(null);

      // 1. Get S3 Presigned Post details
      const presignedRes = await axios.get(
        `/api/admin/nutritionist_sessions/client/${clientId}/docs/upload-url`,
        {
          params: {
            file_name: file.name,
            content_type: file.type || "application/octet-stream"
          }
        }
      );

      if (!presignedRes.data?.success) {
        throw new Error(presignedRes.data?.message || "Failed to generate presigned upload details");
      }

      const { upload, cdn_url } = presignedRes.data.data;

      // 2. Upload file directly to S3
      const formData = new FormData();
      Object.entries(upload.fields).forEach(([k, v]) => {
        formData.append(k, v);
      });
      formData.append("file", file);

      await rawAxios.post(upload.url, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      // 3. Confirm upload with backend
      const confirmRes = await axios.post(
        `/api/admin/nutritionist_sessions/client/${clientId}/docs/confirm`,
        {
          cdn_url,
          file_name: file.name
        }
      );

      if (confirmRes.data?.success) {
        showNotification("success", `"${file.name}" uploaded successfully!`);
        fetchDocuments();
      } else {
        throw new Error("Failed to register document metadata in database.");
      }

    } catch (err) {
      console.error("Upload error details:", err);
      const errMsg = err.response?.data?.detail || err.message || "An unexpected error occurred during upload.";
      showNotification("error", errMsg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset input element value to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const deleteDocument = async (docId, fileName) => {
    handleDeleteTrigger(
      async () => {
        try {
          setLoadingDocs(true);
          const response = await axios.delete(`/api/admin/nutritionist_sessions/client/${clientId}/docs/${docId}`);
          if (response.data?.success) {
            showNotification("success", `"${fileName}" deleted successfully!`);
            fetchDocuments();
          } else {
            throw new Error(response.data?.message || "Failed to delete document.");
          }
        } catch (err) {
          console.error("Delete error details:", err);
          const errMsg = err.response?.data?.detail || err.message || "An unexpected error occurred during deletion.";
          showNotification("error", errMsg);
          setLoadingDocs(false);
        }
      },
      "Delete Document",
      `Are you sure you want to permanently delete "${fileName}"? This action cannot be undone.`,
      "Verify & Delete"
    );
  };

  // Helper to choose file icon and color scheme based on format
  const getFileStyle = (fileName) => {
    const ext = fileName?.split(".").pop().toLowerCase() || "";
    switch (ext) {
      case "pdf":
        return {
          icon: <FaFilePdf size={24} style={{ color: "#ef4444" }} />,
          bg: "#fef2f2",
          border: "#fee2e2",
          badgeColor: "#ef4444"
        };
      case "doc":
      case "docx":
        return {
          icon: <FaFileWord size={24} style={{ color: "#3b82f6" }} />,
          bg: "#eff6ff",
          border: "#dbeafe",
          badgeColor: "#3b82f6"
        };
      case "xls":
      case "xlsx":
      case "csv":
        return {
          icon: <FaFileExcel size={24} style={{ color: "#10b981" }} />,
          bg: "#ecfdf5",
          border: "#d1fae5",
          badgeColor: "#10b981"
        };
      case "png":
      case "jpg":
      case "jpeg":
      case "webp":
        return {
          icon: <FaFileImage size={24} style={{ color: "#8b5cf6" }} />,
          bg: "#f5f3ff",
          border: "#ede9fe",
          badgeColor: "#8b5cf6"
        };
      default:
        return {
          icon: <FaFileAlt size={24} style={{ color: "#6b7280" }} />,
          bg: "#f9fafb",
          border: "#f3f4f6",
          badgeColor: "#6b7280"
        };
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    showNotification("success", "File URL copied to clipboard!");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      {/* OTP / TOTP Secure Delete Modal */}
      <SecureDeleteModal {...secureDeleteProps} />
      {/* Premium Alert/Toast Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            borderRadius: "12px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
            background: notification.type === "success" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${notification.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            color: notification.type === "success" ? "#065f46" : "#991b1b",
            animation: "slideIn 0.3s ease-out"
          }}
        >
          {notification.type === "success" ? <FaCheckCircle size={18} /> : <FaExclamationCircle size={18} />}
          <span style={{ fontSize: "14px", fontWeight: "600" }}>{notification.message}</span>
        </div>
      )}

      {/* Modern Premium Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "32px",
          background: "#ffffff",
          padding: "20px 24px",
          borderRadius: "16px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
          border: "1px solid #f3f4f6"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "transparent",
              border: "1px solid #e5e7eb",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#4b5563",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#10b981";
              e.currentTarget.style.color = "#10b981";
              e.currentTarget.style.background = "#e6f4ea";
              e.currentTarget.style.transform = "translateX(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.color = "#4b5563";
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <FaArrowLeft size={16} />
          </button>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#111827", margin: 0, display: "flex", gap: "6px" }}>
              Document <span style={{ color: "#10b981" }}>Management</span>
            </h2>
            {client && (
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#6b7280", fontWeight: "500" }}>
                Client: <span style={{ fontWeight: "600", color: "#374151" }}>{client.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Upload on Left (or top), Feeds on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "30px", alignItems: "start" }}>
        
        {/* Left Side: File Upload Card */}
        <div
          style={{
            background: "#ffffff",
            padding: "28px",
            borderRadius: "16px",
            border: "1px solid #f3f4f6",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginTop: 0, marginBottom: "8px" }}>
            Upload Document
          </h3>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 24px 0", lineHeight: "1.4" }}>
            Attach diagnostic files, prescription logs, lab reports, or reference materials. Max file size: 20MB.
          </p>

          {/* Drap-and-drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            style={{
              border: `2px dashed ${dragActive ? "#10b981" : "#d1d5db"}`,
              borderRadius: "12px",
              padding: "40px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: dragActive ? "#ecfdf5" : "#f9fafb",
              transition: "all 0.25s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px"
            }}
            onMouseEnter={(e) => {
              if (!dragActive) {
                e.currentTarget.style.borderColor = "#10b981";
                e.currentTarget.style.background = "#f0fdf4";
              }
            }}
            onMouseLeave={(e) => {
              if (!dragActive) {
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.background = "#f9fafb";
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.csv,.xlsx,.xls"
            />
            
            <FaCloudUploadAlt
              size={48}
              style={{
                color: dragActive ? "#059669" : "#9ca3af",
                transition: "transform 0.2s ease"
              }}
            />
            
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                Drag &amp; drop file here, or <span style={{ color: "#10b981" }}>browse</span>
              </p>
              <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#9ca3af" }}>
                PDF, Word, Excel, TXT, or standard images up to 20MB
              </p>
            </div>
          </div>

          {/* Upload Progress Overlay / Loading state */}
          {uploading && (
            <div
              style={{
                marginTop: "24px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "16px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <FaSpinner className="spin" size={16} style={{ color: "#10b981" }} />
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>
                  Uploading document ({uploadProgress}%)
                </span>
              </div>
              <div style={{ width: "100%", background: "#e2e8f0", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    background: "#10b981",
                    height: "100%",
                    transition: "width 0.1s ease-out"
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Documents Feeds */}
        <div
          style={{
            background: "#ffffff",
            padding: "28px",
            borderRadius: "16px",
            border: "1px solid #f3f4f6",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            minHeight: "450px"
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginTop: 0, marginBottom: "20px" }}>
            Client Documents Feed
          </h3>

          {loadingDocs ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
              <FaSpinner className="spin" size={32} style={{ color: "#10b981", marginBottom: "12px" }} />
              <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Retrieving client archive...</p>
            </div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "80px", height: "80px", background: "#f3f4f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                <FaFileAlt size={36} />
              </div>
              <h4 style={{ margin: "8px 0 0 0", fontSize: "16px", fontWeight: "700", color: "#374151" }}>No documents found</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", maxWidth: "320px", lineHeight: "1.4" }}>
                No documents have been uploaded for this client yet. Drag &amp; drop files on the left to start.
              </p>
            </div>
          ) : (() => {
            // Determine the latest upload date (calendar day) from the first document (sorted latest-first)
            const latestDateStr = documents[0]?.created_at
              ? new Date(documents[0].created_at).toDateString()
              : null;

            return (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {documents.map((doc) => {
                const style = getFileStyle(doc.file_name);
                const isLatest = latestDateStr &&
                  new Date(doc.created_at).toDateString() === latestDateStr;
                return (
                  <div
                    key={doc.id}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      borderRadius: "12px",
                      background: style.bg,
                      border: `1px solid ${isLatest ? "#6ee7b7" : style.border}`,
                      boxShadow: isLatest
                        ? "0 2px 8px rgba(16,185,129,0.12)"
                        : "0 1px 2px rgba(0,0,0,0.02)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)";
                    }}
                  >
                    {/* Latest badge – absolutely positioned at top-right corner */}
                    {isLatest && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-9px",
                          right: "12px",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "#ffffff",
                          fontSize: "10px",
                          fontWeight: "700",
                          letterSpacing: "0.05em",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          boxShadow: "0 2px 6px rgba(16,185,129,0.35)",
                          textTransform: "uppercase",
                          lineHeight: "16px",
                          pointerEvents: "none"
                        }}
                      >
                        ✦ Latest
                      </span>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "10px",
                          background: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          border: "1px solid rgba(0,0,0,0.03)"
                        }}
                      >
                        {style.icon}
                      </div>
                      
                      <div style={{ minWidth: 0 }}>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            fontWeight: "700",
                            color: "#1f2937",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                          title={doc.file_name}
                        >
                          {doc.file_name}
                        </h4>
                        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#6b7280", fontWeight: "500" }}>
                          Uploaded: {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "16px" }}>

                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open file in new tab"
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#4b5563",
                          transition: "all 0.15s ease",
                          textDecoration: "none"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = style.badgeColor;
                          e.currentTarget.style.color = style.badgeColor;
                          e.currentTarget.style.background = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e5e7eb";
                          e.currentTarget.style.color = "#4b5563";
                          e.currentTarget.style.background = "#ffffff";
                        }}
                      >
                        <FaExternalLinkAlt size={12} />
                      </a>

                      <a
                        href={doc.url}
                        download={doc.file_name}
                        title="Download file"
                        style={{
                          background: style.badgeColor,
                          border: "none",
                          borderRadius: "8px",
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          cursor: "pointer",
                          transition: "opacity 0.15s ease",
                          textDecoration: "none"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                      >
                        <FaDownload size={13} />
                      </a>

                      <button
                        onClick={() => deleteDocument(doc.id, doc.file_name)}
                        title="Delete file"
                        style={{
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          borderRadius: "8px",
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ef4444",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          marginLeft: "4px"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#ef4444";
                          e.currentTarget.style.color = "#ffffff";
                          e.currentTarget.style.borderColor = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fef2f2";
                          e.currentTarget.style.color = "#ef4444";
                          e.currentTarget.style.borderColor = "#fecaca";
                        }}
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            );
          })()}
        </div>

      </div>

      {/* Embed micro-animations and loaders styles */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
