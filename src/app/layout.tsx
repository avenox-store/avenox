import "./tokens.css"; // copy design-system/tokens.css next to this file
import "./globals.css";
import { sb } from "@/lib/supabase";
import { StoreProvider } from "@/lib/store";
import { Header } from "@/components/Header";

export const metadata = { title: process.env.NEXT_PUBLIC_BRAND ?? "Haatly" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { data } = await sb.from("categories").select("name,slug").order("name");
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <Header categories={data ?? []} />
          <main className="mx-auto max-w-[1280px] space-y-4 px-4 py-4 md:px-6">{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
