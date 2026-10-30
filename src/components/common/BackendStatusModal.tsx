/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { apiConfig, BackendConfig, FASTAPI_ENDPOINTS_SPEC } from '../../services/api/config';
import { Server, CheckCircle2, AlertCircle, RefreshCw, X, Copy, ExternalLink, Zap } from 'lucide-react';

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<BackendConfig>(apiConfig.getConfig());
  const [inputUrl, setInputUrl] = useState<string>(config.baseUrl);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = apiConfig.subscribe((c) => {
      setConfig(c);
      setInputUrl(c.baseUrl);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleTestPing = async () => {
    setIsChecking(true);
    await apiConfig.checkHealth();
    setIsChecking(false);
  };

  const handleSaveUrl = () => {
    apiConfig.setBaseUrl(inputUrl);
    handleTestPing();
  };

  const handleResetUrl = () => {
    apiConfig.resetBaseUrl();
    handleTestPing();
  };

  const toggleMode = (mode: 'real' | 'fallback_auto') => {
    apiConfig.setMode(mode);
  };

  const copyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    >
      <div className="bg-[#FFFFFF] w-full max-w-2xl rounded-3xl border-2 border-[#222222] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#FFE0BD] px-6 py-4 border-b-2 border-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F28C00] text-white flex items-center justify-center border border-[#222222]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-[#222222]">
                FastAPI Backend Integration
              </h2>
              <p className="text-xs text-[#222222]/80 font-medium">
                Real endpoint connector & offline development fallback engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FFFFFF] border-2 border-[#222222] flex items-center justify-center hover:bg-[#F1F1F1] transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-[#222222]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Connection Status Card */}
          <div className="p-4 rounded-2xl border-2 border-[#222222] bg-[#F1F1F1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {config.status === 'connected' ? (
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center border border-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : config.status === 'checking' || isChecking ? (
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center border border-amber-600 animate-spin">
                  <RefreshCw className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center border border-amber-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#222222]">Status:</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      config.status === 'connected'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : config.status === 'checking'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {config.status === 'connected'
                      ? `Connected (${config.latencyMs}ms)`
                      : config.status === 'checking'
                      ? 'Checking connection...'
                      : 'Offline / Fallback Active'}
                  </span>
                </div>
                <p className="text-xs text-[#666666] mt-0.5">
                  {config.status === 'connected'
                    ? 'All requests stream directly to the live Python FastAPI backend.'
                    : 'FastAPI server not detected at target URL. The app is running smoothly in Auto-Fallback mode.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleTestPing}
              disabled={isChecking}
              className="px-4 py-2 bg-[#FFFFFF] border-2 border-[#222222] rounded-full text-xs font-bold hover:bg-[#FFE0BD] flex items-center justify-center gap-1.5 transition shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              Ping Health
            </button>
          </div>

          {/* Target Base URL Config */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#222222] uppercase tracking-wide">
              FastAPI Endpoint URL (VITE_API_BASE_URL)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#222222] text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#F28C00]"
              />
              <button
                onClick={handleSaveUrl}
                className="px-4 py-2.5 bg-[#F28C00] text-white font-bold rounded-xl border-2 border-[#222222] text-xs hover:bg-[#de7f00] transition"
              >
                Apply
              </button>
              {config.isCustom && (
                <button
                  onClick={handleResetUrl}
                  className="px-3 py-2.5 bg-white text-[#222222] font-semibold rounded-xl border-2 border-[#222222] text-xs hover:bg-[#F1F1F1] transition"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#666666]">
              Set environment variable <code className="bg-[#F1F1F1] px-1 py-0.5 rounded text-[#222222] font-mono">VITE_API_BASE_URL</code> or override locally above.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="p-4 rounded-2xl border-2 border-[#222222] bg-[#FFF0C9] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#222222] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#F28C00]" /> Backend Routing Mode
                </h4>
                <p className="text-xs text-[#666666]">
                  Control whether the frontend seamlessly handles missing endpoints or enforces strict live network responses.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggleMode('fallback_auto')}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  config.mode === 'fallback_auto'
                    ? 'border-[#222222] bg-[#FFFFFF] shadow-sm font-bold'
                    : 'border-transparent bg-white/60 hover:bg-white text-[#666666]'
                }`}
              >
                <div className="text-xs font-bold text-[#222222]">Auto Fallback (Safe)</div>
                <div className="text-[11px] text-[#666666] mt-0.5">
                  Uses live FastAPI when online, seamlessly serves rich data when backend is sleeping.
                </div>
              </button>
              <button
                onClick={() => toggleMode('real')}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  config.mode === 'real'
                    ? 'border-[#222222] bg-[#FFFFFF] shadow-sm font-bold'
                    : 'border-transparent bg-white/60 hover:bg-white text-[#666666]'
                }`}
              >
                <div className="text-xs font-bold text-[#222222]">Strict Live Only</div>
                <div className="text-[11px] text-[#666666] mt-0.5">
                  Never fall back. Throws standard network errors if FastAPI is unreachable.
                </div>
              </button>
            </div>
          </div>

          {/* Documented Endpoints Contract */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#222222] uppercase tracking-wide flex items-center justify-between">
              <span>OpenAPI Endpoint Specifications ({FASTAPI_ENDPOINTS_SPEC.length} Endpoints)</span>
              <a
                href={`${config.baseUrl}/docs`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-[#F28C00] flex items-center gap-1 hover:underline lowercase"
              >
                FastAPI Swagger docs <ExternalLink className="w-3 h-3" />
              </a>
            </h4>
            <div className="border-2 border-[#222222] rounded-2xl overflow-hidden divide-y divide-[#222222]/15 text-xs max-h-48 overflow-y-auto bg-white">
              {FASTAPI_ENDPOINTS_SPEC.map((ep) => (
                <div key={ep.path} className="px-3 py-2 flex items-center justify-between hover:bg-[#FFF0C9]/40">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        ep.method === 'GET'
                          ? 'bg-blue-100 text-blue-800'
                          : ep.method === 'POST'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-[11px] text-[#222222] font-semibold">{ep.path}</span>
                  </div>
                  <span className="text-[#666666] text-[11px] truncate max-w-[200px]">{ep.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Start Command */}
          <div className="bg-[#222222] text-white p-3.5 rounded-2xl flex items-center justify-between">
            <div className="overflow-hidden">
              <div className="text-[10px] text-[#FFD966] uppercase font-bold tracking-wider">FastAPI Run Command</div>
              <code className="text-xs font-mono text-white/90 truncate block">
                uvicorn app.main:app --reload --port 8000
              </code>
            </div>
            <button
              onClick={() => copyCommand('uvicorn app.main:app --reload --port 8000')}
              className="px-3 py-1.5 bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 text-white rounded-lg border border-white/20 text-xs font-bold flex items-center gap-1 transition shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F1F1F1] px-6 py-3 border-t-2 border-[#222222] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#222222] text-white font-bold rounded-full text-xs hover:bg-[#333333] transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
