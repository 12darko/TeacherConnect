import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { SendIcon, Sparkles, Loader2, Bot, BookOpen, Clock, Trash2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: Date;
  messages: Message[];
}

// Mock AI tutor responses for different subjects
const subjectResponses: Record<string, string[]> = {
  math: [
    "In mathematics, it's helpful to break down complex problems into smaller, more manageable steps.",
    "Let me explain this mathematical concept in a different way to make it clearer...",
    "Think of this equation as a balance scale. Whatever you do to one side, you must do to the other to maintain the equality.",
    "Visualizing this problem might help. Let's try to draw it out.",
    "This is a common misconception in math. What's actually happening is..."
  ],
  science: [
    "In science, we form hypotheses based on observations and then test them through experiments.",
    "This scientific principle can be observed in everyday life when you notice...",
    "Let's analyze this step by step using the scientific method.",
    "The relationship between these variables can be understood through this analogy...",
    "Scientists are still researching aspects of this topic, but current evidence suggests..."
  ],
  history: [
    "Historical events should always be considered in their proper context.",
    "This historical period was significantly influenced by several factors, including...",
    "Primary sources from this era tell us that...",
    "Historians have different interpretations of this event. Some argue that...",
    "To understand this historical development, we need to consider the social, economic, and political factors at play."
  ],
  literature: [
    "This author often uses specific literary devices to convey deeper themes.",
    "Let's analyze the symbolism in this passage and what it might represent.",
    "The character's development throughout the story shows...",
    "When interpreting literature, it's important to consider both the text itself and its historical context.",
    "This narrative structure serves to emphasize the author's message about..."
  ],
  language: [
    "This grammatical rule exists because...",
    "In language learning, pattern recognition is key. Notice how these examples follow a similar structure...",
    "Let's break down the components of this sentence to understand its structure.",
    "The etymology of this word reveals its fascinating origins...",
    "Language is constantly evolving. This term has changed its meaning over time..."
  ]
};

