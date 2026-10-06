/** @type {import('next').NextConfig} */
const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.balkrishnapokharel.com.np';
const jitsiOrigin = `https://${jitsiDomain}`;

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_JITSI_DOMAIN: process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.balkrishnapokharel.com.np',
    NEXT_PUBLIC_ROOM_SALT: process.env.NEXT_PUBLIC_ROOM_SALT || 'balkrishna-jitsi-room-salt-2024-secure-production-key',
    NEXT_PUBLIC_ADMIN_PASSWORD_HASH: process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH || '0937b275bfb7eb00c85b5d19a27e7bebeafba6d3e8958b431766a5e173e6cf1e',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: `camera=(self "${jitsiOrigin}"), microphone=(self "${jitsiOrigin}"), display-capture=(self "${jitsiOrigin}")`,
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
