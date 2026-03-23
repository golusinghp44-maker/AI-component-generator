import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { generateContent, streamContent, generateCode, explainCode } from "../utils/aiService";
import { toast } from "react-toastify";
import { BsStars, BsMoon, BsSun } from "react-icons/bs";

const AIChat = () => {
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatHistory");
    if (savedMessages) {
      return JSON.parse(savedMessages);
    }
    return [
      {
        id: 1,
        sender: "assistant",
        text: `Hello ${user?.name}! 👋 I'm your AI assistant powered by Google Gemini. I can help you with:
- Writing code
- Explaining concepts
- Generating text
- Answering questions
- And much more!

What would you like help with?`,
      },
    ];
  });
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  const clearChatHistory = () => {
    localStorage.removeItem("chatHistory");
    setMessages([
      {
        id: 1,
        sender: "assistant",
        text: `Hello ${user?.name}! 👋 I'm your AI assistant powered by Google Gemini. I can help you with:
- Writing code
- Explaining concepts
- Generating text
- Answering questions
- And much more!

What would you like help with?`,
      },
    ]);
    toast.info("Chat history cleared");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Generate response from Gemini
      const response = await generateContent(input);

      const assistantMessage = {
        id: messages.length + 2,
        sender: "assistant",
        text: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Failed to get response from AI");
      console.error(error);
      
      const errorMessage = {
        id: messages.length + 2,
        sender: "assistant",
        text: "Sorry, I encountered an error processing your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto rounded-lg shadow-lg flex flex-col h-screen ${darkMode ? "bg-gray-900" : "bg-white"}`}>
      {/* Header */}
      <div className={`${darkMode ? "bg-gradient-to-r from-gray-800 to-gray-900" : "bg-gradient-to-r from-blue-600 to-blue-700"} text-white p-4 rounded-t-lg flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <BsStars size={24} />
          <div>
            <h2 className="text-xl font-bold">AI Chat Assistant</h2>
            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-blue-100"}`}>Powered by Google Gemini</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-3 py-1 rounded text-sm font-semibold transition ${darkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-700 hover:bg-gray-800"}`}
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <BsSun size={18} /> : <BsMoon size={18} />}
          </button>
          <button
            onClick={clearChatHistory}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm font-semibold transition"
            title="Clear chat history"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : darkMode ? "bg-gray-700 text-gray-100 rounded-bl-none" : "bg-gray-200 text-gray-800 rounded-bl-none"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className={`${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800"} px-4 py-2 rounded-lg rounded-bl-none`}>
              <div className="flex gap-2">
                <div className={`w-2 h-2 ${darkMode ? "bg-gray-400" : "bg-gray-500"} rounded-full animate-bounce`}></div>
                <div className={`w-2 h-2 ${darkMode ? "bg-gray-400" : "bg-gray-500"} rounded-full animate-bounce`} style={{ animationDelay: "0.2s" }}></div>
                <div className={`w-2 h-2 ${darkMode ? "bg-gray-400" : "bg-gray-500"} rounded-full animate-bounce`} style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className={`${darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"} border-t p-4 flex gap-2`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          className={`flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border border-gray-300 bg-white text-gray-900"}`}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIChat;
