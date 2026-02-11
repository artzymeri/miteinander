import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Miteinander | Fürsorge, die verbindet",
  description: "Finden Sie die perfekte Unterstützung für Ihre Liebsten. Direkt, persönlich, menschlich. Die deutsche Plattform für Pflege.",
  keywords: "Pflege, Seniorenbetreuung, Pflegekräfte, Deutschland, häusliche Pflege, Betreuung",
  authors: [{ name: "Miteinander" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Miteinander | Die Plattform, die verbindet",
    description: "Finden Sie die perfekte Unterstützung für Ihre Liebsten. Direkt, persönlich, menschlich.",
    type: "website",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "Miteinander Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Miteinander | Die Plattform, die verbindet",
    description: "Finden Sie die perfekte Unterstützung für Ihre Liebsten. Direkt, persönlich, menschlich.",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${playfair.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              <LanguageProvider>
                {children}
                <Toaster position="top-right" richColors closeButton />
              </LanguageProvider>
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
