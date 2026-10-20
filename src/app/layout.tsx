import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amazon.in : Online Shopping site in India',
  description: 'Amazon Clone',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#eaeded] min-h-screen text-slate-900 m-0 p-0">
        {children}
      </body>
    </html>
  );
}
