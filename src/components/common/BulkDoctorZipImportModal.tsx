import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FolderArchive,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  Search,
  Eye,
  ArrowLeft,
  Building2,
  Check,
  AlertCircle,
  HelpCircle,
  ImageIcon,
} from 'lucide-react';
import apiClient from '../../services/api/apiClient';
import { buildApiUrl } from '../../config/api';
import { useToast } from '../../context/ToastContext';
import { realAdminService } from '../../services/realAdminService';

interface BulkDoctorZipImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scope?: 'admin' | 'facility';
  facilityId?: string;
  facilityName?: string;
}

interface PreviewDoctor {
  row: number;
  doctor_id: string;
  name: string;
  department: string;
  specialty: string;
  email: string;
  contact_number: string;
  matched_photo: string | null;
  thumbnail: string | null;
  has_photo: boolean;
  is_duplicate: boolean;
  dup_reason: string;
  is_valid: boolean;
  errors: string[];
}

interface PreviewResponse {
  job_id: string;
  status: string;
  hospital_id: string | null;
  hospital_name: string;
  total_records: number;
  matched_photos: number;
  missing_photos: number;
  unused_photos: number;
  duplicate_records: number;
  invalid_records: number;
  preview_data: {
    doctors: PreviewDoctor[];
    unused_photos: string[];
    total_unused_count: number;
    invalid_files_in_zip: string[];
  };
  error_log: Array<{ row: number; name: string; error: string }>;
}

interface JobStatusResponse {
  job_id: string;
  status: 'pending' | 'validating' | 'preview_ready' | 'importing' | 'completed' | 'failed';
  percentage: number;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  skipped_records: number;
  matched_photos: number;
  missing_photos: number;
  unused_photos: number;
  error_log: any[];
}

