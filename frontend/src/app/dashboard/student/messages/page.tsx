"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  Menu,
  Video,
  Send,
  Check,
  CheckCheck,
  Dot,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentSidebar } from "@/components/studentSidebar/StudentSidebar";

/* =====================
   Tiny helpers
===================== */
type Message = {
  id: number;
  text: string;
  sender: "student" | "counselor";
  time?: string; // hh:mm
  status?: "sent" | "delivered" | "read"; // for student messages
};

// Theme colors
const PRIMARY = "#1e3a8a"; // blue-black
const PRIMARY_DARK = "#111827"; // dark/black for bubbles, header accents
const TEXT_LIGHT = "#f9fafb"; // light text on dark backgrounds

/* =====================
   Sidebar (Unified look)
===================== */
function ChatSidebar({
  chats,
  counselors,
  onSelectChat,
  onSelectCounselor,
  showSearch,
  setShowSearch,
  searchTerm,
  setSearchTerm,
  selectedChatId,
  sidebarOpen,
  setSidebarOpen,
}: {
  chats: { id: number; title: string; unread?: number }[];
  counselors: { id: number; name: string }[];
  onSelectChat: (id: number) => void;
  onSelectCounselor: (id: number) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedChatId: number | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const filteredCounselors = useMemo(
    () =>
      counselors.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [counselors, searchTerm]
  );

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`w-full md:w-80 md:shrink-0 bg-white border-r relative z-50 md:static h-full md:h-auto transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Messages</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-white shadow-sm hover:opacity-95 transition"
              style={{ backgroundColor: PRIMARY }}
            >
              <Search size={16} />
              <span className="text-sm">Find counselor</span>
            </button>
          </div>
        </div>

        {/* search */}
        {showSearch && (
          <div className="p-4 border-b bg-muted/40">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border bg-background outline-none focus:ring-2 transition"
                  style={{ borderColor: "#e5e7eb" }}
                  placeholder="Search counselors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchTerm("");
                }}
                className="p-2 rounded-lg hover:bg-muted transition"
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 max-h-64 overflow-y-auto space-y-1 pr-1">
              {filteredCounselors.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No counselors found
                </div>
              ) : (
                filteredCounselors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCounselor(c.id);
                      setSidebarOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-blue-50 border transition"
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    <div className="font-medium text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Click to start chat
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* recents */}
        <div className="p-4">
          <div className="text-xs font-semibold text-muted-foreground px-1 mb-2">
            Recent
          </div>
          <div className="space-y-1">
            {chats.map((chat) => {
              const active = selectedChatId === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    active ? "bg-blue-50 ring-1" : "hover:bg-muted/50"
                  }`}
                  style={{
                    borderColor: active ? PRIMARY : "#e5e7eb",
                    boxShadow: active ? `0 0 0 1px ${PRIMARY}1a` : "none",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium truncate">{chat.title}</div>
                    {chat.unread && chat.unread > 0 ? (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: PRIMARY }}
                      >
                        {chat.unread}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}

/* =====================
   Message list
===================== */
function TimeBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
        {children}
      </span>
    </div>
  );
}

function DeliveryIcon({ status }: { status?: "sent" | "delivered" | "read" }) {
  if (status === "read")
    return <CheckCheck size={14} style={{ color: PRIMARY_DARK }} />;
  if (status === "delivered")
    return <CheckCheck size={14} style={{ color: PRIMARY }} />;
  return <Check size={14} style={{ color: PRIMARY }} />;
}

