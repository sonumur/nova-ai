import "./globals.css";

export const metadata = {
  title: "Bluebox AI - Your AI Assistant",
  description: "Chat with Bluebox, your intelligent AI assistant powered by advanced language models",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}