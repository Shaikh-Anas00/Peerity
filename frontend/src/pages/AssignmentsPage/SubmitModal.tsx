import React, { useState } from "react";
import { Upload, Send, Lock, AlertCircle } from "lucide-react";
import { Assignment } from "../../api/assignmentApi";
import { submissionApi } from "../../api/submissionApi";
import { Modal, Button } from "../../components/ui";

export interface SubmitModalProps {
  assignment: Assignment;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({ assignment, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    setError(null);

    // Validate size (max 20MB)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("File exceeds 20MB limit. Please choose a smaller file.");
      return;
    }

    // Validate extension
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'zip') {
      setError("Only PDF and ZIP documents are allowed.");
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF or ZIP file to submit.");
      return;
    }

    setSubmitting(true);
    setProgress(10);
    setError(null);

    try {
      await submissionApi.createWithFile(assignment.id, file, (pct) => {
        setProgress(Math.max(10, pct));
      });
      setProgress(100);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "File upload or encryption failed. Please try again.");
      setProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Modal open onClose={onClose} title="Submit Work" maxWidth="md">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-body">
        Assignment: <span className="font-semibold text-slate-800 dark:text-slate-200">{assignment.title}</span>
      </p>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropzone */}
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
              isDragging
                ? "border-peerity-600 bg-peerity-100/50 dark:border-teal-500 dark:bg-teal-950/30"
                : "border-slate-300 hover:border-slate-400 bg-slate-50/50 dark:border-slate-700 dark:hover:border-slate-600 dark:bg-slate-800/50"
            }`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.zip,application/pdf,application/zip"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="w-12 h-12 bg-peerity-100 text-peerity-800 dark:bg-teal-900/30 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-display">
                Click to upload <span className="font-normal text-slate-500 dark:text-slate-400 font-body">or drag and drop</span>
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-body">PDF or ZIP up to 20MB</p>
            </label>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-peerity-100 text-peerity-800 dark:bg-teal-900/30 dark:text-teal-400 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase font-display">
                  {file.name.split('.').pop()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
                </div>
              </div>
              {!submitting && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium px-2 py-1"
                >
                  Change
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cryptographic Protection Banner */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">Encrypted upload</span> — your file is encrypted in-process via <strong>AES-256-GCM</strong>, and verified using SHA-256 before storage.
          </span>
        </div>

        {/* Progress bar */}
        {submitting && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span>Encrypting &amp; Storing...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-peerity-800 dark:bg-teal-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!file}
            loading={submitting}
            leftIcon={<Send className="w-4 h-4" />}
            className="flex-1"
          >
            {submitting ? "Encrypting..." : "Submit File"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
