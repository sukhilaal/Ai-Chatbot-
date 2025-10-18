import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";

const messageSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message too long"),
});

interface ChatInputProps {
  onSend: (message: string, file?: File) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Only accept PDFs
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are supported");
        return;
      }
      
      // Check file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File size must be less than 20MB");
        return;
      }
      
      setSelectedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
    noClick: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedFile) {
        // Send file without message validation
        onSend(message || `Analyze this PDF: ${selectedFile.name}`, selectedFile);
        setMessage("");
        setSelectedFile(null);
        return;
      }
      
      const validated = messageSchema.parse({ message });
      onSend(validated.message);
      setMessage("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto space-y-2">
        {selectedFile && (
          <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
            <Paperclip className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message, paste a YouTube link, or attach a PDF..."
              disabled={disabled}
              className="min-h-[60px] max-h-[200px] resize-none focus-visible:ring-primary pr-12"
              rows={2}
            />
            <div {...getRootProps()} className="absolute right-2 bottom-2">
              <input {...getInputProps()} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${isDragActive ? "bg-accent" : ""}`}
                disabled={disabled}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={disabled || (!message.trim() && !selectedFile)}
            className="h-[60px] bg-gradient-primary hover:opacity-90 transition-opacity self-end"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
