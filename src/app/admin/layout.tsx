import { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Admin — YPV Switzerland",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#fafaf9]">{children}</body>
    </html>
  );
}
