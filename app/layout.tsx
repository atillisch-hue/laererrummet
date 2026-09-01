import type { Metadata } from "next";
import "./globals.css";
import DashboardNav from "./DashboardNav";
import AccessGuard from "./AccessGuard";

export const metadata: Metadata = {
  title: "Klasseværelset",
  description: "Klasser, elever, opgaver og skrivehjælp samlet ét sted",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da">
      <body>
        <AccessGuard>
          <DashboardNav />
          {children}
        </AccessGuard>
      </body>
    </html>
  );
}
