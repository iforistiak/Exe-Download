import React, { useState } from 'react';
import { X, Copy, Check, Download, Terminal, ShieldCheck, ExternalLink } from 'lucide-react';
import { CATEGORIES, SoftwareItem } from '../data/softwares';
import { SoftwareArtwork } from './SoftwareArtwork';

interface PackageModalProps {
  software: SoftwareItem | null;
  onClose: () => void;
  isBundled: boolean;
  onToggleBundle: (id: number) => void;
}

export const PackageModal: React.FC<PackageModalProps> = ({
  software,
  onClose,
  isBundled,
  onToggleBundle,
}) => {
  const [copiedField, setCopiedField] = useState<'winget' | 'sha' | null>(null);

  if (!software) return null;

  const wingetCommand = `winget install -e --id ${software.wingetId}`;

  const copyText = (text: string, field: 'winget' | 'sha') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-package-title"
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <SoftwareArtwork
              artworkKey={software.artworkKey}
              compact
              className="w-16 h-16 rounded-xl shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>{CATEGORIES[software.category]}</span>
                <span aria-hidden="true">·</span>
                <span>{software.publisher}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-slate-700">{software.version}</span>
              </div>
              <h3
                id="modal-package-title"
                className="text-xl font-bold text-slate-900 tracking-tight"
              >
                {software.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600"
            aria-label="Close package specification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description & Technical Metadata */}
        <div className="py-6 space-y-6">
          <p className="text-sm text-slate-600 leading-relaxed">{software.description}</p>

          {/* Specification Grid (Hairline Dividers, Zero Nested Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-200 text-xs">
            <div>
              <div className="text-slate-400 mb-1">Package Size</div>
              <div className="font-mono tabular-nums font-semibold text-slate-900">
                {software.size}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Architecture</div>
              <div className="font-mono tabular-nums font-semibold text-slate-900">
                {software.architecture}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">License Model</div>
              <div className="font-semibold text-slate-900">{software.license}</div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Release Channel</div>
              <div className="font-semibold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                {software.updatedAt}
              </div>
            </div>
          </div>

          {/* CLI Winget Snippet */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                Silent Terminal Install (Windows Package Manager)
              </span>
              <button
                type="button"
                onClick={() => copyText(wingetCommand, 'winget')}
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium transition-colors whitespace-nowrap shrink-0"
              >
                {copiedField === 'winget' ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Command
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-900 text-slate-100 font-mono text-xs px-4 py-3 rounded-lg overflow-x-auto select-all">
              {wingetCommand}
            </div>
          </div>

          {/* SHA-256 Checksum */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-medium text-slate-700">SHA-256 Binary Digest</span>
              <button
                type="button"
                onClick={() => copyText(software.sha256, 'sha')}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors whitespace-nowrap shrink-0"
              >
                {copiedField === 'sha' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Digest Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy SHA-256
                  </>
                )}
              </button>
            </div>
            <div className="font-mono tabular-nums text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg truncate">
              {software.sha256}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onToggleBundle(software.id)}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
              isBundled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isBundled ? 'Included in Batch Script' : 'Add to Batch Script'}
          </button>

          <a
            href={software.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            Direct Vendor Download
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};
