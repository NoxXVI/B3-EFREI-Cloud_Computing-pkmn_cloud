import { Suspense } from "react";
import { Providers } from "./providers";
import { Public_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import TopBar from "@/components/topBar";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={cn("font-sans", publicSans.variable)}>
      <body>
        <Suspense fallback={null}>
          <TopBar />
        </Suspense>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
