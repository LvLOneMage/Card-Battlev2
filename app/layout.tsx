import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Card Grid Battle',
  description: 'A two-player card battle game',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
