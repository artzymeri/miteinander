import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

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
  description: "Finden Sie die perfekte Unterstützung für Ihre Liebsten. Direkt, persönlich, menschlich. Die deutsche Plattform für Altenpflege.",
  keywords: "Altenpflege, Seniorenbetreuung, Pflegekräfte, Deutschland, häusliche Pflege, Betreuung",
  authors: [{ name: "Miteinander" }],
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Miteinander | Fürsorge, die verbindet",
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
    title: "Miteinander | Fürsorge, die verbindet",
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
        {children}
      </body>
    </html>
  );
}
