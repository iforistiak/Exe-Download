import React from 'react';
import { SoftwareItem } from '../data/softwares';

interface SoftwareArtworkProps {
  artworkKey: SoftwareItem['artworkKey'];
  className?: string;
  compact?: boolean;
}

export const SoftwareArtwork: React.FC<SoftwareArtworkProps> = ({
  artworkKey,
  className = '',
  compact = false,
}) => {
  const renderEmblem = () => {
    switch (artworkKey) {
      case 'chrome':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
            <circle cx="32" cy="32" r="24" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
            <path d="M32 8A24 24 0 0 1 52.78 20H32V8Z" fill="#EF4444" opacity="0.9" />
            <path d="M11.22 20A24 24 0 0 0 32 56l10.39-18L32 20H11.22Z" fill="#10B981" opacity="0.9" />
            <path d="M32 56a24 24 0 0 0 20.78-36H32l10.39 18L32 56Z" fill="#F59E0B" opacity="0.9" />
            <circle cx="32" cy="32" r="10.5" fill="#FFFFFF" />
            <circle cx="32" cy="32" r="7.5" fill="#2563EB" />
          </svg>
        );
      case 'vlc':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
            <path d="M14 52h36l-3-6H17l-3 6Z" fill="#EA580C" />
            <path d="M26 12h12l9 34H17l9-34Z" fill="#F97316" />
            <path d="M23.5 21.5h17l2.2 8.5H21.3l2.2-8.5Z" fill="#FFFFFF" />
            <path d="M19.8 35.5h24.4l1.8 6.5H18l1.8-6.5Z" fill="#FFFFFF" />
          </svg>
        );
      case 'vscode':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
            <path
              d="M45.5 10L23 30.5 13.5 23 9 25.5v13L13.5 41 23 33.5 45.5 54 55 49.5v-35L45.5 10Z"
              fill="#0284C7"
            />
            <path d="M45.5 10v44L55 49.5v-35L45.5 10Z" fill="#38BDF8" />
            <path d="M45.5 21.5L28.5 32l17 10.5v-21Z" fill="#F8FAFC" />
          </svg>
        );
      case 'winrar':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
            <rect x="14" y="11" width="36" height="12" rx="2.5" fill="#7C3AED" />
            <rect x="14" y="26" width="36" height="12" rx="2.5" fill="#2563EB" />
            <rect x="14" y="41" width="36" height="12" rx="2.5" fill="#059669" />
            <rect x="28" y="8" width="8" height="48" rx="1.5" fill="#F59E0B" />
            <rect x="30" y="28" width="4" height="8" rx="1" fill="#FEF3C7" />
          </svg>
        );
      case 'obs':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
            <circle cx="32" cy="32" r="23" fill="#0F172A" stroke="#334155" strokeWidth="2" />
            <circle cx="32" cy="21" r="7.5" stroke="#F8FAFC" strokeWidth="3" />
            <circle cx="22.5" cy="37.5" r="7.5" stroke="#F8FAFC" strokeWidth="3" />
            <circle cx="41.5" cy="37.5" r="7.5" stroke="#F8FAFC" strokeWidth="3" />
            <circle cx="32" cy="32" r="3" fill="#10B981" />
          </svg>
        );
      case 'idm':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
            <circle cx="32" cy="32" r="22" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
            <path
              d="M32 16v22m0 0l-9-9m9 9l9-9"
              stroke="#059669"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M20 45h24" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        );
      case 'spotify':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
            <circle cx="32" cy="32" r="23" fill="#10B981" />
            <path
              d="M20 25.5c8-2.4 17.5-1.8 24.5 2"
              stroke="#064E3B"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M22 33c6.5-1.8 14.2-1.3 20 1.8"
              stroke="#064E3B"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M24 40c5-1.2 11-.8 15.5 1.4"
              stroke="#064E3B"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
        );
      case 'brave':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
            <path
              d="M32 9L14 17v15c0 12.5 7.7 20.8 18 24 10.3-3.2 18-11.5 18-24V17L32 9Z"
              fill="#EA580C"
            />
            <path
              d="M32 15l-11 5v11c0 8.5 4.8 14.2 11 16.8 6.2-2.6 11-8.3 11-16.8V20l-11-5Z"
              fill="#FDBA74"
              opacity="0.3"
            />
            <path d="M25 27l7 4 7-4-3 11-4 3-4-3-3-11Z" fill="#FFFFFF" />
          </svg>
        );
      case 'nodejs':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
            <path
              d="M32 9L52 20.5v23L32 55 12 43.5v-23L32 9Z"
              fill="#15803D"
            />
            <path
              d="M32 17l13 7.5v15L32 47l-13-7.5v-15L32 17Z"
              fill="#22C55E"
              opacity="0.25"
            />
            <path
              d="M27 25v14l10-6v-8l-5 3-5-3Z"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'discord':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
            <rect x="10" y="13" width="44" height="38" rx="11" fill="#4F46E5" />
            <path
              d="M22 23c3-1.5 6.2-2 10-2s7 .5 10 2c2.5 5 3 11 2 16-3 2.2-6 3-8 3l-1.5-2.5c2 0 3.5-.8 3.5-.8-2.5 1.2-5 1.5-8 1.5s-5.5-.3-8-1.5c0 0 1.5.8 3.5.8L24 42c-2 0-5-.8-8-3-1-5-.5-11 2-16Z"
              fill="#FFFFFF"
            />
            <circle cx="27" cy="31" r="2.3" fill="#4F46E5" />
            <circle cx="37" cy="31" r="2.3" fill="#4F46E5" />
          </svg>
        );
      case 'git':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
            <rect
              x="32"
              y="9.5"
              width="31.8"
              height="31.8"
              rx="4"
              transform="rotate(45 32 9.5)"
              fill="#EA580C"
            />
            <path d="M26 20l12 12M32 26v14" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <circle cx="26" cy="20" r="3" fill="#FFFFFF" />
            <circle cx="38" cy="32" r="3" fill="#FFFFFF" />
            <circle cx="32" cy="40" r="3" fill="#FFFFFF" />
          </svg>
        );
      case 'figma':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
            <path d="M25 11h7v14h-7a7 7 0 0 1 0-14Z" fill="#EF4444" />
            <path d="M32 11h7a7 7 0 0 1 0 14h-7V11Z" fill="#F97316" />
            <path d="M25 25h7v14h-7a7 7 0 0 1 0-14Z" fill="#8B5CF6" />
            <circle cx="39" cy="32" r="7" fill="#06B6D4" />
            <path d="M25 39h7v7a7 7 0 1 1-7-7Z" fill="#10B981" />
          </svg>
        );
    }
  };

  if (compact) {
    return (
      <div
        className={`relative flex items-center justify-center bg-slate-50 border border-slate-200/80 overflow-hidden ${className}`}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(#CBD5E1 1px, transparent 1px)',
            backgroundSize: '10px 10px',
          }}
        />
        <div className="relative z-10 scale-90 transition-transform duration-200 group-hover:scale-100">
          {renderEmblem()}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center bg-slate-50/90 overflow-hidden ${className}`}
    >
      {/* Subtle architectural drafting grid */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-slate-200/90 shadow-xs transition-transform duration-200 group-hover:scale-105">
        {renderEmblem()}
      </div>
    </div>
  );
};
