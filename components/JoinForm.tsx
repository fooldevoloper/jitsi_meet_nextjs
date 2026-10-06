'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { deriveRoomName } from '@/lib/roomKey';

interface JoinFormProps {
  initialPassword?: string;
  autoSubmit?: boolean;
  onJoin: (roomName: string, password: string, displayName: string) => void;
}

const STORAGE_KEY_DISPLAY_NAME = 'jitsi_display_name';
const MIN_PASSWORD_LENGTH = 10;

export default function JoinForm({
  initialPassword = '',
  autoSubmit = false,
  onJoin,
}: JoinFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [isDeriving, setIsDeriving] = useState(false);
  const [isThrottled, setIsThrottled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load saved display name on mount
  useEffect(() => {
    try {
      const savedName = localStorage.getItem(STORAGE_KEY_DISPLAY_NAME);
      if (savedName) {
        setDisplayName(savedName);
      }
    } catch {
      // localStorage may be disabled or restricted
    }
  }, []);

  // Update password if initialPassword prop changes
  useEffect(() => {
    if (initialPassword) {
      setPassword(initialPassword);
    }
  }, [initialPassword]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (isDeriving || isThrottled) {
      return;
    }

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter your name.');
      return;
    }

    const cleanPassword = password.trim();
    if (!cleanPassword) {
      setErrorMessage('Please enter a meeting password.');
      return;
    }

    if (cleanPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(
        `Meeting password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
      );
      return;
    }

    setErrorMessage(null);
    setIsDeriving(true);
    setIsThrottled(true);

    try {
      // Remember display name in localStorage (password is NEVER stored)
      try {
        localStorage.setItem(STORAGE_KEY_DISPLAY_NAME, trimmedName);
      } catch {
        // Suppress localStorage errors
      }

      // Compute deterministic room name in client memory
      const derivedRoom = await deriveRoomName(cleanPassword);

      // 1-second attempt throttle for UI feedback & brute-force deterrence
      setTimeout(() => {
        setIsThrottled(false);
      }, 1000);

      onJoin(derivedRoom, cleanPassword, trimmedName);
    } catch (err: unknown) {
      setIsThrottled(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to derive meeting room.'
      );
    } finally {
      setIsDeriving(false);
    }
  };

  // Handle auto-submit if requested and fields are present
  useEffect(() => {
    if (autoSubmit && initialPassword && initialPassword.length >= MIN_PASSWORD_LENGTH) {
      try {
        const savedName = localStorage.getItem(STORAGE_KEY_DISPLAY_NAME);
        if (savedName && savedName.trim()) {
          setDisplayName(savedName.trim());
          handleSubmit();
        }
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSubmit, initialPassword]);

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-md">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20">
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Join Meeting</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Zero database, zero registration, cryptographically private rooms.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Display Name Input */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5"
          >
            Your Name <span className="text-red-400">*</span>
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="e.g. Alex"
            className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-800/80 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
          />
        </div>

        {/* Meeting Password Input */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5"
          >
            Meeting Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="off"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. wxyz-3456-789a-bcde"
              className="w-full px-3.5 py-2.5 pr-11 rounded-lg bg-neutral-800/80 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200 transition"
            >
              {showPassword ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Minimum 10 characters. Case-sensitive.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
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
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Notice Requirement */}
        <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
          <span className="font-semibold text-neutral-300">Notice:</span> If the password is wrong you will enter an empty room. Check with the host if no one is there.
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isDeriving || isThrottled}
          className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-900 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          {isDeriving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Deriving Room...</span>
            </>
          ) : isThrottled ? (
            <span>Please wait...</span>
          ) : (
            <span>Join Meeting</span>
          )}
        </button>
      </form>

      {/* Footer navigation */}
      <div className="mt-6 pt-4 border-t border-neutral-800/80 text-center flex items-center justify-between text-xs text-neutral-500">
        <span>Protected deterministic rooms</span>
        <Link
          href="/admin"
          className="text-neutral-500 hover:text-neutral-300 transition-colors inline-flex items-center gap-1 font-medium"
          title="Host Administration"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Host Portal</span>
        </Link>
      </div>
    </div>
  );
}
