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
  Info,
} from 'lucide-react';
import apiClient from '../../services/api/apiClient';
import { buildApiUrl } from '../../config/api';
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
  skipped?: number;
  message?: string;
  errors: Array<{ record: number; name?: string; error: string; skipped?: boolean }>;
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
  const templateName = isDoctors ? 'Doctor Template.xlsx' : 'Hospital Template.xlsx';
  const endpoint =
    scope === 'facility' && isDoctors
      ? '/facility/doctors/import/'
      : isDoctors
      ? '/admin/import/doctors/'
      : '/admin/import/hospitals/';

  const downloadUrl = `/admin/import/template/${target}/`;

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
    if (file.size > 25 * 1024 * 1024) {
      showToast('File size exceeds the 25 MB maximum limit.', 'error');
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

      const res = await apiClient.post<ImportResponse>(endpoint, formData);

      setResult(res);
      if (res.imported > 0 && res.skipped && res.skipped > 0) {
        showToast(res.message || `Imported ${res.imported}, skipped ${res.skipped} existing duplicates.`, 'success');
      } else if (res.imported > 0) {
        showToast(res.message || `Successfully imported ${res.imported} ${isDoctors ? 'doctor(s)' : 'facility/facilities'}!`, 'success');
      } else if (res.skipped && res.skipped > 0) {
        showToast(res.message || `All records already exist in database (skipped).`, 'info');
      } else {
        showToast('Import completed.', 'info');
      }
      onSuccess();
    } catch (err: any) {
      const msg =
        err.data?.error ||
        (Array.isArray(err.data?.errors) && err.data.errors[0]?.error
          ? `Import error: ${err.data.errors[0].name ? err.data.errors[0].name + ' - ' : ''}${err.data.errors[0].error}`
          : null) ||
        err.message ||
        'Import failed.';
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
      const backendUrl = buildApiUrl(downloadUrl);
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
                Upload official {isDoctors ? 'Doctor (18 fields)' : 'Hospital (20 fields)'} template
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
                  {(selectedFile.size / 1024).toFixed(1)} KB · Max: 25 MB (Up to 500 records) — Click or drag to replace
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Click to browse or drag and drop your file here
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Supports Microsoft Excel (.xlsx) and Comma-Separated Values (.csv)
                </span>
                <div className="inline-flex items-center gap-2 pt-1 text-[11px] font-semibold text-slate-500">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    Max size: 25 MB
                  </span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    Max records: 500 / batch
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Result Summary & Errors */}
        {result && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                result.imported > 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : (result.skipped || 0) > 0
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-rose-50 border-rose-200'
              }`}
            >
              <div
                className={`flex items-center gap-2 font-bold text-sm ${
                  result.imported > 0
                    ? 'text-emerald-800'
                    : (result.skipped || 0) > 0
                    ? 'text-amber-800'
                    : 'text-rose-800'
                }`}
              >
                {result.imported > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (result.skipped || 0) > 0 ? (
                  <Info className="w-5 h-5 text-amber-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                )}
                <span>
                  {result.imported > 0
                    ? 'Import Finished'
                    : (result.skipped || 0) > 0
                    ? 'Records Already Exist'
                    : 'Import Failed'}
                </span>
              </div>

              {result.message && (
                <p
                  className={`font-medium ${
                    result.imported > 0
                      ? 'text-emerald-700'
                      : (result.skipped || 0) > 0
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}
                >
                  {result.message}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1 font-semibold">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {result.imported} Imported
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
                  {result.skipped || 0} Skipped (Duplicates)
                </span>
                {result.errors.filter((e) => !e.skipped).length > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
                    {result.errors.filter((e) => !e.skipped).length} Failed
                  </span>
                )}
              </div>
            </div>

            {/* Skipped duplicates notice list */}
            {result.errors.filter((e) => e.skipped).length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2 max-h-40 overflow-y-auto">
                <span className="font-bold text-amber-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600" />
                  Existing Records Skipped ({result.errors.filter((e) => e.skipped).length})
                </span>
                <div className="space-y-1 font-mono text-[11px] text-amber-800">
                  {result.errors
                    .filter((e) => e.skipped)
                    .map((err, i) => (
                      <div key={i} className="bg-white/90 p-2 rounded-lg border border-amber-100">
                        Row #{err.record}: {err.error}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Actual errors list */}
            {result.errors.filter((e) => !e.skipped).length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-2 max-h-40 overflow-y-auto">
                <span className="font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Import Errors ({result.errors.filter((e) => !e.skipped).length})
                </span>
                <div className="space-y-1 font-mono text-[11px] text-rose-700">
                  {result.errors
                    .filter((e) => !e.skipped)
                    .map((err, i) => (
                      <div key={i} className="bg-white/80 p-2 rounded-lg border border-rose-100">
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
