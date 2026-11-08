/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Check,
  Copy,
  Terminal,
  AlertCircle,
  CheckCircle2,
  Menu,
  X,
  Plus,
  Send,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { CATEGORIES, CategoryKey, SOFTWARES, SoftwareItem } from './data/softwares';
import { SoftwareArtwork } from './components/SoftwareArtwork';
import { PackageModal } from './components/PackageModal';

type SortOption = 'recommended' | 'name-asc' | 'size-asc' | 'size-desc';
type ViewMode = 'grid' | 'table';

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Package Inspector Modal state
  const [activePackage, setActivePackage] = useState<SoftwareItem | null>(null);

  // Batch Winget Script Builder state
  const [bundleIds, setBundleIds] = useState<number[]>([]);
  const [bundleCopied, setBundleCopied] = useState(false);
  const [copiedRowId, setCopiedRowId] = useState<number | null>(null);

  // Request Form state (Formspree integration)
  const [reqName, setReqName] = useState('');
  const [reqSoftware, setReqSoftware] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBannerMsg, setErrorBannerMsg] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const topPicksScrollRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setActivePackage(null);
        setShowSuccessModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = {
      all: SOFTWARES.length,
      browser: 0,
      multimedia: 0,
      developer: 0,
      utility: 0,
    };
    SOFTWARES.forEach((item) => {
      counts[item.category] += 1;
    });
    return counts;
  }, []);

  // Filtered Top Picks
  const topPicks = useMemo(() => {
    return SOFTWARES.filter(
      (item) =>
        item.topPick && (selectedCategory === 'all' || item.category === selectedCategory)
    );
  }, [selectedCategory]);

  // Filtered and Sorted Directory List
  const filteredSoftwares = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = SOFTWARES.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.publisher.toLowerCase().includes(q) ||
        item.wingetId.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'size-asc') return a.sizeMB - b.sizeMB;
      if (sortBy === 'size-desc') return b.sizeMB - a.sizeMB;
      return a.id - b.id;
    });
  }, [selectedCategory, searchQuery, sortBy]);

  // Horizontal scroll handlers for Top Picks
  const handleScrollTopPicks = (direction: 'left' | 'right') => {
    if (!topPicksScrollRef.current) return;
    const offset = direction === 'left' ? -360 : 360;
    topPicksScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Toggle package in Batch Script Bundle
  const toggleBundleItem = (id: number) => {
    setBundleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const bundledItems = useMemo(
    () => SOFTWARES.filter((s) => bundleIds.includes(s.id)),
    [bundleIds]
  );

  const batchWingetCommand = useMemo(() => {
    if (bundledItems.length === 0) return '';
    return bundledItems.map((item) => `winget install -e --id ${item.wingetId}`).join(' ; ');
  }, [bundledItems]);

  const handleCopyBatchCommand = () => {
    if (!batchWingetCommand) return;
    navigator.clipboard.writeText(batchWingetCommand);
    setBundleCopied(true);
    setTimeout(() => setBundleCopied(false), 2000);
  };

  const handleCopySingleWinget = (software: SoftwareItem) => {
    navigator.clipboard.writeText(`winget install -e --id ${software.wingetId}`);
    setCopiedRowId(software.id);
    setTimeout(() => setCopiedRowId(null), 1800);
  };

  // Formspree submission handler
  const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorBannerMsg(null);

    if (!reqName.trim() || !reqSoftware.trim() || !reqEmail.trim()) {
      setErrorBannerMsg('Please complete all required fields before submitting.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reqEmail.trim())) {
      setErrorBannerMsg('Please provide a valid email address for notification delivery.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', reqName.trim());
    formData.append('software_name', reqSoftware.trim());
    formData.append('email', reqEmail.trim());

    try {
      const response = await fetch('https://formspree.io/f/mdarqeya', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        setReqName('');
        setReqSoftware('');
        setReqEmail('');
        setShowSuccessModal(true);
      } else {
        const data = await response.json().catch(() => null);
        if (data && Array.isArray(data.errors)) {
          setErrorBannerMsg(
            data.errors.map((err: { message?: string }) => err.message).join(', ')
          );
        } else {
          setErrorBannerMsg('Request dispatch failed due to a server error. Please try again.');
        }
      }
    } catch {
      setErrorBannerMsg('Network error occurred. Please check your connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('recommended');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] text-slate-900">
      {/* Top Bar Contract: 1 Row, 3 Zones separated by gap-8 */}
      <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#"
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            exe<span className="text-emerald-600">.pro.bd</span>
          </a>

          {/* Zone 2: 4–5 concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#top-picks-section"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Top Picks
            </a>
            <a
              href="#softwares-section"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Directory
            </a>
            <a
              href="#request-section"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Request App
            </a>
            <a
              href="#about-section"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Architecture
            </a>
            <a
              href="https://t.me/exe_pro_bd"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Telegram Support
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#softwares-section"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-600 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Explore Directory
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2 shadow-lg">
            <a
              href="#top-picks-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Top Picks
            </a>
            <a
              href="#softwares-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Directory
            </a>
            <a
              href="#request-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Request App
            </a>
            <a
              href="#about-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Architecture
            </a>
            <a
              href="https://t.me/exe_pro_bd"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Telegram Support
            </a>
          </div>
        )}
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              {/* Left Column: Core Value Proposition & Search */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-4">
                    <span className="text-emerald-700 font-semibold">Direct Package Index</span>
                    <span aria-hidden="true">·</span>
                    <span>Official Vendor Mirrors</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">2026 Build Catalog</span>
                  </div>

                  <h1
                    className="font-display text-slate-900 font-bold tracking-tight mb-4"
                    style={{
                      fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                      lineHeight: 1.1,
                      textWrap: 'balance',
                    }}
                  >
                    Every Essential Desktop Utility, One Click Away.
                  </h1>

                  <p className="text-slate-600 text-base leading-relaxed max-w-[65ch] mb-8">
                    Download verified desktop binaries, developer toolchains, multimedia codecs, and
                    privacy-hardened browsers directly from official release channels—zero ad
                    wrappers, countdown timers, or bundled adware.
                  </p>
                </div>

                {/* Live Search Bar */}
                <div className="max-w-2xl">
                  <div className="relative flex items-center bg-[#F8FAFC] border border-slate-300 rounded-xl focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-3 focus-within:ring-emerald-600/15 transition-all">
                    <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      id="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by package name, publisher, or winget ID (press '/' to focus)..."
                      className="w-full bg-transparent py-3.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="mr-3 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-200/70 rounded-md whitespace-nowrap shrink-0"
                      >
                        Clear
                      </button>
                    ) : (
                      <kbd className="hidden sm:inline-block mr-4 px-2 py-0.5 text-xs font-mono text-slate-400 border border-slate-200 rounded bg-white">
                        /
                      </kbd>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Quick CLI & Repository Telemetry */}
              <div className="lg:col-span-5 flex flex-col justify-between bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Instant Terminal Provisioning
                      </h2>
                      <p className="text-xs text-slate-500">
                        Select packages below or copy our core developer workstation bundle
                      </p>
                    </div>
                    <Terminal className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>

                  <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs leading-relaxed mb-4 overflow-x-auto">
                    <div className="text-slate-400 select-none mb-1">
                      PowerShell · Core Workstation Setup
                    </div>
                    <code className="text-emerald-400 select-all">
                      {batchWingetCommand ||
                        'winget install -e --id Google.Chrome ; winget install -e --id Microsoft.VisualStudioCode ; winget install -e --id Git.Git'}
                    </code>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-slate-500">
                    {bundleIds.length > 0 ? (
                      <span className="font-semibold text-emerald-700 font-mono tabular-nums">
                        {bundleIds.length} custom package(s) queued
                      </span>
                    ) : (
                      <span>Click &ldquo;+ Bundle&rdquo; on any card to customize</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const cmd =
                        batchWingetCommand ||
                        'winget install -e --id Google.Chrome ; winget install -e --id Microsoft.VisualStudioCode ; winget install -e --id Git.Git';
                      navigator.clipboard.writeText(cmd);
                      setBundleCopied(true);
                      setTimeout(() => setBundleCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-800 hover:border-emerald-600 hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    {bundleCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied Script
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy CLI Command
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Quantitative Proof Row below Hero Split */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10 pt-8 border-t border-slate-200">
              <div>
                <div className="font-mono tabular-nums text-2xl font-bold text-slate-900">
                  12 Packages
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Curated 64-bit &amp; ARM64 desktop installers
                </div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-2xl font-bold text-slate-900">
                  826.5 MB
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Aggregate verified binary repository footprint
                </div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-2xl font-bold text-emerald-700">
                  SHA-256
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Cryptographic checksum verification on every release
                </div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-2xl font-bold text-slate-900">
                  0 Redirects
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Direct vendor endpoints with unthrottled bandwidth
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Repository Filter & Controls Toolbar */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            {/* Interactive Segmented Category Filter Controls */}
            <div
              className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl"
              id="category-container"
              role="tablist"
              aria-label="Filter software repository by category"
            >
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => {
                const isActive = selectedCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{CATEGORIES[key]}</span>
                    <span
                      className={`font-mono tabular-nums text-[11px] ${
                        isActive ? 'text-emerald-700 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {categoryCounts[key]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Controls: Sort & Layout Switcher */}
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                <label htmlFor="sort-select" className="text-xs font-medium text-slate-500">
                  Sort:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="recommended">Recommended Order</option>
                  <option value="name-asc">Name (A – Z)</option>
                  <option value="size-asc">Smallest Footprint</option>
                  <option value="size-desc">Largest Footprint</option>
                </select>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center p-1 bg-slate-200/70 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Compact Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    viewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Manifest Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Manifest</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Top Picks Horizontal Showcase Section */}
        {topPicks.length > 0 && (
          <section
            id="top-picks-section"
            className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className="font-display text-xl font-bold text-slate-900 tracking-tight"
                  id="top-picks-title"
                >
                  {selectedCategory === 'all'
                    ? 'Top Downloaded Utilities'
                    : `${CATEGORIES[selectedCategory]} — Featured Top Picks`}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Most frequently deployed builds across developer and workstation setups
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="scroll-left"
                  onClick={() => handleScrollTopPicks('left')}
                  className="w-10 h-10 rounded-lg bg-white border border-slate-200 hover:border-slate-400 text-slate-700 flex items-center justify-center transition-colors active:scale-95"
                  aria-label="Scroll top picks left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  id="scroll-right"
                  onClick={() => handleScrollTopPicks('right')}
                  className="w-10 h-10 rounded-lg bg-white border border-slate-200 hover:border-slate-400 text-slate-700 flex items-center justify-center transition-colors active:scale-95"
                  aria-label="Scroll top picks right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={topPicksScrollRef}
              id="top-picks-scroll"
              className="flex overflow-x-auto gap-4 snap-x scrollbar-none pb-2 scroll-smooth"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {topPicks.map((software) => (
                <div
                  key={software.id}
                  className="min-w-[300px] sm:min-w-[340px] max-w-[340px] snap-start bg-white border border-slate-200 hover:border-emerald-600/60 rounded-2xl p-4 flex gap-4 transition-colors group"
                >
                  <SoftwareArtwork
                    artworkKey={software.artworkKey}
                    compact
                    className="w-20 h-20 rounded-xl shrink-0"
                  />

                  <div className="flex flex-col justify-between flex-grow min-w-0">
                    <div>
                      {/* Zero-Pill Metadata Discipline: Clean unboxed text with middot separators */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1 truncate">
                        <span className="font-medium text-emerald-700">
                          {CATEGORIES[software.category]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{software.version}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{software.size}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActivePackage(software)}
                        className="text-left block w-full"
                      >
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate mb-1">
                          {software.name}
                        </h3>
                      </button>

                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                        {software.description}
                      </p>
                    </div>

                    <div className="pt-3 flex items-center justify-between gap-2">
                      <a
                        href={software.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0"
                      >
                        <span>Direct Get</span>
                        <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => setActivePackage(software)}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-900 underline underline-offset-2 whitespace-nowrap shrink-0"
                      >
                        Specs &amp; SHA
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Software Directory Section */}
        <section
          id="softwares-section"
          className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6"
        >
          <div className="border-t border-slate-200 pt-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2
                className="font-display text-xl font-bold text-slate-900 tracking-tight"
                id="grid-list-title"
              >
                {selectedCategory === 'all'
                  ? 'All Software Packages'
                  : `All ${CATEGORIES[selectedCategory]}`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                Showing {filteredSoftwares.length} of {SOFTWARES.length} verified packages
              </p>
            </div>

            {bundleIds.length > 0 && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                <span className="text-xs font-semibold text-emerald-900 font-mono tabular-nums">
                  {bundleIds.length} selected for batch install
                </span>
                <button
                  type="button"
                  onClick={handleCopyBatchCommand}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {bundleCopied ? 'Copied Winget Script!' : 'Copy Winget Script'}
                </button>
                <button
                  type="button"
                  onClick={() => setBundleIds([])}
                  className="text-xs text-slate-500 hover:text-slate-800 whitespace-nowrap shrink-0"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Empty State */}
          {filteredSoftwares.length === 0 ? (
            <div
              id="no-results"
              className="bg-white border border-slate-200 rounded-2xl py-16 px-4 text-center max-w-lg mx-auto my-6"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                No Matching Software Packages
              </h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                No utilities matched &ldquo;{searchQuery}&rdquo; within{' '}
                {CATEGORIES[selectedCategory]}. Reset filters or submit a custom package request
                below.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Reset All Filters
                </button>
                <a
                  href="#request-section"
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  Request This App
                </a>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Compact Architectural Grid View */
            <div
              id="software-grid"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
            >
              {filteredSoftwares.map((software) => {
                const isBundled = bundleIds.includes(software.id);
                return (
                  <div
                    key={software.id}
                    className="group bg-white border border-slate-200 hover:border-emerald-600/60 rounded-2xl flex flex-col justify-between overflow-hidden transition-all duration-150 hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Custom Vector Artwork Thumbnail */}
                      <div
                        onClick={() => setActivePackage(software)}
                        className="cursor-pointer relative border-b border-slate-100"
                      >
                        <SoftwareArtwork
                          artworkKey={software.artworkKey}
                          className="aspect-[16/10] w-full"
                        />
                      </div>

                      {/* Card Body */}
                      <div className="p-4">
                        {/* Unboxed Metadata Line */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1.5 font-mono tabular-nums">
                          <span>{software.version}</span>
                          <span aria-hidden="true">·</span>
                          <span>{software.size}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-sans text-slate-400 truncate">
                            {software.architecture.split(' ')[0]}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActivePackage(software)}
                          className="text-left block w-full"
                        >
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate mb-1">
                            {software.name}
                          </h3>
                        </button>

                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                          {software.description}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-4 pt-0 space-y-2">
                      <a
                        href={software.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Get File</span>
                      </a>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => toggleBundleItem(software.id)}
                          className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                            isBundled
                              ? 'text-emerald-700 font-semibold'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {isBundled ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Bundled</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Bundle</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setActivePackage(software)}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-900 whitespace-nowrap shrink-0"
                        >
                          Verify Hash
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* High-Density Manifest Table View */
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                      <th className="py-3 pl-4 pr-2 w-10">Bundle</th>
                      <th className="py-3 px-3">Package &amp; Publisher</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Version</th>
                      <th className="py-3 px-3 text-right">Size</th>
                      <th className="py-3 px-3">Winget CLI Identifier</th>
                      <th className="py-3 pl-3 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {filteredSoftwares.map((software) => {
                      const isBundled = bundleIds.includes(software.id);
                      return (
                        <tr
                          key={software.id}
                          className="hover:bg-slate-50/90 transition-colors group"
                        >
                          <td className="py-3 pl-4 pr-2">
                            <input
                              type="checkbox"
                              checked={isBundled}
                              onChange={() => toggleBundleItem(software.id)}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                              aria-label={`Select ${software.name} for batch install`}
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <SoftwareArtwork
                                artworkKey={software.artworkKey}
                                compact
                                className="w-9 h-9 rounded-lg shrink-0"
                              />
                              <div>
                                <button
                                  type="button"
                                  onClick={() => setActivePackage(software)}
                                  className="font-bold text-slate-900 hover:text-emerald-700 text-left block"
                                >
                                  {software.name}
                                </button>
                                <div className="text-[11px] text-slate-500">
                                  {software.publisher} · {software.architecture}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            {CATEGORIES[software.category]}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                            {software.version}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-slate-800 text-right whitespace-nowrap">
                            {software.size}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {software.wingetId}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopySingleWinget(software)}
                                className="text-slate-400 hover:text-slate-800 transition-colors"
                                title="Copy winget install command"
                              >
                                {copiedRowId === software.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setActivePackage(software)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-white font-medium transition-colors"
                              >
                                Specs
                              </button>
                              <a
                                href={software.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Get File</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Engineering & Repository Architecture Section (Numbered Editorial Hierarchy) */}
        <section
          id="about-section"
          className="bg-white border-y border-slate-200 py-16 mt-12"
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <div className="text-xs font-semibold text-emerald-700 mb-2">
                Verification &amp; Delivery Architecture
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
                Engineered for Clean, Unwrapped Package Delivery
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Most third-party download portals wrap installers in proprietary download managers
                or throttle transfer rates behind multi-step ad funnels. exe.pro.bd connects you
                directly to verified upstream vendor binaries.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="border-t-2 border-slate-900 pt-5">
                <div className="font-mono tabular-nums text-xs font-semibold text-slate-400 mb-2">
                  01. Binary Integrity
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Cryptographic Checksum Auditing
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Every listed utility links directly to its canonical vendor release channel and
                  includes an inspectable SHA-256 digest and official Windows Package Manager
                  identifier.
                </p>
                <div className="text-xs font-mono tabular-nums text-slate-500">
                  100% Upstream Vendor Signature Match
                </div>
              </div>

              <div className="border-t-2 border-emerald-600 pt-5">
                <div className="font-mono tabular-nums text-xs font-semibold text-emerald-700 mb-2">
                  02. Zero Bandwidth Throttling
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Direct CDN &amp; Mirror Routing
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Instead of proxying files through slow intermediary servers, download triggers
                  resolve straight to global vendor CDNs (Google, Microsoft, VideoLAN, GitHub
                  Releases).
                </p>
                <div className="text-xs font-mono tabular-nums text-slate-500">
                  Unrestricted Multi-Thread Transfer Speeds
                </div>
              </div>

              <div className="border-t-2 border-slate-900 pt-5">
                <div className="font-mono tabular-nums text-xs font-semibold text-slate-400 mb-2">
                  03. Terminal Automation
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Batch Winget Script Generation
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Provisioning a fresh workstation? Select multiple utilities across categories to
                  compile a single unattended PowerShell installation command in one click.
                </p>
                <div className="text-xs font-mono tabular-nums text-slate-500">
                  Zero-Touch Silent Provisioning Ready
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* On-Demand Software Request Section (Formspree Integration) */}
        <section
          id="request-section"
          className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start bg-white border border-slate-200 rounded-2xl p-6 sm:p-10">
            {/* Left Column: Context & Direct Support Channels */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <div className="text-xs font-semibold text-emerald-700 mb-2">
                  On-Demand Package Indexing
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
                  Need a Specific Utility Added to the Hub?
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Submit the software name and version below. Our maintainers verify the official
                  installer signature, index the direct mirror link, and send an email alert once
                  published.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-4 text-xs text-slate-600">
                <div>
                  <div className="font-semibold text-slate-900 mb-0.5">
                    Typical Indexing Turnaround
                  </div>
                  <div className="font-mono tabular-nums text-slate-500">
                    Under 24 hours for standard Windows x64 / ARM64 packages
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 mb-0.5">Direct Maintainer Desk</div>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <a
                      href="mailto:hireistiak@gmail.com"
                      className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      hireistiak@gmail.com
                    </a>
                    <span aria-hidden="true">·</span>
                    <a
                      href="https://t.me/exe_pro_bd"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-emerald-700"
                    >
                      Telegram (@exe_pro_bd)
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Formspree Form */}
            <div className="lg:col-span-7">
              {errorBannerMsg && (
                <div
                  id="error-banner"
                  className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span id="error-message">{errorBannerMsg}</span>
                </div>
              )}

              <form
                action="https://formspree.io/f/mdarqeya"
                method="POST"
                id="software-request-form"
                onSubmit={handleRequestSubmit}
                className="space-y-4"
                noValidate
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="user-name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="user-name"
                      required
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      placeholder="e.g. Arif Rahman"
                      className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="user-email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Notification Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="user-email"
                      required
                      value={reqEmail}
                      onChange={(e) => setReqEmail(e.target.value)}
                      placeholder="e.g. arif@example.com"
                      className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="req-software-name"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Software / Utility Name &amp; Preferred Version *
                  </label>
                  <input
                    type="text"
                    name="software_name"
                    id="req-software-name"
                    required
                    value={reqSoftware}
                    onChange={(e) => setReqSoftware(e.target.value)}
                    placeholder="e.g. 7-Zip v24.08, Blender 4.2 LTS, Postman Desktop"
                    className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    We will send a single confirmation email once the verified binary link is live.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="submit-btn"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting Request...' : 'Submit Package Request'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Package Inspector Modal */}
      <PackageModal
        software={activePackage}
        onClose={() => setActivePackage(null)}
        isBundled={activePackage ? bundleIds.includes(activePackage.id) : false}
        onToggleBundle={toggleBundleItem}
      />

      {/* Custom Confirmation Modal for Formspree Request */}
      {showSuccessModal && (
        <div
          id="success-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowSuccessModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 shadow-xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 mb-5">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="font-display text-xl font-bold text-slate-900 mb-2">
              Request Filed Successfully
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Your software submission request has been logged. Our repository team will verify the
              upstream binary and notify you via email shortly.
            </p>

            <button
              type="button"
              id="modal-close-btn"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Acknowledge &amp; Close
            </button>
          </div>
        </div>
      )}

      {/* Quiet Architectural Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-12 pb-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
            <div className="md:col-span-2">
              <a
                href="#"
                className="font-display text-xl font-bold tracking-tight text-white inline-block mb-3"
              >
                exe<span className="text-emerald-500">.pro.bd</span>
              </a>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
                Direct software utility repository engineered for clean desktop installations,
                cryptographic checksum transparency, and zero-redirect vendor links.
              </p>
              <div className="flex items-center gap-4 text-xs">
                <a
                  href="https://t.me/exe_pro_bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  Telegram Channel
                </a>
                <span aria-hidden="true">·</span>
                <a
                  href="mailto:hireistiak@gmail.com"
                  className="text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  hireistiak@gmail.com
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 text-xs">Repository Navigation</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#top-picks-section" className="hover:text-white transition-colors">
                    Top Downloaded Utilities
                  </a>
                </li>
                <li>
                  <a href="#softwares-section" className="hover:text-white transition-colors">
                    Full Package Index
                  </a>
                </li>
                <li>
                  <a href="#about-section" className="hover:text-white transition-colors">
                    Verification Standard
                  </a>
                </li>
                <li>
                  <a href="#request-section" className="hover:text-white transition-colors">
                    Submit Package Request
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 text-xs">Broken Link &amp; Build Desk</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Encountered an outdated version or broken upstream mirror? Notify our maintainer
                desk for immediate link reconstruction.
              </p>
              <a
                href="mailto:hireistiak@gmail.com"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                hireistiak@gmail.com
              </a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>&copy; 2026 exe.pro.bd. All rights reserved.</p>
            <p>Crafted by EXE Studio · Direct Binary Repository</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
