import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Сообща — маленькие группы для большой цели",
    template: "%s · Сообща",
  },
  description:
    "Соберитесь в круг из 3–8 человек вокруг одной цели и срока. Каждую неделю — короткий шаг и поддержка тех, кто идёт рядом.",
};

export const viewport: Viewport = {
  themeColor: "#ede5d7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