export default function AITutor() {
  const [currentTab, setCurrentTab] = useState("chat");
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState("");
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("math");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Fetch user's saved chat sessions
  const { data: savedSessions } = useQuery({
    queryKey: ['/api/ai-tutor/sessions', user?.id],
    enabled: !!user?.id && isAuthenticated,
    // In a real app, this would fetch from an API
    queryFn: async () => {
      // Mock response
      return [];
    },
  });

  // Scroll to bottom of messages on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeSession?.messages]);

  // Initialize a session if none exists
  useEffect(() => {
    if (!activeSession && chatSessions.length === 0) {
      createNewSession();
    }
  }, []);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Conversation",
      updatedAt: new Date(),
      messages: []
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || !activeSession) return;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date()
    };

    // Update active session with user message
    const updatedSession = {
      ...activeSession,
      updatedAt: new Date(),
      messages: [...activeSession.messages, userMessage],
      title: activeSession.messages.length === 0 ? generateTitle(message) : activeSession.title
    };

    // Update state
    setActiveSession(updatedSession);
    setChatSessions(prev => 
      prev.map(s => s.id === updatedSession.id ? updatedSession : s)
    );
    setMessage("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      // Get random response for selected subject
      const responses = subjectResponses[selectedSubject] || subjectResponses.math;
      const aiResponse = responses[Math.floor(Math.random() * responses.length)];

      // Create AI message
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date()
      };

      // Update session with AI response
      const sessionWithResponse = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage]
      };

      setActiveSession(sessionWithResponse);
      setChatSessions(prev => 
        prev.map(s => s.id === sessionWithResponse.id ? sessionWithResponse : s)
      );
      setIsLoading(false);
    }, 1500);
  };

  const handleDeleteSession = (sessionId: string) => {
    const remainingSessions = chatSessions.filter(s => s.id !== sessionId);
    setChatSessions(remainingSessions);
    
    if (activeSession?.id === sessionId) {
      setActiveSession(remainingSessions[0] || null);
      
      if (remainingSessions.length === 0) {
        createNewSession();
      }
    }
  };

  // Generate a title based on the first message
  const generateTitle = (firstMessage: string) => {
    const words = firstMessage.split(" ");
    const title = words.slice(0, 3).join(" ") + (words.length > 3 ? "..." : "");
    return title;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-1">AI Tutor</h1>
          <p className="text-neutral-medium">Get instant help with your studies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Study Sessions</CardTitle>
              <CardDescription>Your AI tutor conversations</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100vh-300px)] overflow-hidden">
              <Button 
                className="w-full mb-4"
                onClick={createNewSession}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                New Conversation
              </Button>

              <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="chat" className="flex-1">Chats</TabsTrigger>
                  <TabsTrigger value="subjects" className="flex-1">Subjects</TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="flex-grow overflow-y-auto">
                  {chatSessions.length > 0 ? (
                    <div className="space-y-2">
                      {chatSessions.map((session) => (
                        <div 
                          key={session.id} 
                          className={`flex justify-between items-center p-3 rounded-md cursor-pointer hover:bg-neutral-100 ${
                            activeSession?.id === session.id ? "bg-neutral-100" : ""
                          }`}
                          onClick={() => setActiveSession(session)}
                        >
                          <div className="overflow-hidden">
                            <div className="font-medium truncate">{session.title}</div>
                            <div className="text-xs text-neutral-medium">
                              {session.updatedAt.toLocaleDateString()}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="opacity-50 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-medium">
                      <Bot className="mx-auto h-12 w-12 text-neutral-300 mb-2" />
                      <p>No conversations yet</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="subjects" className="flex-grow overflow-y-auto">
                  <div className="space-y-2">
                    {Object.keys(subjectResponses).map((subject) => (
                      <div 
                        key={subject} 
                        className={`flex items-center p-3 rounded-md cursor-pointer hover:bg-neutral-100 ${
                          selectedSubject === subject ? "bg-neutral-100" : ""
                        }`}
                        onClick={() => setSelectedSubject(subject)}
                      >
                        <div className="bg-primary/10 text-primary p-2 rounded-full mr-3">
                          {subject === "math" && <span className="material-icons text-sm">calculate</span>}
                          {subject === "science" && <span className="material-icons text-sm">science</span>}
                          {subject === "history" && <span className="material-icons text-sm">history_edu</span>}
                          {subject === "literature" && <BookOpen className="h-4 w-4" />}
                          {subject === "language" && <span className="material-icons text-sm">translate</span>}
                        </div>
                        <div className="font-medium capitalize">{subject}</div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {activeSession?.title || "New Conversation"}
                  </CardTitle>
                  <CardDescription>
                    AI Tutor - <span className="capitalize">{selectedSubject}</span> Specialist
                  </CardDescription>
                </div>
                <div className="text-xs text-neutral-medium flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Responses typically within seconds
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col h-[calc(100vh-300px)]">
                <div className="flex-grow p-4 overflow-y-auto bg-neutral-50">
                  {activeSession && activeSession.messages.length > 0 ? (
                    <div className="space-y-4">
                      {activeSession.messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div 
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.role === "user" 
                                ? "bg-primary text-white" 
                                : "bg-white border"
                            }`}
                          >
                            <div className="mb-1 text-xs opacity-70 flex justify-between">
                              <span>{msg.role === "user" ? "You" : "AI Tutor"}</span>
                              <span>
                                {msg.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-lg px-4 py-2 bg-white border">
                            <div className="flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">AI Tutor is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <Sparkles className="h-12 w-12 text-primary mb-4" />
                      <h3 className="text-lg font-medium mb-2">Ask me anything!</h3>
                      <p className="text-neutral-medium max-w-md">
                        I'm your AI tutor specialized in <span className="capitalize">{selectedSubject}</span>. 
                        Ask questions, seek clarification, or get help with homework.
                      </p>
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg">
                        <Button 
                          variant="outline" 
                          className="justify-start text-left"
                          onClick={() => {
                            setMessage("Can you explain the concept of derivatives in calculus?");
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                        >
                          Explain derivatives in calculus
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start text-left"
                          onClick={() => {
                            setMessage("How do I solve this equation: 2x + 5 = 13?");
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                        >
                          Help with equation: 2x + 5 = 13
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Message Input */}
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask your question..."
                      className="flex-grow"
                      disabled={isLoading}
                    />
                    <Button 
                      type="submit" 
                      disabled={!message.trim() || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SendIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                  <div className="mt-2 text-xs text-neutral-medium text-center">
                    AI responses are generated and may not always be accurate. 
                    Verify information with your teacher.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}