import React, { useState, useRef, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import { Send, MessageSquare } from 'lucide-react';

export const ChatPanel: React.FC = () => {
  const { chatMessages, sendChatMessage, currentTeam } = useRoom();
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  return (
    <div className="glass-panel rounded-2xl border border-neutral-800 flex flex-col h-[380px] shadow-broadcast bg-[#0a0a0a]">
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="font-heading font-bold text-xs text-neutral-200 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" /> ROOM LIVE CHAT
        </h3>
        <span className="text-[10px] text-neutral-500 font-mono">{chatMessages.length} msgs</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {chatMessages.map((msg) => (
          <div key={msg.id} className="text-xs">
            {msg.is_system_msg ? (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-2 rounded-lg font-mono text-[11px] leading-relaxed my-1">
                {msg.message}
              </div>
            ) : (
              <div className="bg-black/80 p-2 rounded-lg border border-neutral-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-400 text-[11px] flex items-center gap-1">
                    {msg.sender_team ? `${msg.sender_team.logo_url} ` : ''}
                    {msg.sender_name}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-neutral-300 font-sans">{msg.message}</div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-neutral-800 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={currentTeam ? "Type a message..." : "Join room to chat..."}
          className="flex-1 bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 font-sans"
        />
        <button
          type="submit"
          className="p-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-xl transition-colors font-bold shadow-sm cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

