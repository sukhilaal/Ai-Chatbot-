import { Bot } from "lucide-react";

const TypingIndicator = () => {
  return (
    <div className="flex gap-3 p-4 animate-slide-up">
      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-message-ai shadow-card">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-foreground/40 animate-typing" />
          <div className="w-2 h-2 rounded-full bg-foreground/40 animate-typing" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 rounded-full bg-foreground/40 animate-typing" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
