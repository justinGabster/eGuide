import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'eGuide',
  description: 'Metro Manila Commuter Assistant',
};

import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