export const BulkDoctorZipImportModal: React.FC<BulkDoctorZipImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  scope = 'admin',
  facilityId,
  facilityName,
}) => {
  const { showToast } = useToast();

  // Wizard steps: 1: Upload Files, 2: Preview & Validation, 3: Processing & Results
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Files
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Hospital selection (for Admin)
  const [hospitals, setHospitals] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(facilityId || '');

  // Options
  const [activateImmediately, setActivateImmediately] = useState<boolean>(false);

  // Validation State
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<PreviewResponse | null>(null);

  // Filter in Preview
  const [previewFilter, setPreviewFilter] = useState<'all' | 'matched' | 'missing' | 'issues'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Job progress state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Polling ref
  const pollTimerRef = useRef<any>(null);

  // Load hospitals on mount for admin
  useEffect(() => {
    if (scope === 'admin' && isOpen) {
      realAdminService.getProviders()
        .then((provs) => {
          const hospList = provs.map((p) => ({ id: p.id, name: p.name }));
          setHospitals(hospList);
          if (hospList.length > 0 && !selectedHospitalId) {
            setSelectedHospitalId(hospList[0].id);
          }
        })
        .catch(() => {});
    }
  }, [scope, isOpen]);

  // Clean up polling timer
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // ── Drag & Drop Handlers ───────────────────────────────────────────────────
  const handleExcelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'csv') {
        setExcelFile(file);
      } else {
        showToast('Please upload a valid .xlsx or .csv spreadsheet file.', 'error');
      }
    }
  };

  const handleZipDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'zip') {
        setZipFile(file);
      } else {
        showToast('Please upload a valid .zip archive file.', 'error');
      }
    }
  };

  // ── Template Download ───────────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const endpoint = scope === 'admin'
      ? '/admin/import/doctors-zip/template/'
      : '/facilities/doctors/import-zip/template/';
    const url = buildApiUrl(endpoint);
    window.open(url, '_blank');
  };

  // ── Validation & Preview ────────────────────────────────────────────────────
  const handleValidateAndPreview = async () => {
    if (!excelFile) {
      showToast('Please upload the Doctor details spreadsheet (.xlsx or .csv).', 'error');
      return;
    }
    if (!zipFile) {
      showToast('Please upload the Doctor headshots ZIP archive (.zip).', 'error');
      return;
    }

    setIsValidating(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      formData.append('zip', zipFile);
      if (selectedHospitalId) {
        formData.append('hospital_id', selectedHospitalId);
      }

      const endpoint = scope === 'admin'
        ? '/admin/import/doctors-zip/preview/'
        : '/facilities/doctors/import-zip/preview/';

      const res = await apiClient.post<PreviewResponse>(endpoint, formData);
      setPreviewResult(res);
      setJobId(res.job_id);
      setCurrentStep(2);
      showToast(`Analyzed ${res.total_records} doctor records and matched ${res.matched_photos} photos!`, 'success');
    } catch (err: any) {
      const msg = err.data?.error || err.data?.detail || err.message || 'Validation failed. Please verify spreadsheet format.';
      showToast(msg, 'error');
    } finally {
      setIsValidating(false);
    }
  };

  // ── Execute Import ──────────────────────────────────────────────────────────
  const handleStartImport = async () => {
    if (!excelFile || !zipFile) return;

    setIsImporting(true);
    setCurrentStep(3);

    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      formData.append('zip', zipFile);
      if (jobId) formData.append('job_id', jobId);
      if (selectedHospitalId) formData.append('hospital_id', selectedHospitalId);
      formData.append('activate_immediately', activateImmediately ? 'true' : 'false');

      const endpoint = scope === 'admin'
        ? '/admin/import/doctors-zip/execute/'
        : '/facilities/doctors/import-zip/execute/';

      const res = await apiClient.post<{ job_id: string; message: string }>(endpoint, formData);
      const activeJobId = res.job_id || jobId;
      setJobId(activeJobId);

      // Start polling
      if (activeJobId) {
        startPolling(activeJobId);
      }
    } catch (err: any) {
      const msg = err.data?.error || err.message || 'Failed to start import.';
      showToast(msg, 'error');
      setIsImporting(false);
    }
  };

  const startPolling = (currentJobId: string) => {
    const statusEndpoint = scope === 'admin'
      ? `/admin/import/doctors-zip/status/${currentJobId}/`
      : `/facilities/doctors/import-zip/status/${currentJobId}/`;

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await apiClient.get<JobStatusResponse>(statusEndpoint);
        setJobStatus(res);

        if (res.status === 'completed' || res.status === 'failed') {
          clearInterval(pollTimerRef.current);
          setIsImporting(false);
          if (res.status === 'completed') {
            showToast(`Import finished! Successfully created ${res.successful_records} doctors.`, 'success');
            onSuccess();
          } else {
            showToast('Import completed with errors. See summary log.', 'error');
          }
        }
      } catch (err) {
        // Keep polling briefly on network jitter
      }
    }, 1500);
  };

  // ── Filtered Doctors in Preview ─────────────────────────────────────────────
  const doctorsList = previewResult?.preview_data?.doctors || [];
  const filteredDoctors = doctorsList.filter((doc) => {
    // Search query
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      doc.name.toLowerCase().includes(q) ||
      doc.doctor_id.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q) ||
      doc.department.toLowerCase().includes(q)
    );
    if (!matchesSearch) return false;

    // Filter tab
    if (previewFilter === 'matched') return doc.has_photo;
    if (previewFilter === 'missing') return !doc.has_photo;
    if (previewFilter === 'issues') return doc.is_duplicate || !doc.is_valid;
    return true;
  });

  const handleReset = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setCurrentStep(1);
    setExcelFile(null);
    setZipFile(null);
    setPreviewResult(null);
    setJobId(null);
    setJobStatus(null);
    setIsImporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Bulk Doctor Import (Excel + ZIP)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Upload Doctor details spreadsheet and matching profile headshots in one ZIP file
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

        {/* Step Indicator */}
        <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-semibold shrink-0">
          <div className="flex items-center gap-2 sm:gap-6">
            <div className={`flex items-center gap-1.5 ${currentStep === 1 ? 'text-teal-600 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                1
              </span>
              <span>Upload Files</span>
            </div>
            <span className="text-slate-300">/</span>
            <div className={`flex items-center gap-1.5 ${currentStep === 2 ? 'text-teal-600 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                2
              </span>
              <span>Preview & Match</span>
            </div>
            <span className="text-slate-300">/</span>
            <div className={`flex items-center gap-1.5 ${currentStep === 3 ? 'text-teal-600 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                3
              </span>
              <span>Import Progress</span>
            </div>
          </div>
          {currentStep === 2 && (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Files
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ════════════════════════════════════════════════════════════════════
              STEP 1: UPLOAD FILES
             ════════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Hospital Target Selection */}
              {scope === 'admin' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    Target Hospital / Clinic Affiliation *
                  </label>
                  <select
                    value={selectedHospitalId}
                    onChange={(e) => setSelectedHospitalId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-teal-500 bg-white"
                  >
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 flex items-center gap-2 text-xs text-teal-800">
                  <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Importing doctors directly into <strong>{facilityName || 'Your Hospital Facility'}</strong>.</span>
                </div>
              )}

              {/* Template Download Banner */}
              <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-[#166534] block text-sm">Need the Enterprise Excel Template?</span>
                  <span className="text-[#15803D]">
                    Download the official template pre-configured for Doctor ID and ZIP photo file matching.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-[#166534] hover:bg-[#14532D] text-white rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs text-xs shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Dual Upload Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Box 1: Excel File */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleExcelDrop}
                  onClick={() => excelInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[190px] ${
                    excelFile
                      ? 'border-emerald-500 bg-emerald-50/40'
                      : 'border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={(e) => e.target.files && setExcelFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${excelFile ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-50 text-teal-600'}`}>
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  {excelFile ? (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {excelFile.name}
                      </span>
                      <p className="text-[11px] text-slate-500">{(excelFile.size / 1024).toFixed(1)} KB · Click to replace</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-700">1. Upload Doctor Spreadsheet</p>
                      <p className="text-[11px] text-slate-500 mt-1">Excel (.xlsx) or CSV with doctor details</p>
                      <span className="inline-block mt-3 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 shadow-2xs">
                        Browse Spreadsheet
                      </span>
                    </div>
                  )}
                </div>

                {/* Box 2: ZIP File */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleZipDrop}
                  onClick={() => zipInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[190px] ${
                    zipFile
                      ? 'border-blue-500 bg-blue-50/40'
                      : 'border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip"
                    onChange={(e) => e.target.files && setZipFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${zipFile ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600'}`}>
                    <FolderArchive className="w-6 h-6" />
                  </div>
                  {zipFile ? (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        {zipFile.name}
                      </span>
                      <p className="text-[11px] text-slate-500">{(zipFile.size / (1024 * 1024)).toFixed(2)} MB · Click to replace</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-700">2. Upload Photos Archive</p>
                      <p className="text-[11px] text-slate-500 mt-1">ZIP (.zip) with headshots named by Doctor ID</p>
                      <span className="inline-block mt-3 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 shadow-2xs">
                        Browse ZIP Archive
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Naming Guidance */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">How photo matching works:</span>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Name images in the ZIP using the <strong>Doctor ID</strong> (e.g. <code>D001.jpg</code>) or the exact filename listed in the spreadsheet.
                    Supported formats: <strong>JPG, JPEG, PNG, WebP</strong>. Images are automatically cropped and converted to high-performance WebP upon import.
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleValidateAndPreview}
                  disabled={!excelFile || !zipFile || isValidating}
                  className="px-6 py-3 bg-[#0E7490] hover:bg-[#0c627a] text-white rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating Records & Photos...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Validate & Preview Records</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              STEP 2: PREVIEW & VALIDATION BREAKDOWN
             ════════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && previewResult && (
            <div className="space-y-5">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold block">Total In Excel</span>
                  <span className="text-xl font-black text-slate-900 mt-0.5 block">{previewResult.total_records}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 font-semibold block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Matched Photos
                  </span>
                  <span className="text-xl font-black text-emerald-800 mt-0.5 block">{previewResult.matched_photos}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] text-amber-700 font-semibold block flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Missing Photos
                  </span>
                  <span className="text-xl font-black text-amber-800 mt-0.5 block">{previewResult.missing_photos}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-[11px] text-blue-700 font-semibold block flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Unused in ZIP
                  </span>
                  <span className="text-xl font-black text-blue-800 mt-0.5 block">{previewResult.unused_photos}</span>
                </div>
              </div>

              {/* Unused Photos Banner (if any) */}
              {previewResult.unused_photos > 0 && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-800">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{previewResult.unused_photos} photos in the ZIP did not match any Doctor ID in the spreadsheet:</span>
                  </div>
                  <p className="text-[11px] text-blue-700 line-clamp-2 leading-relaxed">
                    {previewResult.preview_data.unused_photos.join(', ')}
                    {previewResult.unused_photos > 100 && ' ...and more'}
                  </p>
                  <span className="text-[10px] text-blue-600 block mt-1 italic">
                    These extra photos will simply be ignored during import.
                  </span>
                </div>
              )}

              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${previewFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    All ({previewResult.total_records})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('matched')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${previewFilter === 'matched' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    With Photos ({previewResult.matched_photos})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('missing')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${previewFilter === 'missing' ? 'bg-white text-amber-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Missing Photos ({previewResult.missing_photos})
                  </button>
                  {(previewResult.duplicate_records > 0 || previewResult.invalid_records > 0) && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('issues')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${previewFilter === 'issues' ? 'bg-white text-rose-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Issues ({previewResult.duplicate_records + previewResult.invalid_records})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
                  <input
                    type="text"
                    placeholder="Filter doctor or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 w-full sm:w-56"
                  />
                </div>
              </div>

              {/* Doctors Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Photo</th>
                        <th className="py-2.5 px-3">Doctor Name & ID</th>
                        <th className="py-2.5 px-3">Specialty / Dept</th>
                        <th className="py-2.5 px-3">Photo Status</th>
                        <th className="py-2.5 px-3">Record Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDoctors.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No doctors match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredDoctors.map((doc) => (
                          <tr key={doc.row} className="hover:bg-slate-50/70 transition-colors">
                            {/* Photo / Thumbnail */}
                            <td className="py-2 px-3">
                              {doc.thumbnail ? (
                                <img
                                  src={doc.thumbnail}
                                  alt={doc.name}
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs border border-slate-200">
                                  {doc.name.charAt(0) || 'D'}
                                </div>
                              )}
                            </td>

                            {/* Name & ID */}
                            <td className="py-2 px-3">
                              <span className="font-bold text-slate-900 block">{doc.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {doc.doctor_id ? `ID: ${doc.doctor_id}` : `Row ${doc.row}`}
                              </span>
                            </td>

                            {/* Specialty / Dept */}
                            <td className="py-2 px-3">
                              <span className="text-slate-800 font-medium block">{doc.specialty}</span>
                              <span className="text-[10px] text-slate-400 block">{doc.department}</span>
                            </td>

                            {/* Photo Status */}
                            <td className="py-2 px-3">
                              {doc.has_photo ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  {doc.matched_photo}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  Initials Avatar
                                </span>
                              )}
                            </td>

                            {/* Record Status */}
                            <td className="py-2 px-3">
                              {doc.is_duplicate ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 block truncate max-w-[140px]" title={doc.dup_reason}>
                                  Skip (Duplicate)
                                </span>
                              ) : !doc.is_valid ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 block truncate max-w-[140px]" title={doc.errors.join(', ')}>
                                  Invalid
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Ready
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status option */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Doctor Account Status</span>
                  <span className="text-[11px] text-slate-500">
                    {activateImmediately
                      ? 'Doctors will be set to Active immediately upon import.'
                      : 'Doctors will remain Pending Verification (Deactivated) until administrator approval.'}
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={activateImmediately}
                    onChange={(e) => setActivateImmediately(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500"
                  />
                  <span>Activate immediately</span>
                </label>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Back to Files
                </button>
                <button
                  type="button"
                  onClick={handleStartImport}
                  className="px-6 py-2.5 bg-[#0E7490] hover:bg-[#0c627a] text-white rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Import ({previewResult.total_records - previewResult.invalid_records} Doctors)</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              STEP 3: IMPORT PROGRESS & RESULTS
             ════════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="py-8 space-y-6 text-center max-w-lg mx-auto">
              {jobStatus?.status === 'completed' ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Import Completed!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Doctor records and headshots have been successfully imported into the system.
                    </p>
                  </div>

                  {/* Summary badges */}
                  <div className="grid grid-cols-3 gap-3 text-xs pt-2">
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[11px] text-emerald-700 font-bold block">Created</span>
                      <span className="text-lg font-black text-emerald-800">{jobStatus.successful_records}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                      <span className="text-[11px] text-blue-700 font-bold block">Duplicates Skipped</span>
                      <span className="text-lg font-black text-blue-800">{jobStatus.skipped_records}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-600 font-bold block">Failed</span>
                      <span className="text-lg font-black text-slate-800">{jobStatus.failed_records}</span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs transition-all cursor-pointer"
                    >
                      Import Another Batch
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 bg-[#0E7490] hover:bg-[#0c627a] text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md"
                    >
                      Close & View Doctors
                    </button>
                  </div>
                </div>
              ) : jobStatus?.status === 'failed' ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Import Encountered Issues</h4>
                    <p className="text-xs text-rose-600 mt-1">
                      {jobStatus.error_log[0]?.system_error || 'An error occurred during import processing.'}
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                    >
                      Back to Preview
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                    <Loader2 className="w-7 h-7 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Importing Doctors & Photos...</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Optimizing headshots to WebP, uploading to Supabase Storage, and creating doctor profiles.
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${jobStatus?.percentage || 10}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>{jobStatus?.processed_records || 0} of {jobStatus?.total_records || previewResult?.total_records || '...'} processed</span>
                      <span>{jobStatus?.percentage || 10}%</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    You can safely keep this open. Large imports (700+ doctors) run in parallel in the background.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
