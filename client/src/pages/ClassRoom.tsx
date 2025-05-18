import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoCall } from "@/components/ui/video-call";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftIcon } from "lucide-react";
import { format } from "date-fns";

export default function ClassRoom() {
  const [, params] = useRoute("/classroom/:id");
  const sessionId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  
  // Fetch session details
  const { data: session, isLoading } = useQuery({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });
  
  // End session function
  const handleEndSession = async () => {
    try {
      if (!session) return;
      
      await apiRequest("PATCH", `/api/sessions/${sessionId}/status`, {
        status: "completed"
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sessions`] });
      
      setIsSessionEnded(true);
      
      toast({
        title: "Session ended",
        description: "The session has been successfully completed.",
      });
    } catch (error) {
      toast({
        title: "Error ending session",
        description: "There was a problem ending the session. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Check if user is authorized to join this session
  const isAuthorized = () => {
    if (!user || !session) return false;
    return user.id === session.teacherId || user.id === session.studentId;
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-neutral-medium">Loading classroom...</p>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-2">Session Not Found</h2>
        <p className="text-neutral-medium mb-4">The session you're looking for could not be found.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }
  
  if (!isAuthorized()) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-2">Unauthorized Access</h2>
        <p className="text-neutral-medium mb-4">You don't have permission to join this session.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }
  
  if (session.status === "cancelled") {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-2">Session Cancelled</h2>
        <p className="text-neutral-medium mb-4">This session has been cancelled.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }
  
  if (session.status === "completed" || isSessionEnded) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-2">Session Completed</h2>
        <p className="text-neutral-medium mb-4">This session has ended.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-semibold mb-1">
            {session.subjectName} Class
          </h1>
          <p className="text-neutral-medium">
            {user?.id === session.teacherId 
              ? `Session with ${session.studentName}`
              : `Session with ${session.teacherName}`
            }
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Exit
          </Button>
          {user?.id === session.teacherId && (
            <Button variant="destructive" onClick={handleEndSession}>
              End Session
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Video Call</CardTitle>
              <CardDescription>
                {format(new Date(session.startTime), "MMMM d, yyyy 'at' h:mm a")} - 
                {format(new Date(session.endTime), " h:mm a")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] p-4">
                <VideoCall 
                  sessionId={sessionId.toString()} 
                  teacherName={session.teacherName} 
                  studentName={session.studentName}
                  onEndCall={user?.id === session.teacherId ? handleEndSession : undefined}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-medium">Subject</h3>
                  <p className="text-lg">{session.subjectName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-medium">
                    {user?.id === session.teacherId ? "Student" : "Teacher"}
                  </h3>
                  <p className="text-lg">
                    {user?.id === session.teacherId ? session.studentName : session.teacherName}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-medium">Date</h3>
                  <p className="text-lg">{format(new Date(session.startTime), "MMMM d, yyyy")}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-medium">Time</h3>
                  <p className="text-lg">
                    {format(new Date(session.startTime), "h:mm a")} - 
                    {format(new Date(session.endTime), " h:mm a")}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-medium">Status</h3>
                  <p className="text-lg capitalize">{session.status}</p>
                </div>
              </div>
              
              {user?.id === session.teacherId && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-medium">Teacher Tools</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full" disabled>
                      <span className="material-icons mr-2">assignment</span>
                      Assign Exam
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      <span className="material-icons mr-2">description</span>
                      Share Notes
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      <span className="material-icons mr-2">send</span>
                      Send Resources
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      <span className="material-icons mr-2">assessment</span>
                      Record Progress
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