function ChatMessages({ messages }: { messages: Message[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({
      top: ref.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const showDayDividerAt = 4;

  return (
    <div ref={ref} className="flex-1 overflow-y-auto bg-muted/40">
      <div className="mx-auto max-w-3xl px-3 sm:px-6 py-4 space-y-2">
        {messages.map((msg, idx) => {
          const isStudent = msg.sender === "student";
          const bubble = isStudent
            ? `bg-${PRIMARY_DARK} text-${TEXT_LIGHT}`
            : `bg-white text-foreground border border-blue-100`;
          const align = isStudent ? "justify-end" : "justify-start";

          return (
            <div key={msg.id}>
              {idx === showDayDividerAt && <TimeBadge>Today</TimeBadge>}

              <div className={`flex ${align}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm`}
                  style={{
                    backgroundColor: isStudent ? PRIMARY_DARK : "#fff",
                    color: isStudent ? TEXT_LIGHT : "#111827",
                    borderColor: isStudent ? "transparent" : "#1e3a8a20",
                  }}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.text}
                  </div>
                  <div
                    className={`mt-1 flex items-center gap-1 ${
                      isStudent ? TEXT_LIGHT + "/80" : "text-muted-foreground"
                    } text-[11px]`}
                  >
                    {msg.time ?? ""}
                    {isStudent && <DeliveryIcon status={msg.status} />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-start">
          <div
            className="mt-1 inline-flex items-center gap-1 rounded-2xl border px-3 py-2 shadow-sm"
            style={{ borderColor: PRIMARY }}
          >
            <span className="text-xs text-muted-foreground">
              Counselor is typing
            </span>
            <Dot className="animate-pulse" style={{ color: PRIMARY }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================
   Composer
===================== */
function ChatInput({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
}) {
  return (
    <div className="border-t bg-white">
      <div className="mx-auto max-w-3xl px-3 sm:px-6 py-3 flex gap-2">
        <input
          value={value}
          onChange={onChange}
          placeholder="Type your message…"
          className="flex-1 h-11 px-3 rounded-xl border outline-none focus:ring-2 transition"
          style={{ borderColor: "#e5e7eb" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSend();
          }}
        />
        <button
          onClick={onSend}
          className="h-11 px-4 rounded-xl text-white inline-flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition"
          style={{ backgroundColor: PRIMARY }}
        >
          <Send size={18} />
          <span className="hidden sm:inline text-sm">Send</span>
        </button>
      </div>
    </div>
  );
}

/* =====================
   Page
===================== */
export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! How can I help you today?",
      sender: "counselor",
      time: "09:12",
    },
    {
      id: 2,
      text: "Hi, I wanted to discuss my progress.",
      sender: "student",
      time: "09:13",
      status: "read",
    },
  ]);
  const [input, setInput] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<number | null>(1);
  const [selectedChatTitle, setSelectedChatTitle] = useState("Math Counselor");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const chats = [
    { id: 1, title: "Math Counselor", unread: 0 },
    { id: 2, title: "Career Guidance", unread: 2 },
  ];
  const counselors = [
    { id: 101, name: "Dr. Smith" },
    { id: 102, name: "Prof. Johnson" },
    { id: 103, name: "Dr. Sarah Wilson" },
    { id: 104, name: "Michael Chen" },
  ];

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: input.trim(),
        sender: "student",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sent",
      },
    ]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.status === "sent" ? { ...m, status: "delivered" } : m
        )
      );
    }, 600);
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.status === "delivered" ? { ...m, status: "read" } : m
        )
      );
    }, 1200);
  };

  const handleSelectChat = (id: number) => {
    setSelectedChatId(id);
    const chat = chats.find((c) => c.id === id);
    if (chat) {
      setSelectedChatTitle(chat.title);
      setMessages([
        {
          id: 1,
          text: "Hello! How can I help you today?",
          sender: "counselor",
          time: "08:41",
        },
      ]);
    }
  };

  const handleSelectCounselor = (id: number) => {
    const counselor = counselors.find((c) => c.id === id);
    if (counselor) {
      setSelectedChatId(null);
      setSelectedChatTitle(counselor.name);
      setMessages([
        {
          id: 1,
          text: "Hello! How can I help you today?",
          sender: "counselor",
          time: "11:02",
        },
      ]);
      setShowSearch(false);
      setSearchTerm("");
    }
  };

  return (
    <DashboardLayout title="Student Messages" sidebar={<StudentSidebar />}>
      <div className="flex min-h-[calc(100vh-160px)] bg-background rounded-2xl border overflow-hidden">
        <ChatSidebar
          chats={chats}
          counselors={counselors}
          onSelectChat={handleSelectChat}
          onSelectCounselor={handleSelectCounselor}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedChatId={selectedChatId}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex-1 flex flex-col">
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
            <div className="mx-auto max-w-3xl px-3 sm:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 rounded-lg hover:bg-muted transition"
                  aria-label="Open sidebar"
                >
                  <Menu size={18} />
                </button>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold">
                    {selectedChatTitle}
                  </h2>
                  <p style={{ color: PRIMARY_DARK }}>Online</p>
                </div>
              </div>

              <button
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-white shadow-sm hover:opacity-95 transition"
                style={{ backgroundColor: PRIMARY }}
              >
                <Video size={16} />
                <span className="hidden sm:inline text-sm">Start Call</span>
              </button>
            </div>
          </div>

          <ChatMessages messages={messages} />

          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onSend={sendMessage}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
