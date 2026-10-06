import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Secure Jitsi Meet',
  description: 'Deterministic password-protected video meetings powered by Jitsi',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        {/* Bundled Jitsi Meet External API from this repository (/external_api.js) so no external script is fetched */}
        <script src="/external_api.js" async />
      </head>
      <body className="h-full bg-neutral-950 text-neutral-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
