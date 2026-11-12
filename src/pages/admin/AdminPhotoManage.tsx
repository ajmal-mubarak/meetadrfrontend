import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  Stethoscope,
  Building2,
  Sparkles,
  Layers,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import {
  photoManageService,
  PhotoCategory,
  StoragePhotoItem,
} from '../../services/photoManageService';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';

const SUPABASE_BUCKET_BASE =
  'https://kpdichfdhrkcdivqebow.supabase.co/storage/v1/object/public/photos';

export const AdminPhotoManage: React.FC = () => {
  const { showToast } = useToast();
  const { t, isArabic } = useTranslation();

  const [activeCategory, setActiveCategory] = useState<PhotoCategory>('doctors');
  const [photos, setPhotos] = useState<StoragePhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy URL state for individual items
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedFormula, setCopiedFormula] = useState<boolean>(false);

  // Load photos for active category
  const loadCategoryPhotos = async (category: PhotoCategory) => {
    setIsLoading(true);
    try {
      const items = await photoManageService.listPhotos(category);
      setPhotos(items);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load photos from cloud storage.';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategoryPhotos(activeCategory);
    setSelectedFiles([]);
  }, [activeCategory]);

  // Drag and drop handlers
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
    }
  };

  const handleFilesSelected = (newFiles: File[]) => {
    const validImages: File[] = [];
    for (const f of newFiles) {
      if (!f.type.startsWith('image/') && !/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f.name)) {
        showToast(`Skipped ${f.name}: only images are allowed.`, 'error');
        continue;
      }
      if (f.size > 25 * 1024 * 1024) {
        showToast(`Skipped ${f.name}: exceeds 25 MB limit.`, 'error');
        continue;
      }
      validImages.push(f);
    }

    if (validImages.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validImages]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Perform upload
  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) {
      showToast('Please select photos to upload first.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    try {
      const res = await photoManageService.uploadPhotos(activeCategory, selectedFiles);

      if (res.uploaded && res.uploaded.length > 0) {
        showToast(
          `Successfully uploaded ${res.uploaded.length} photo(s) to ${activeCategory}!`,
          'success'
        );
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await loadCategoryPhotos(activeCategory);
      }

      if (res.errors && res.errors.length > 0) {
        showToast(`Failed to upload ${res.errors.length} file(s).`, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Upload failed.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  // Copy single URL
  const copyToClipboard = async (url: string, path: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPath(path);
      showToast('Image URL copied to clipboard!', 'success');
      setTimeout(() => {
        setCopiedPath(null);
      }, 2000);
    } catch {
      showToast('Could not copy to clipboard. Please copy manually.', 'error');
    }
  };

  // Copy All URLs
  const copyAllUrls = async () => {
    if (filteredPhotos.length === 0) {
      showToast('No photos to copy.', 'info');
      return;
    }
    const allUrls = filteredPhotos.map((p) => p.url).join('\n');
    try {
      await navigator.clipboard.writeText(allUrls);
      setCopiedAll(true);
      showToast(`Copied ${filteredPhotos.length} URL(s) to clipboard!`, 'success');
      setTimeout(() => {
        setCopiedAll(false);
      }, 2500);
    } catch {
      showToast('Could not copy URLs.', 'error');
    }
  };

  // Copy Excel formula
  const copyExcelFormula = async () => {
    const formula = `="${SUPABASE_BUCKET_BASE}/${activeCategory}/" & A2 & ".jpg"`;
    try {
      await navigator.clipboard.writeText(formula);
      setCopiedFormula(true);
      showToast('Excel formula copied to clipboard!', 'success');
      setTimeout(() => {
        setCopiedFormula(false);
      }, 2500);
    } catch {
      showToast('Could not copy formula.', 'error');
    }
  };

  // Delete single photo
  const handleDeletePhoto = async (item: StoragePhotoItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}" from Cloud Storage?`)) {
      return;
    }

    try {
      const ok = await photoManageService.deletePhoto(item.path);
      if (ok) {
        showToast('Photo deleted successfully.', 'info');
        setPhotos((prev) => prev.filter((p) => p.path !== item.path));
      } else {
        showToast('Failed to delete photo.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Delete error.', 'error');
    }
  };

  // Filtered photos based on search
  const filteredPhotos = useMemo(() => {
    if (!searchQuery.trim()) return photos;
    const q = searchQuery.toLowerCase().trim();
    return photos.filter((p) => p.name.toLowerCase().includes(q));
  }, [photos, searchQuery]);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 w-full max-w-full pb-16">
      {/* ── Header Banner ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBF0] text-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-[#0E7490] text-xs font-bold mb-2">
            <ImageIcon className="w-3.5 h-3.5 text-[#2DA7B5]" />
            <span>Cloud Media & Photo Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Photo Manage
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Upload bulk photos directly to your Supabase public bucket, get instant CDN URLs, and
            copy links for your Excel bulk import sheets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Bucket: <strong className="text-slate-800">photos</strong> (Public CDN)</span>
          </div>
        </div>
      </div>

      {/* ── Category Selection Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E2EBF0] pb-2">
        <button
          type="button"
          onClick={() => setActiveCategory('doctors')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeCategory === 'doctors'
              ? 'bg-[#0E7490] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-[#E2EBF0]'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctor Photos</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeCategory === 'doctors'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {activeCategory === 'doctors' ? photos.length : 'Folder'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('hospitals')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeCategory === 'hospitals'
              ? 'bg-[#0E7490] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-[#E2EBF0]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hospital Photos</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeCategory === 'hospitals'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {activeCategory === 'hospitals' ? photos.length : 'Folder'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('logos')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeCategory === 'logos'
              ? 'bg-[#0E7490] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-[#E2EBF0]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Hospital Logos</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeCategory === 'logos'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {activeCategory === 'logos' ? photos.length : 'Folder'}
          </span>
        </button>
      </div>

      {/* ── Drag & Drop Multi-Photo Upload Area ── */}
      <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Upload className="w-5 h-5 text-[#2DA7B5]" />
          <span>Upload Multiple Photos to <strong>"{activeCategory}"</strong></span>
        </h2>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-[#2DA7B5] bg-[#E8F6F8]/60 scale-[1.005]'
              : 'border-slate-300 hover:border-[#2DA7B5] bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <div className="w-14 h-14 rounded-2xl bg-[#E8F6F8] text-[#0E7490] flex items-center justify-center mx-auto mb-3">
            <Upload className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Click to browse or drag and drop photos here
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports selecting 1, 10, 50, or 100+ files at once (JPG, PNG, WEBP up to 25 MB each)
          </p>
        </div>

        {/* Selected Files Queue */}
        {selectedFiles.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Selected for upload ({selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}):
              </span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear all
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border border-[#E2EBF0] rounded-xl p-2 bg-slate-50 divide-y divide-slate-100">
              {selectedFiles.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="flex items-center justify-between py-1.5 px-2 text-xs">
                  <span className="truncate max-w-[70%] font-medium text-slate-800">{file.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelectedFile(idx);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isUploading}
                onClick={handleStartUpload}
                className="px-6 py-2.5 rounded-xl bg-[#2DA7B5] hover:bg-[#23929F] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Start Upload ({selectedFiles.length} Photos)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Photo Gallery Section ── */}
      <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Uploaded in "{activeCategory}"
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
              {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by filename..."
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#2DA7B5] w-48 sm:w-56"
              />
            </div>

            {/* Copy All URLs button */}
            <button
              type="button"
              disabled={filteredPhotos.length === 0}
              onClick={copyAllUrls}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'All URLs Copied!' : 'Copy All URLs'}</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => loadCategoryPhotos(activeCategory)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#2DA7B5]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#2DA7B5] mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Fetching photos from Supabase Storage...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No photos in this folder yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Use the upload area above to drag and drop multiple photos into the "{activeCategory}" folder.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPhotos.map((item) => {
              const isCopied = copiedPath === item.path;
              return (
                <div
                  key={item.path}
                  className="group bg-white rounded-2xl border border-[#E2EBF0] overflow-hidden hover:border-[#2DA7B5] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Image Preview Container */}
                  <div className="relative aspect-4/3 bg-slate-900 overflow-hidden flex items-center justify-center">
                    <img
                      src={item.url}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Quick View External Link */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100"
                      title="Open full image in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {/* File size badge */}
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-white">
                      {formatFileSize(item.size)}
                    </span>
                  </div>

                  {/* Card Details & Actions */}
                  <div className="p-3.5 space-y-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5" title={item.url}>
                        {item.url}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      {/* Copy URL Button */}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.url, item.path)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#E8F6F8] hover:bg-[#2DA7B5] text-[#0E7490] hover:text-white'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(item)}
                        className="p-1.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                        title="Delete from bucket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

