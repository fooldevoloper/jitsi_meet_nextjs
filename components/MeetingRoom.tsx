'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { deriveLockKey } from '@/lib/roomKey';

// Jitsi Meet External API interface for command execution and event listeners
interface JitsiExternalApi {
  on(event: string, fn: (...args: any[]) => void): void;
  removeEventListener(event: string): void;
  executeCommand(command: string, ...args: any[]): void;
  getNumberOfParticipants(): number;
  dispose(): void;
}

interface MeetingRoomProps {
  roomName: string;
  password?: string;
  displayName: string;
  onLeave: () => void;
}

const ENABLE_ROOM_LOCK = true;

export default function MeetingRoom({
  roomName,
  password,
  displayName,
  onLeave,
}: MeetingRoomProps) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(true);
  const apiRef = useRef<JitsiExternalApi | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLeavingRef = useRef(false);

  const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.balkrishnapokharel.com.np';

  const handleLeave = useCallback(() => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;

    if (apiRef.current) {
      try {
        apiRef.current.dispose();
      } catch (err) {
        // Suppress any disposal errors during component cleanup
      }
      apiRef.current = null;
    }
    onLeave();
  }, [onLeave]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch {
          // ignore cleanup errors
        }
        apiRef.current = null;
      }
    };
  }, []);

  const handleApiReady = useCallback(
    (api: any) => {
      setIsApiLoading(false);
      apiRef.current = api as JitsiExternalApi;

      // Handle conference exit events from Jitsi UI
      api.on('videoConferenceLeft', () => {
        handleLeave();
      });

      api.on('readyToClose', () => {
        handleLeave();
      });

      // Optional defense-in-depth room locking
      if (ENABLE_ROOM_LOCK && password) {
        (async () => {
          try {
            const lockSecret = await deriveLockKey(password);

            // If the local participant is alone in the room, set the lock key
            api.on('videoConferenceJoined', () => {
              try {
                const count = api.getNumberOfParticipants();
                // When 1 participant, this participant is alone in the conference
                if (count <= 1) {
                  api.executeCommand('password', lockSecret);
                }
              } catch {
                // Ignore if command not supported on current Jitsi deploy
              }
            });

            // Automatically provide the lock password if prompted
            api.on('passwordRequired', () => {
              try {
                api.executeCommand('password', lockSecret);
              } catch {
                // Ignore if command not supported
              }
            });
          } catch {
            // If lock derivation fails, continue without room lock
          }
        })();
      }
    },
    [handleLeave, password]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] bg-neutral-950 overflow-hidden flex flex-col"
    >
      {/* Floating Leave Button */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={handleLeave}
          type="button"
          aria-label="Leave meeting"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600/90 hover:bg-red-500 text-white shadow-lg backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-neutral-950"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Leave
        </button>
      </div>

      {/* Loading state indicator */}
      {isApiLoading && !loadError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-neutral-950 text-neutral-200">
          <div className="w-10 h-10 border-4 border-neutral-700 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Connecting to conference...</p>
          <p className="text-xs text-neutral-500 mt-1">Connecting to {domain}</p>
        </div>
      )}

      {/* Load error message */}
      {loadError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950 p-6 text-center">
          <div className="max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Connection Error</h3>
            <p className="text-sm text-neutral-400 mb-4">{loadError}</p>
            <div className="text-xs text-neutral-500 bg-neutral-950 p-3 rounded-lg text-left mb-6 font-mono">
              Server: {domain}
              <br />
              Check your network connection or verify that NEXT_PUBLIC_JITSI_DOMAIN is accessible and supports embedding.
            </div>
            <button
              onClick={handleLeave}
              type="button"
              className="w-full py-2 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition-colors"
            >
              Back to Join Screen
            </button>
          </div>
        </div>
      )}

      {/* Jitsi Meeting Iframe wrapper */}
      <div className="flex-1 w-full h-[100dvh]">
        <JitsiMeeting
          domain={domain}
          roomName={roomName}
          userInfo={{
            displayName,
            email: '',
          }}
          configOverwrite={{
            prejoinPageEnabled: true,
            disableThirdPartyRequests: true,
            disableLocalVideoFlip: true,
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            enableClosePage: false,
          }}
          interfaceConfigOverwrite={{
            MOBILE_APP_PROMO: false,
            TILE_VIEW_MAX_COLUMNS: 4,
            VIDEO_LAYOUT_FIT: 'nocrop',
            SHOW_JITSI_WATERMARK: false,
          }}
          onApiReady={handleApiReady}
          onReadyToClose={handleLeave}
          getIFrameRef={(iframeRef) => {
            if (iframeRef) {
              iframeRef.style.height = '100dvh';
              iframeRef.style.width = '100%';
              iframeRef.style.border = '0';
              iframeRef.onerror = () => {
                setLoadError(
                  `Failed to load Jitsi API script from https://${domain}. Ensure the server is online and allows embedding.`
                );
              };
            }
          }}
          spinner={() => (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 text-neutral-200">
              <div className="w-10 h-10 border-4 border-neutral-700 border-t-indigo-500 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Loading conference...</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
