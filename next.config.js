/** @type {import('next').NextConfig} */
const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
const jitsiOrigin = `https://${jitsiDomain}`;

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_JITSI_DOMAIN: process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si',
    NEXT_PUBLIC_ROOM_SALT: process.env.NEXT_PUBLIC_ROOM_SALT || 'balkrishna-jitsi-room-salt-2024-secure-production-key',
    NEXT_PUBLIC_ADMIN_PASSWORD_HASH: process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH || '93d3c9afc0f1e90e34eb37a21d36b0a37fc9fb558348a5d62cd0cfb92ce1867b',
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
