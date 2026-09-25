import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AlgoVisual — See beyond Big O",
  description:
    "Explore, visualize, and compare algorithms across best, average, and worst cases. A hands-on workspace for learning DSA.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
