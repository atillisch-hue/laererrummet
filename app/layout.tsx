import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lærerrummet",
  description: "Klasser, elever, opgaver og skrivehjælp samlet ét sted",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  );
}
