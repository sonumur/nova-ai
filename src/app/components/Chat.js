"use client";

import { useState, useRef, useEffect } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: "assistant", type: "text", content: "Hi 👋 I’m Nova. How can I help you?" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [cursor, setCursor] = useState(true);

  const bottomRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Blinking cursor
  useEffect(() => {
    if (!typing) return;

    const interval = setInterval(() => {
      setCursor(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [typing]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");


    // Add user message
    setMessages(prev => [
      ...prev,
      { role: "user", type: "text", content: userMessage }
    ]);

    setTyping(true);

    const isImageRequest =
      userMessage.toLowerCase().includes("image") ||
      userMessage.toLowerCase().includes("generate");

    try {
      // Prepare chat history (user + assistant)
      const cleanMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Add current user message
      cleanMessages.push({ role: "user", content: userMessage });

      const res = await fetch(isImageRequest ? "/api/image" : "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isImageRequest
            ? { prompt: userMessage }
            : { messages: cleanMessages }
        )
      });

      // Prepare empty assistant message before streaming
      setMessages(prev => [
        ...prev,
        { role: "assistant", type: "text", content: "" }
      ]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        aiText += decoder.decode(value, { stream: true });

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            type: "text",
            content: aiText
          };
          return updated;
        });
        // Delay between each character
        await new Promise(resolve => setTimeout(resolve, 10)); // 20ms per character
      }

    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", type: "text", content: "⚠️ Error talking to Nova" }
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble ${msg.role}`}>
            {msg.type === "image" ? (
              <img src={msg.content} alt="Generated" />
            ) : (
              <p>
                {msg.content}
                {typing && i === messages.length - 1 && msg.role === "assistant" && cursor && "▍"}
              </p>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Message Nova…"
          disabled={typing}
        />
        <button type="submit">➤</button>
      </form>
    </div>
  );
}
