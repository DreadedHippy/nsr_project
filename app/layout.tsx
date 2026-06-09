import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NSR Verification System",
  description: "Beneficiary identity verification and feedback collection for the National Social Register."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
