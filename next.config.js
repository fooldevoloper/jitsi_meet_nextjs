/** @type {import('next').NextConfig} */
const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.balkrishnapokharel.com.np';
const jitsiOrigin = `https://${jitsiDomain}`;

const nextConfig = {
  reactStrictMode: true,
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
