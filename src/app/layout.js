import "./globals.css";

export const metadata = {
  title: "AI Image & Chat App",
  description: "Image generation with OpenAI and chat with Groq",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "Arial, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}