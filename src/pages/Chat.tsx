import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import ChatHeader from "@/components/chat/ChatHeader";
import TypingIndicator from "@/components/chat/TypingIndicator";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    await loadOrCreateConversation(session.user.id);
  };

  const loadOrCreateConversation = async (userId: string) => {
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      toast.error("Failed to load conversation");
      return;
    }

    if (conversations && conversations.length > 0) {
      setConversationId(conversations[0].id);
    } else {
      await createNewConversation(userId);
    }
  };

  const createNewConversation = async (userId?: string) => {
    const currentUserId = userId || user?.id;
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: currentUserId, title: "New Chat" })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create conversation");
      return;
    }

    setConversationId(data.id);
    setMessages([]);
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load messages");
      return;
    }

    setMessages((data || []) as Message[]);
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!conversationId || !user) return;

    setLoading(true);

    try {
      // Check if message contains YouTube URL
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/\s]{11})/;
      const isYouTubeUrl = youtubeRegex.test(content);

      if (isYouTubeUrl) {
        // Save user message
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "user",
          content,
        });

        // Call YouTube summary function
        const { data, error: ytError } = await supabase.functions.invoke("youtube-summary", {
          body: {
            videoUrl: content,
            conversationId,
          },
        });

        if (ytError) throw ytError;

        toast.success("YouTube video summarized successfully!");
      } else if (file) {
        // Handle PDF upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("conversationId", conversationId);
        formData.append("userId", user.id);

        const { data, error: pdfError } = await supabase.functions.invoke("pdf-summary", {
          body: formData,
        });

        if (pdfError) throw pdfError;

        toast.success("PDF analyzed successfully!");
      } else {
        // Regular text message
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "user",
          content,
        });

        // Call AI
        const { data, error: aiError } = await supabase.functions.invoke("chat", {
          body: {
            conversationId,
            message: content,
          },
        });

        if (aiError) throw aiError;
      }

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

    } catch (error: any) {
      console.error("Chat error:", error);
      if (error.message?.includes("429")) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes("402")) {
        toast.error("AI credits depleted. Please add credits to continue.");
      } else if (error.message?.includes("No captions available")) {
        toast.error("This YouTube video doesn't have captions available.");
      } else if (error.message?.includes("Could not extract text")) {
        toast.error("Could not extract text from PDF. Please ensure it's not a scanned document.");
      } else {
        toast.error(error.message || "Failed to send message");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    createNewConversation();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-background">
      <ChatHeader onNewChat={handleNewChat} />
      
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-2">
          {messages.length === 0 && (
            <div className="text-center py-20 animate-fade-in">
              <div className="mb-4 flex justify-center">
                <div className="p-6 rounded-full bg-gradient-primary shadow-glow">
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">Start a Conversation</h2>
              <p className="text-muted-foreground">
                Ask me anything! I'm here to help.
              </p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              isLatest={index === messages.length - 1}
              fileUrl={message.file_url}
              fileName={message.file_name}
              fileType={message.file_type}
            />
          ))}
          
          {loading && <TypingIndicator />}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput onSend={handleSendMessage} disabled={loading} />
    </div>
  );
};

export default Chat;
