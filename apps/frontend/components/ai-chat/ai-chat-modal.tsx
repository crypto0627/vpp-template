"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  X, Send, Plus, Trash2, MessageSquare, Menu, PanelLeftClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageItem } from "./message-item";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface APISession {
  id: string;
  title: string;
  createdAt: string;
}

interface APIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiChatModal({ isOpen, onClose }: AiChatModalProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = useMemo(() => {
    const currentSession = sessions.find((s) => s.id === currentSessionId);
    return currentSession?.messages || [];
  }, [sessions, currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai/sessions/${sessionId}`);
      if (!response.ok) throw new Error("Failed to load messages");

      const data = await response.json();
      const loadedMessages: Message[] = data.messages.map((m: APIMessage) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.createdAt),
      }));

      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, messages: loadedMessages }
            : session,
        ),
      );
    } catch {
      // silently ignore load errors
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch(`/api/ai/sessions`);
      if (!response.ok) throw new Error("Failed to load sessions");

      const data = await response.json();
      const loadedSessions: ChatSession[] = data.sessions.map((s: APISession) => ({
        id: s.id,
        title: s.title,
        messages: [],
        createdAt: new Date(s.createdAt),
      }));

      if (loadedSessions.length > 0) {
        setSessions(loadedSessions);
        setCurrentSessionId(loadedSessions[0]!.id);
        await loadSessionMessages(loadedSessions[0]!.id);
      } else {
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: "新對話",
          messages: [],
          createdAt: new Date(),
        };
        setSessions([newSession]);
        setCurrentSessionId(newSession.id);
      }
    } catch {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: "新對話",
        messages: [],
        createdAt: new Date(),
      };
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
    }
  }, [loadSessionMessages]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSidebarOpen(window.innerWidth >= 1024);
    loadSessions();
  }, [isOpen, loadSessions]);

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading || !currentSessionId) return;

    const userMessage: Message = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now().toString(),
      role: "user",
      content: messageContent.trim(),
      timestamp: new Date(),
    };

    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === currentSessionId) {
          const isFirstMessage = session.messages.length === 0;
          const newTitle = isFirstMessage
            ? userMessage.content.length > 30
              ? userMessage.content.slice(0, 30) + "..."
              : userMessage.content
            : session.title;
          return { ...session, title: newTitle, messages: [...session.messages, userMessage] };
        }
        return session;
      }),
    );

    setIsLoading(true);

    try {
      const response = await fetch(`/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: currentSessionId, message: messageContent.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API 請求失敗 (${response.status})`);
      }

      const data = await response.json();
      const aiMessage: Message = {
        id: data.message.id,
        role: "assistant",
        content: data.message.content,
        timestamp: new Date(data.message.timestamp),
      };

      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? { ...session, messages: [...session.messages, aiMessage] }
            : session,
        ),
      );
    } catch {
      const errorMessage: Message = {
        // eslint-disable-next-line react-hooks/purity
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "抱歉，我現在無法回應。請稍後再試。",
        timestamp: new Date(),
      };
      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? { ...session, messages: [...session.messages, errorMessage] }
            : session,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "新對話",
      messages: [],
      createdAt: new Date(),
    };
    setSessions((prev) => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
    setInput("");
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const session = sessions.find((s) => s.id === sessionId);
    if (session && session.messages.length === 0) {
      await loadSessionMessages(sessionId);
    }
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("確定要刪除這個對話嗎？")) return;
    try {
      const response = await fetch(`/api/ai/sessions/${sessionId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete session");

      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== sessionId);
        if (sessionId === currentSessionId) {
          if (filtered.length > 0) {
            setCurrentSessionId(filtered[0]!.id);
            loadSessionMessages(filtered[0]!.id);
          } else {
            const newSession: ChatSession = { id: Date.now().toString(), title: "新對話", messages: [], createdAt: new Date() };
            setCurrentSessionId(newSession.id);
            return [newSession];
          }
        }
        return filtered;
      });
    } catch {
      alert("刪除對話失敗");
    }
  };

  const handleDeleteAll = async () => {
    if (sessions.length === 0 || !confirm("確定要清除所有對話記錄嗎？")) return;
    try {
      await Promise.all(
        sessions.map((session) =>
          fetch(`/api/ai/sessions/${session.id}`, { method: "DELETE" }),
        ),
      );
      const newSession: ChatSession = { id: Date.now().toString(), title: "新對話", messages: [], createdAt: new Date() };
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
    } catch {
      alert("清除對話失敗");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-5xl lg:w-[70%] h-[90%] lg:h-[80%] z-[101] animate-in fade-in zoom-in-95 duration-300">
        <div
          className="flex h-full bg-gradient-to-br from-[#1A1915] via-[#262420] to-[#1A1915] rounded-xl shadow-2xl overflow-hidden border border-[#DA7756]/30"
          style={{ boxShadow: "0 0 0 1px rgba(218,119,86,0.3), 0 0 30px rgba(194,97,74,0.4), 0 0 60px rgba(218,119,86,0.3), 0 20px 40px rgba(0,0,0,0.3)" }}
        >
          {/* Mobile sidebar backdrop */}
          {isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={`${isSidebarOpen ? "w-64" : "w-0 lg:w-0"} border-r border-[#DA7756]/20 bg-gradient-to-b from-[#262420] to-[#1A1915] flex flex-col transition-all duration-300 overflow-hidden lg:relative absolute lg:z-0 z-50 h-full ${!isSidebarOpen && "lg:hidden"}`}>
            <div className="h-16 px-4 border-b border-[#DA7756]/20 flex items-center">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-xs font-semibold text-[#BEA98F] uppercase tracking-wider">對話記錄</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewChat}
                  className="h-7 w-7 text-[#D4A56A] hover:text-[#DA7756] hover:bg-[#DA7756]/20 rounded-lg transition-all"
                  title="新對話"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sessions.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="h-10 w-10 text-[#DA7756]/50 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-xs text-[#BEA98F]/60">尚無對話記錄</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      currentSessionId === session.id
                        ? "bg-gradient-to-br from-[#DA7756] to-[#C2614A]"
                        : "bg-[#262420]/50 hover:bg-[#3D3A35]/70"
                    }`}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${currentSessionId === session.id ? "text-white" : "text-[#E8DDD3]"}`}>
                          {session.title}
                        </p>
                        <p className={`text-xs mt-1 ${currentSessionId === session.id ? "text-[#F5F0EA]" : "text-[#BEA98F]/60"}`}>
                          {new Date(session.createdAt).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-[#BEA98F] hover:text-red-400 hover:bg-red-500/20 rounded-md"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-[#DA7756]/20">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteAll}
                disabled={sessions.length === 0}
                className="w-full text-xs text-[#BEA98F] border-[#DA7756]/30 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/20 transition-colors rounded-lg disabled:opacity-30"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                清除全部
              </Button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-[#1A1915] to-[#262420]">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#DA7756]/20 bg-[#262420]/50">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="text-[#BEA98F] hover:text-[#F5F0EA] hover:bg-[#DA7756]/20 rounded-lg transition-all"
                >
                  {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
                <div>
                  <h2 className="text-lg font-semibold text-[#F5F0EA] tracking-tight">華城電機</h2>
                  <p className="text-xs text-[#BEA98F]/70 mt-0.5">能源管理智能顧問</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-[#BEA98F] hover:text-[#F5F0EA] hover:bg-[#DA7756]/20 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#1A1915]/30">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#DA7756] to-[#C2614A] rounded-2xl flex items-center justify-center border border-[#DA7756]/30 shadow-lg">
                      <MessageSquare className="h-8 w-8 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#7D9B7E] rounded-full border-2 border-[#1A1915]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#F5F0EA] mb-2">開始新對話</h3>
                  <p className="text-[#BEA98F]/70 mb-8 max-w-md text-sm">
                    詢問能源數據、分析用電趨勢、或獲取系統操作建議
                  </p>
                  <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                    {[
                      { q: "今日用電量是多少？", sub: "查詢當前用電狀況" },
                      { q: "儲能系統目前狀態如何？", sub: "檢查電池狀態與效能" },
                      { q: "如何降低電費成本？", sub: "獲取節能優化建議" },
                    ].map(({ q, sub }) => (
                      <button
                        key={q}
                        className="p-4 text-left rounded-xl bg-[#262420]/50 hover:bg-[#3D3A35]/70 transition-all border border-[#DA7756]/20 hover:border-[#DA7756]/40 group"
                        onClick={() => sendMessage(q)}
                      >
                        <p className="text-sm font-medium text-[#E8DDD3] group-hover:text-[#F5F0EA]">{q}</p>
                        <p className="text-xs text-[#BEA98F]/60 mt-1">{sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#262420]/70 text-[#F5F0EA] border border-[#DA7756]/30 rounded-2xl px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {[0, 150, 300].map((delay) => (
                              <div
                                key={delay}
                                className="w-2 h-2 bg-[#DA7756] rounded-full animate-bounce"
                                style={{ animationDelay: `${delay}ms` }}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-[#BEA98F]/70">思考中...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-5 border-t border-[#DA7756]/20 bg-[#262420]/50">
              <div className="flex items-end gap-3">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="輸入您的問題..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 px-4 border-[#DA7756]/30 rounded-xl disabled:bg-[#262420]/30 text-[#F5F0EA] placeholder:text-[#BEA98F]/50 bg-[#1A1915]/70 resize-none max-h-32 focus-visible:ring-0"
                  style={{
                    height: "50px",
                    minHeight: "50px",
                    lineHeight: "1.5",
                    paddingTop: "13px",
                    paddingBottom: "13px",
                    boxShadow: "0 0 0 1px rgba(218,119,86,0.3), 0 2px 8px rgba(0,0,0,0.2)",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "50px";
                    target.style.height = Math.min(target.scrollHeight, 128) + "px";
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon-lg"
                  className="shrink-0 bg-gradient-to-br from-[#DA7756] to-[#C2614A] hover:from-[#C2614A] hover:to-[#DA7756] text-white rounded-xl disabled:opacity-30"
                  style={{ height: "50px", width: "50px", boxShadow: "0 0 0 1px rgba(218,119,86,0.5), 0 0 20px rgba(194,97,74,0.4)" }}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-[#BEA98F]/60 mt-3 text-center">
                按 <kbd className="px-1.5 py-0.5 bg-[#3D3A35] border border-[#DA7756]/30 rounded text-[#E8DDD3] font-mono text-[10px]">Enter</kbd> 發送 ·{" "}
                <kbd className="px-1.5 py-0.5 bg-[#3D3A35] border border-[#DA7756]/30 rounded text-[#E8DDD3] font-mono text-[10px]">Shift</kbd> +{" "}
                <kbd className="px-1.5 py-0.5 bg-[#3D3A35] border border-[#DA7756]/30 rounded text-[#E8DDD3] font-mono text-[10px]">Enter</kbd> 換行
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
