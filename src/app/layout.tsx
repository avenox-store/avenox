import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Shopping site in India: Shop Online for Mobiles, Books, Watches & More - Amazon.in',
  description: 'Amazon Clone created for Avenox Store',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#eaeded] min-h-screen text-slate-900">
        {children}
      </body>
    </html>
  );
}
