import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Quotient Bot Dashboard | Manage Your Discord Server",
  description: "Quotient Bot — A powerful Discord bot dashboard. Manage permissions, automod, social notifier, logging, roles, welcome messages, esports, and music.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
