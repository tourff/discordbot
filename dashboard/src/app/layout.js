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
  title: "Bot Dashboard | Manage Your Discord Server",
  description: "A sleek, professional dashboard to manage your Discord bot's permissions, welcome messages, and server settings.",
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
