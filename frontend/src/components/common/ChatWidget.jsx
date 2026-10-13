import { useCallback, useEffect, useRef, useState } from "react";
import { chatApi } from "../../services/chatApi";
import "./ChatWidget.css";

// ── localStorage helpers ───────────────────────────────────────────────────────
const STORAGE_KEY = "chat_history_v1";

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveMessages(msgs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

function clearMessages() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`chat-bubble-row ${isUser ? "user-row" : "bot-row"}`}>
      {!isUser && (
        <div className="chat-avatar bot-avatar" aria-hidden="true">
          🤖
        </div>
      )}
      <div className={`chat-bubble ${isUser ? "user-bubble" : "bot-bubble"}`}>
        {msg.text}
      </div>
      {isUser && (
        <div className="chat-avatar user-avatar" aria-hidden="true">
          👤
        </div>
      )}
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="chat-bubble-row bot-row">
      <div className="chat-avatar bot-avatar" aria-hidden="true">🤖</div>
      <div className="chat-bubble bot-bubble typing-bubble">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}

// ── Default welcome message ────────────────────────────────────────────────────
const WELCOME_MSG = {
  role: "bot",
  text: "👋 Hi! I'm your AI support assistant. Ask me about your orders, products, pricing, or anything else about our shop!",
};

// ── Main ChatWidget ────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => loadMessages() ?? [WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setHasUnread(false);
    }
  }, [isOpen]);

  // Build history in Gemini format from messages (skip the initial bot greeting)
  const buildHistory = useCallback((msgs) => {
    return msgs
      .slice(1) // skip the welcome message
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [m.text],
      }));
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", text };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const history = buildHistory(messages); // history before this new message
      const response = await chatApi.sendMessage(text, history);
      // Backend envelope: { success, message, data: { reply } }
      // chatApi returns res.data, so response = { success, data: { reply } }
      const reply = response?.data?.reply || response?.reply || "Sorry, I couldn't understand that.";

      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
      if (!isOpen) setHasUnread(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "⚠️ The AI assistant is temporarily unavailable. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClear = () => {
    const fresh = [WELCOME_MSG];
    setMessages(fresh);
    clearMessages();
    saveMessages(fresh);
  };

  return (
    <>
      {/* ── Chat Panel ─────────────────────────────────────────────────── */}
      <div
        className={`chat-panel ${isOpen ? "chat-panel--open" : ""}`}
        role="dialog"
        aria-label="AI Customer Support Chat"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-avatar">🤖</div>
            <div>
              <div className="chat-header-title">AI Support</div>
              <div className="chat-header-status">
                <span className="status-dot" />
                Always online
              </div>
            </div>
          </div>
          <div className="chat-header-actions">
            <button
              className="chat-clear-btn"
              onClick={handleClear}
              aria-label="Clear chat history"
              title="Clear chat"
            >
              🗑
            </button>
            <button
              className="chat-close-btn"
              onClick={handleToggle}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages" role="log" aria-live="polite">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            id="chat-input"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your orders, products..."
            rows={1}
            disabled={loading}
            aria-label="Type your message"
          />
          <button
            id="chat-send-btn"
            className="chat-send-btn"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            {loading ? (
              <span className="send-spinner" />
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="chat-footer">Powered by Gemini AI ✨</div>
      </div>

      {/* ── FAB Toggle Button ───────────────────────────────────────────── */}
      <button
        id="chat-toggle-btn"
        className={`chat-fab ${isOpen ? "chat-fab--open" : ""}`}
        onClick={handleToggle}
        aria-label={isOpen ? "Close chat" : "Open AI Support Chat"}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        )}
        {hasUnread && !isOpen && <span className="chat-unread-dot" />}
      </button>
    </>
  );
}
