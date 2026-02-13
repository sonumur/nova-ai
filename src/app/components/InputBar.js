"use client";
import { useState, useRef } from "react";

export default function InputBar({ onSend }) {
  const [value, setValue] = useState("");
  const [blueboxThink, setBlueboxThink] = useState(false);
  const [search, setSearch] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  function send() {
    if (!value.trim()) return;

    // Construct the message based on toggles
    let finalValue = value;
    if (blueboxThink) finalValue = `[BlueboxThink] ${finalValue}`;
    if (search) finalValue = `[Search] ${finalValue}`;

    onSend(finalValue);
    setValue("");
  }

  function startVoice() {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice input not supported in this browser");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setValue(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  return (
    <div className="w-full">
      <div className="bg-white/60 backdrop-blur-md rounded-2xl md:rounded-[1.5rem] p-1.5 md:p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/20 flex flex-col gap-2 transition-all focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.08)] focus-within:border-gray-200">

        {/* TEXT INPUT AREA */}
        <div className="px-4 pt-2">
          <textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Message Bluebox"
            rows={1}
            className="w-full bg-transparent outline-none text-gray-800 text-base md:text-lg placeholder-gray-400 resize-none max-h-[200px] py-1 md:py-1.5"
          />
        </div>

        {/* TOOLBAR AREA */}
        <div className="flex items-center justify-between px-2 pb-1">
          <div className="flex items-center gap-2">
            {/* Toggle buttons removed */}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={startVoice}
              className={`p-2 rounded-full transition-colors ${listening ? "bg-red-50 text-red-500" : "text-gray-400 hover:bg-gray-100"}`}
              title="Voice Input"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </button>

            {/* SEND BUTTON */}
            <button
              onClick={send}
              disabled={!value.trim()}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${value.trim()
                ? "bg-[#4d6bfe] text-white shadow-lg shadow-[#4d6bfe]/20 hover:scale-105 active:scale-95"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
