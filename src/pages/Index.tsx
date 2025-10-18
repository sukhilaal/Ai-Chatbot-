import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Shield, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center animate-fade-in">
        <div className="mb-8 flex justify-center">
          <div className="p-6 rounded-full bg-gradient-primary shadow-glow">
            <Sparkles className="w-16 h-16 text-white" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
          AI Chat Assistant
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Experience the power of AI conversation. Get instant answers, creative ideas, 
          and helpful insights powered by Google's Gemini 2.5 Flash.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            size="lg"
            className="text-lg px-8 bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
            onClick={() => navigate("/auth")}
          >
            Get Started
            <Sparkles className="ml-2 w-5 h-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="p-6 rounded-xl bg-secondary/50 border border-border/50 backdrop-blur-sm">
            <MessageSquare className="w-10 h-10 mb-4 mx-auto text-primary" />
            <h3 className="font-semibold mb-2">Natural Conversations</h3>
            <p className="text-sm text-muted-foreground">
              Chat naturally with AI that understands context and remembers your conversation
            </p>
          </div>

          <div className="p-6 rounded-xl bg-secondary/50 border border-border/50 backdrop-blur-sm">
            <Shield className="w-10 h-10 mb-4 mx-auto text-primary" />
            <h3 className="font-semibold mb-2">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">
              Your conversations are encrypted and stored securely with user authentication
            </p>
          </div>

          <div className="p-6 rounded-xl bg-secondary/50 border border-border/50 backdrop-blur-sm">
            <Zap className="w-10 h-10 mb-4 mx-auto text-primary" />
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Powered by Gemini 2.5 Flash for instant, intelligent responses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
