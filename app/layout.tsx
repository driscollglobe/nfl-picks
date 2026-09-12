import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Driscoll NFL Model',
  icons: { icon: '/driscoll-logo-20260912.png' },
  description:
    'An interactive NFL against-the-spread model dashboard for the 2026 season.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
