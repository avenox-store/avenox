import './globals.css';

export const metadata = {
  title: 'Amazon.in',
  description: 'Online Shopping site in India',
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
