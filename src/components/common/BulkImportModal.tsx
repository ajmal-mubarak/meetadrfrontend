import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
} from 'lucide-react';
import apiClient from '../../services/api/apiClient';
import { useToast } from '../../context/ToastContext';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  target: 'doctors' | 'hospitals';
  scope?: 'admin' | 'facility';
}

interface ImportResponse {
  success: boolean;
  total_records: number;
  imported: number;
  errors: Array<{ record: number; name?: string; error: string }>;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  target,
  scope = 'admin',
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const isDoctors = target === 'doctors';
  const title = isDoctors ? 'Bulk Import Doctors' : 'Bulk Import Healthcare Facilities';
  const templateName = isDoctors ? 'Template - Doctors Data.xlsx' : 'Template - HOSPTIAL Data.xlsx';
  const endpoint =
    scope === 'facility' && isDoctors
      ? '/api/v1/facility/doctors/import/'
      : isDoctors
      ? '/api/v1/admin/import/doctors/'
      : '/api/v1/admin/import/hospitals/';

  const downloadUrl = `/api/v1/admin/import/template/${target}/`;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv') {
      showToast('Please select a valid .xlsx or .csv spreadsheet file.', 'error');
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('Please choose an Excel or CSV file to import.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await apiClient.post<ImportResponse>(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(res);
      showToast(`Successfully imported ${res.imported} ${isDoctors ? 'doctor(s)' : 'facility/facilities'}!`, 'success');
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Import failed.';
      showToast(msg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      // 1. First attempt direct static download from public templates
      const staticUrl = `/templates/${encodeURIComponent(templateName)}`;
      const res = await fetch(staticUrl);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', templateName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        showToast('Master template downloaded.', 'success');
        return;
      }

      // 2. Fallback to backend API endpoint
      const backendUrl = `http://127.0.0.1:8000${downloadUrl}`;
      const apiRes = await fetch(backendUrl);
      if (apiRes.ok) {
        const blob = await apiRes.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', templateName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        showToast('Master template downloaded.', 'success');
        return;
      }
      throw new Error('Download failed');
    } catch {
      showToast('Failed to download template.', 'error');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6 my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                Upload official {isDoctors ? 'Doctor (18 fields)' : 'Hospital (19 fields)'} template
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Template download info banner */}
        <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-[#166534] block">Need the official template?</span>
            <span className="text-[#15803D]">
              Download {templateName} with pre-configured headers and example entries.
            </span>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3 py-2 bg-white hover:bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Template</span>
          </button>
        </div>

        {/* Step 2: Drag and drop upload */}
        {!result && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-teal-500 bg-teal-50/50'
                : 'border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            {selectedFile ? (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                  {selectedFile.name}
                </span>
                <span className="text-[11px] text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB — Click or drag to replace
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800 block">
                  Click to browse or drag and drop your file here
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Supports Microsoft Excel (.xlsx) and Comma-Separated Values (.csv)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Result Summary & Errors */}
        {result && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Import Finished</span>
              </div>
              <p className="text-emerald-700">
                Successfully processed <strong>{result.imported}</strong> of <strong>{result.total_records}</strong>{' '}
                records into the database.
              </p>
            </div>

            {result.errors.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-2 max-h-48 overflow-y-auto">
                <span className="font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  {result.errors.length} Record Warnings / Skipped
                </span>
                <div className="space-y-1 font-mono text-[11px] text-rose-700">
                  {result.errors.map((err, i) => (
                    <div key={i} className="bg-white/80 p-1.5 rounded-lg border border-rose-100">
                      Row #{err.record}: {err.name ? `[${err.name}] ` : ''}
                      {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
          {result ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Upload Another File
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Spreadsheet</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
