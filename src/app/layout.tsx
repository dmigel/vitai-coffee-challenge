import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  display: "swap",
  variable: "--font-manrope",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500"],
  display: "swap",
  variable: "--font-unbounded",
});

export const metadata: Metadata = {
  title: "Кварта — мастерская обжарки кофе",
  description:
    "Обжариваем спешелти-зерно партиями по 5 кг и привозим к вам домой на 1–3 день после обжарки.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${manrope.variable} ${unbounded.variable} min-h-dvh bg-background font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
