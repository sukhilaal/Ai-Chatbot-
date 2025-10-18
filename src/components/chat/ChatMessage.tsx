import { Bot, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLatest?: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
}

const ChatMessage = ({ role, content, isLatest, fileUrl, fileName, fileType }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 p-4 animate-slide-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 shadow-card space-y-2",
          isUser
            ? "bg-gradient-message-user text-white"
            : "bg-gradient-message-ai text-foreground"
        )}
      >
        {fileUrl && fileName && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg transition-colors",
              isUser
                ? "bg-white/20 hover:bg-white/30"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm truncate">{fileName}</span>
          </a>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </p>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-accent-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
