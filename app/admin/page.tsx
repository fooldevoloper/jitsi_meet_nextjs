'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generatePassword } from '@/lib/generatePassword';
import { verifyAdminPassword } from '@/lib/roomKey';

export default function AdminPage() {
  const router = useRouter();

  // Admin authentication state (in-memory only, not persisted)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Meeting generator state
  const [createdPassword, setCreatedPassword] = useState('');
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [origin, setOrigin] = useState('');
  const [copiedType, setCopiedType] = useState<'password' | 'link' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasswordInput.trim()) {
      setAuthError('Please enter your administrator password.');
      return;
    }

    setIsVerifying(true);
    setAuthError(null);

    try {
      const isValid = await verifyAdminPassword(adminPasswordInput);
      if (isValid) {
        setIsAuthenticated(true);
        setAdminPasswordInput('');
      } else {
        setAuthError('Incorrect administrator password. Access denied.');
      }
    } catch {
      setAuthError('Authentication verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGenerate = () => {
    setErrorMessage(null);
    const pwd = generatePassword();
    setCreatedPassword(pwd);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customPasswordInput.trim();
    if (trimmed.length < 10) {
      setErrorMessage('Custom meeting password must be at least 10 characters long.');
      return;
    }
    setErrorMessage(null);
    setCreatedPassword(trimmed);
  };

  const shareLink =
    createdPassword && origin
      ? `${origin}/join#${encodeURIComponent(createdPassword)}`
      : '';

  const copyToClipboard = async (text: string, type: 'password' | 'link') => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      setErrorMessage('Failed to copy to clipboard.');
    }
  };

  const handleJoinNow = () => {
    if (createdPassword) {
      router.push(`/join#${encodeURIComponent(createdPassword)}`);
    }
  };

  // If not authenticated, render Admin Access Lock Screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
        <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-md">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/20">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Admin Access Only</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Enter your special administrator password to create and manage meeting rooms.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label
                htmlFor="adminPassword"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5"
              >
                Special Admin Password <span className="text-red-400">*</span>
              </label>
              <input
                id="adminPassword"
                type="password"
                required
                autoComplete="off"
                value={adminPasswordInput}
                onChange={(e) => {
                  setAdminPasswordInput(e.target.value);
                  if (authError) setAuthError(null);
                }}
                placeholder="Enter administrator password..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-800/80 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm font-mono"
              />
            </div>

            {authError && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3 rounded-lg bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-start gap-2"
              >
                <svg
                  className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-900 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Unlock Meeting Creator</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
            <Link
              href="/"
              className="text-xs text-neutral-400 hover:text-white transition inline-flex items-center gap-1 font-medium"
            >
              <span aria-hidden="true">&larr;</span>
              <span>Back to Join Meeting</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <div className="w-full max-w-lg mx-auto p-6 sm:p-8 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-md">
        {/* Header with Logout */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
              Admin Authenticated
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthenticated(false)}
            className="text-xs text-neutral-400 hover:text-neutral-200 transition"
          >
            Lock / Log out
          </button>
        </div>

        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 mb-3 border border-purple-500/20">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create Meeting</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Generate high-entropy meeting keys or specify a custom passphrase.
          </p>
        </div>

        {/* Action button */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGenerate}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-900 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Generate New Meeting Password</span>
          </button>

          {/* Custom password alternative */}
          <form onSubmit={handleApplyCustom} className="pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={customPasswordInput}
                onChange={(e) => {
                  setCustomPasswordInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Or enter custom meeting password (min 10 chars)..."
                className="flex-1 px-3.5 py-2 rounded-lg bg-neutral-800/80 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
              >
                Use Custom
              </button>
            </div>
          </form>

          {errorMessage && (
            <p className="text-xs text-red-400 mt-1" role="alert">
              {errorMessage}
            </p>
          )}

          {/* Results display */}
          {createdPassword && (
            <div className="mt-6 pt-6 border-t border-neutral-800 space-y-4">
              {/* Password card */}
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                    Meeting Password
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdPassword, 'password')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition font-medium flex items-center gap-1"
                  >
                    {copiedType === 'password' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="font-mono text-base font-semibold text-indigo-300 break-all select-all">
                  {createdPassword}
                </div>
              </div>

              {/* Share link card */}
              {shareLink && (
                <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                      Shareable Invite Link
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(shareLink, 'link')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition font-medium flex items-center gap-1"
                    >
                      {copiedType === 'link' ? '✓ Copied' : 'Copy Link'}
                    </button>
                  </div>
                  <div className="font-mono text-xs text-neutral-300 break-all select-all bg-neutral-900 p-2 rounded border border-neutral-800">
                    {shareLink}
                  </div>
                </div>
              )}

              {/* Join now action */}
              <button
                type="button"
                onClick={handleJoinNow}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <span>Join this meeting now</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          )}

          {/* Information & Security notices */}
          <div className="mt-6 pt-5 border-t border-neutral-800 space-y-2.5 text-xs text-neutral-400 leading-relaxed">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Meeting Security & Guidelines
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-[11px] text-neutral-400">
              <li>
                <strong className="text-neutral-300">Target Server:</strong> Conferences run directly on your custom domain (<code className="text-neutral-300 bg-neutral-800 px-1 py-0.5 rounded">NEXT_PUBLIC_JITSI_DOMAIN</code>) without redirecting participants elsewhere.
              </li>
              <li>
                <strong className="text-neutral-300">Invite delivery:</strong> Share this link or password only with intended participants.
              </li>
              <li>
                <strong className="text-neutral-300">Access control:</strong> Anyone who knows this password can enter this meeting room.
              </li>
              <li>
                <strong className="text-neutral-300">Retiring a room:</strong> There is no room deletion required—simply stop using that password.
              </li>
              <li>
                <strong className="text-neutral-300">Global reset:</strong> Changing <code className="text-neutral-300 bg-neutral-800 px-1 py-0.5 rounded">NEXT_PUBLIC_ROOM_SALT</code> immediately invalidates all existing passwords and room assignments.
              </li>
            </ul>
          </div>
        </div>

        {/* Return to home link */}
        <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
          <Link
            href="/"
            className="text-xs text-neutral-400 hover:text-white transition inline-flex items-center gap-1 font-medium"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Back to Join screen</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
