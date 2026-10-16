import "./globals.css";

export const metadata = {
  title: "Next.js Starter",
  description: "Built in Vibecode",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
