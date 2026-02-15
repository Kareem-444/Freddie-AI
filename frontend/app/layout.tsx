import type { Metadata } from 'next';
import './globals.css';
//layout.tsx
export const metadata: Metadata = {
  title: 'Freddie AI',
  description: 'Your intelligent AI assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        {children}
      </body>
    </html>
  );
}