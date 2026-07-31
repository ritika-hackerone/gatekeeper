import "./globals.css";
import CursorField from "./components/CursorField";

export const metadata = {
  title: "Gatekeeper — Visa Readiness by AbroBot.ai",
  description:
    "Gatekeeper turns published visa criteria into a clear, honest readiness checklist for study-abroad applicants — never a prediction, always a fix.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CursorField />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
