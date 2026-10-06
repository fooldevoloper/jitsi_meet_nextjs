'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import JoinForm from '@/components/JoinForm';

const MeetingRoom = dynamic(() => import('@/components/MeetingRoom'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-neutral-950 text-neutral-300">
      <div className="w-10 h-10 border-4 border-neutral-700 border-t-indigo-500 rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium">Preparing meeting environment...</p>
    </div>
  ),
});

export default function JoinPage() {
  const [fragmentPassword, setFragmentPassword] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [meetingState, setMeetingState] = useState<{
    inMeeting: boolean;
    roomName: string;
    password: string;
    displayName: string;
  }>({
    inMeeting: false,
    roomName: '',
    password: '',
    displayName: '',
  });

  useEffect(() => {
    // Read the password from the URL hash fragment
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        // Remove leading '#'
        const rawPassword = decodeURIComponent(hash.slice(1));
        setFragmentPassword(rawPassword);

        // Immediately scrub the fragment from the address bar and browser history
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, '', cleanUrl);
      }
      setIsReady(true);
    }
  }, []);

  const handleJoin = (roomName: string, password: string, displayName: string) => {
    setMeetingState({
      inMeeting: true,
      roomName,
      password,
      displayName,
    });
  };

  const handleLeave = () => {
    // Completely clear room and password from state
    setMeetingState({
      inMeeting: false,
      roomName: '',
      password: '',
      displayName: '',
    });
    setFragmentPassword('');
  };

  if (meetingState.inMeeting) {
    return (
      <MeetingRoom
        roomName={meetingState.roomName}
        password={meetingState.password}
        displayName={meetingState.displayName}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      {isReady ? (
        <JoinForm
          initialPassword={fragmentPassword}
          autoSubmit={Boolean(fragmentPassword && fragmentPassword.length >= 10)}
          onJoin={handleJoin}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-neutral-400">
          <div className="w-8 h-8 border-2 border-neutral-700 border-t-indigo-500 rounded-full animate-spin mb-3" />
          <p className="text-xs">Processing join invite...</p>
        </div>
      )}
    </main>
  );
}
