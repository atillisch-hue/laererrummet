import type { Metadata } from "next";
import "./globals.css";
import Enhancements from "./Enhancements";
import DashboardNav from "./DashboardNav";

export const metadata: Metadata = {
  title: "Klasseværelset",
  description: "Klasser, elever, opgaver og skrivehjælp samlet ét sted",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da">
      <body>
        {children}
        <Enhancements />
        <DashboardNav />
      </body>
    </html>
  );
}
