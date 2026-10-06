'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import JoinForm from '@/components/JoinForm';

// Dynamically import MeetingRoom with ssr: false so Jitsi external API is loaded on client only
const MeetingRoom = dynamic(() => import('@/components/MeetingRoom'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-neutral-950 text-neutral-300">
      <div className="w-10 h-10 border-4 border-neutral-700 border-t-indigo-500 rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium">Preparing meeting environment...</p>
    </div>
  ),
});

export default function HomePage() {
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

  const handleJoin = (roomName: string, password: string, displayName: string) => {
    setMeetingState({
      inMeeting: true,
      roomName,
      password,
      displayName,
    });
  };

  const handleLeave = () => {
    // Completely clear room and password from component memory state on leave
    setMeetingState({
      inMeeting: false,
      roomName: '',
      password: '',
      displayName: '',
    });
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
      <JoinForm onJoin={handleJoin} />
    </main>
  );
}
