import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ClockIcon, ArrowLeftIcon, CheckIcon, AlertCircleIcon } from "lucide-react";
import { format } from "date-fns";

export default function TakeExam() {
  const [, params] = useRoute("/exam/:id");
  const assignmentId = parseInt(params?.id || "0");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isStudent } = useAuth();
  const { toast } = useToast();
  
  // State for the exam
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Array<{ questionId: number; answer: string | number }>>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  
  // Fetch exam assignment
  const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: [`/api/exam-assignments/${assignmentId}`],
    enabled: !!assignmentId,
  });
  
  // Fetch exam details
  const { data: exam, isLoading: isLoadingExam } = useQuery({
    queryKey: [`/api/exams/${assignment?.examId}`],
    enabled: !!assignment?.examId,
  });
  
  // Initialize answers when exam is loaded
  useEffect(() => {
    if (exam && exam.questions && !answers.length) {
      setAnswers(
        exam.questions.map((q: any) => ({
          questionId: q.id,
          answer: q.type === "multiple-choice" ? "" : "",
        }))
      );
    }
  }, [exam, answers.length]);
  
  // Timer logic for exams with due dates
  useEffect(() => {
    if (assignment?.dueDate) {
      const dueDate = new Date(assignment.dueDate);
      const now = new Date();
      
      if (dueDate > now) {
        const remainingMs = dueDate.getTime() - now.getTime();
        setTimeRemaining(Math.floor(remainingMs / 1000));
        
        const timer = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(timer);
              // Auto-submit when time is up
              if (!isSubmitting && !examCompleted) {
                handleSubmitExam();
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(timer);
      } else {
        setTimeRemaining(0);
      }
    }
  }, [assignment]);
  
  // Format the remaining time
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--:--";
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  // Handle answer changes
  const handleAnswerChange = (answer: string | number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion].answer = answer;
    setAnswers(newAnswers);
  };
  
  // Navigate to the next question
  const goToNextQuestion = () => {
    if (currentQuestion < (exam?.questions?.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  // Navigate to the previous question
  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  // Calculate exam progress
  const calculateProgress = () => {
    const answeredCount = answers.filter(a => a.answer !== "").length;
    return Math.round((answeredCount / answers.length) * 100);
  };
  
  // Submit exam mutation
  const submitExam = useMutation({
    mutationFn: async (data: { answers: Array<{ questionId: number; answer: string | number }> }) => {
      const response = await apiRequest("POST", `/api/exam-assignments/${assignmentId}/submit`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setExamCompleted(true);
      toast({
        title: "Exam submitted",
        description: `Your exam has been submitted. You scored ${data.score}%.`,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/exam-assignments/${assignmentId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/exam-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-stats'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit exam",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  // Handle submit exam
  const handleSubmitExam = () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    submitExam.mutate({ answers });
  };
  
  // Show loading state
  if (isLoadingAssignment || isLoadingExam) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-neutral-medium">Loading exam...</p>
      </div>
    );
  }
  
  // Show not found state
  if (!assignment || !exam) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-2">Exam Not Found</h2>
        <p className="text-neutral-medium mb-4">The exam you're looking for could not be found.</p>
        <Button variant="outline" onClick={() => setLocation("/student-dashboard")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Go to Dashboard
        </Button>
      </div>
    );
  }
  
  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-4">Please Log In</h2>
        <p className="text-neutral-medium mb-6">You need to log in to take this exam.</p>
        <Button size="lg" onClick={() => setLocation("/login")}>Log In</Button>
      </div>
    );
  }
  
  // Check if student is assigned to this exam
  if (isStudent && assignment.studentId !== user?.id) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-2">Access Denied</h2>
        <p className="text-neutral-medium mb-4">You are not assigned to this exam.</p>
        <Button variant="outline" onClick={() => setLocation("/student-dashboard")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Go to Dashboard
        </Button>
      </div>
    );
  }
  
  // Check if exam is already completed
  if (assignment.completed || examCompleted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="rounded-full bg-green-100 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-heading font-semibold mb-2">Exam Completed</h2>
          <p className="text-neutral-medium mb-6">
            You have already completed this exam. Your score is {assignment.score !== null ? `${assignment.score}%` : "being calculated"}.
          </p>
          
          <Card>
            <CardHeader>
              <CardTitle>{exam.title}</CardTitle>
              <CardDescription>{exam.subjectName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-primary mb-2">
                {assignment.score !== null ? `${assignment.score}%` : "Score pending"}
              </div>
              
              <div className="text-sm text-neutral-medium">
                Submitted: {assignment.submittedAt ? format(new Date(assignment.submittedAt), "MMMM d, yyyy 'at' h:mm a") : "N/A"}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setLocation("/student-dashboard?tab=assignments")}>
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  // Check if exam due date has passed
  if (assignment.dueDate && new Date(assignment.dueDate) < new Date() && timeRemaining === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="rounded-full bg-red-100 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <AlertCircleIcon className="h-8 w-8 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-heading font-semibold mb-2">Exam Deadline Passed</h2>
        <p className="text-neutral-medium mb-4">
          The deadline for this exam has passed. Please contact your teacher for assistance.
        </p>
        
        <Button variant="outline" onClick={() => setLocation("/student-dashboard")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Go to Dashboard
        </Button>
      </div>
    );
  }
  
  // Render the exam
  const currentQuestionData = exam.questions[currentQuestion];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-semibold mb-1">{exam.title}</h1>
          <p className="text-neutral-medium">Subject: {exam.subjectName}</p>
        </div>
        
        {assignment.dueDate && (
          <div className="mt-4 md:mt-0 flex items-center bg-blue-50 text-blue-600 px-4 py-2 rounded-md">
            <ClockIcon className="h-5 w-5 mr-2" />
            <span>Time Remaining: {formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Question {currentQuestion + 1} of {exam.questions.length}</CardTitle>
                <span className="text-sm font-medium text-neutral-medium">
                  {currentQuestionData.points} {currentQuestionData.points === 1 ? "point" : "points"}
                </span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-lg mb-6">
                  {currentQuestionData.question}
                </div>
                
                {currentQuestionData.type === "multiple-choice" && (
                  <RadioGroup
                    value={answers[currentQuestion].answer.toString()}
                    onValueChange={(value) => handleAnswerChange(parseInt(value))}
                    className="space-y-3"
                  >
                    {currentQuestionData.options.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2 rounded-md border p-3">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-grow">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                
                {currentQuestionData.type === "text" && (
                  <Textarea
                    placeholder="Enter your answer here..."
                    value={answers[currentQuestion].answer.toString()}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    rows={5}
                    className="w-full"
                  />
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={goToPreviousQuestion} 
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              <Button 
                onClick={goToNextQuestion} 
                disabled={currentQuestion === exam.questions.length - 1}
              >
                Next
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Exam Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((_, index: number) => (
                  <Button
                    key={index}
                    variant={answers[index].answer !== "" ? "default" : "outline"}
                    className={`h-10 w-10 p-0 ${currentQuestion === index ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    onClick={() => setCurrentQuestion(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              
              <div className="mt-6">
                <div className="text-sm text-neutral-medium mb-2">
                  {calculateProgress()}% completed
                </div>
                <Progress value={calculateProgress()} />
              </div>
              
              <Button
                className="w-full mt-6"
                onClick={handleSubmitExam}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Exam"}
              </Button>
            </CardContent>
          </Card>
          
          {exam.description && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Exam Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{exam.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}