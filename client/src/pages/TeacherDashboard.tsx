import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, ClockIcon, UsersIcon, DollarSignIcon, PlusCircleIcon, ArrowUpRightIcon } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

// Form schema for creating an exam
const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  questions: z.array(
    z.object({
      id: z.number(),
      question: z.string().min(1, "Question is required"),
      type: z.enum(["multiple-choice", "text"]),
      options: z.array(z.string()).optional(),
      correctAnswer: z.union([z.string(), z.number()]),
      points: z.number().min(1),
    })
  ).min(1, "At least one question is required"),
});

export default function TeacherDashboard() {
  const [, params] = useLocation();
  const urlParams = new URLSearchParams(params);
  const initialTab = urlParams.get("tab") || "upcoming";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Dialogs state
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  
  // Forms state
  const [questions, setQuestions] = useState([
    { id: 1, question: "", type: "multiple-choice", options: ["", "", "", ""], correctAnswer: 0, points: 10 }
  ]);
  
  const examForm = useForm<z.infer<typeof examSchema>>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      description: "",
      subjectId: "",
      questions,
    },
  });
  
  // Fetch teacher sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['/api/sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/sessions?teacherId=${user.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return res.json();
    },
    enabled: !!user?.id,
  });
  
  // Fetch teacher exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ['/api/exams', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/exams?teacherId=${user.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch exams');
      return res.json();
    },
    enabled: !!user?.id,
  });
  
  // Fetch teacher profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/teachers/', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/teachers/${user.id}`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch teacher profile');
      }
      return res.json();
    },
    enabled: !!user?.id,
  });
  
  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
  });
  
  // Create exam mutation
  const createExam = useMutation({
    mutationFn: async (examData: any) => {
      const response = await apiRequest("POST", "/api/exams", examData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams', user?.id] });
      toast({
        title: "Exam created",
        description: "Your exam has been successfully created.",
      });
      setIsExamDialogOpen(false);
      examForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create exam",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  const handleCreateExam = (data: z.infer<typeof examSchema>) => {
    if (!user) return;
    
    createExam.mutate({
      teacherId: user.id,
      subjectId: parseInt(data.subjectId),
      title: data.title,
      description: data.description,
      questions: data.questions,
    });
  };
  
  const addQuestion = () => {
    const newQuestion = {
      id: questions.length + 1,
      question: "",
      type: "multiple-choice" as const,
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 10,
    };
    
    setQuestions([...questions, newQuestion]);
    const currentQuestions = examForm.getValues("questions") || [];
    examForm.setValue("questions", [...currentQuestions, newQuestion]);
  };
  
  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
    examForm.setValue("questions", newQuestions);
  };
  
  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options![optionIndex] = value;
    setQuestions(newQuestions);
    examForm.setValue("questions", newQuestions);
  };
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-4">Please Log In</h2>
        <p className="text-neutral-medium mb-6">You need to log in to access your teacher dashboard.</p>
        <Link href="/login">
          <Button size="lg">Log In</Button>
        </Link>
      </div>
    );
  }
  
  if (user.role !== "teacher") {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-4">Student Account Detected</h2>
        <p className="text-neutral-medium mb-6">This dashboard is for teachers. Please go to the student dashboard.</p>
        <Link href="/student-dashboard">
          <Button size="lg">Go to Student Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  // Filter sessions
  const upcomingSessions = sessions.filter((session: any) => 
    !isPast(new Date(session.startTime)) && session.status !== 'cancelled'
  );
  
  const pastSessions = sessions.filter((session: any) => 
    isPast(new Date(session.startTime)) || session.status === 'cancelled'
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-1">Teacher Dashboard</h1>
          <p className="text-neutral-medium">Welcome back, {user.name || user.username}!</p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-neutral-medium">Upcoming Classes</p>
                <h3 className="text-2xl font-semibold">
                  {isLoadingSessions ? '...' : upcomingSessions.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <UsersIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-neutral-medium">Total Students</p>
                <h3 className="text-2xl font-semibold">
                  {isLoadingProfile ? '...' : profile?.totalStudents || 0}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                <DollarSignIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-neutral-medium">Hourly Rate</p>
                <h3 className="text-2xl font-semibold">
                  {isLoadingProfile ? '...' : `$${profile?.hourlyRate || 0}`}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
          <TabsTrigger value="past">Session History</TabsTrigger>
          <TabsTrigger value="exams">Exams & Assignments</TabsTrigger>
          <TabsTrigger value="profile">Teacher Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Your scheduled classes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-neutral-medium">Loading sessions...</p>
                </div>
              ) : upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session: any) => {
                    const sessionDate = new Date(session.startTime);
                    const isSessionToday = isToday(sessionDate);
                    const isStartingSoon = isSessionToday && 
                      (new Date().getTime() - sessionDate.getTime()) < 1000 * 60 * 30; // 30 minutes
                      
                    return (
                      <div key={session.id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium text-lg">{session.subjectName} with {session.studentName}</span>
                              {isSessionToday && (
                                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-600">
                                  Today
                                </Badge>
                              )}
                            </div>
                            <div className="text-neutral-medium flex items-center mt-1">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {format(new Date(session.startTime), "MMMM d, yyyy")}
                              <span className="mx-2">•</span>
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}
                            </div>
                          </div>
                          <div className="mt-4 sm:mt-0">
                            {isStartingSoon ? (
                              <Link href={`/classroom/${session.id}`}>
                                <Button>
                                  Start Class
                                  <ArrowUpRightIcon className="ml-1 h-4 w-4" />
                                </Button>
                              </Link>
                            ) : (
                              <Button variant="outline" disabled>Starts {format(sessionDate, "MMM d 'at' h:mm a")}</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-icons text-neutral-medium text-5xl mb-4">event_busy</span>
                  <h3 className="text-xl font-medium mb-2">No Upcoming Sessions</h3>
                  <p className="text-neutral-medium">You don't have any classes scheduled yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>Your past classes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-neutral-medium">Loading sessions...</p>
                </div>
              ) : pastSessions.length > 0 ? (
                <div className="space-y-4">
                  {pastSessions.map((session: any) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium text-lg">{session.subjectName} with {session.studentName}</span>
                            <Badge 
                              variant="outline" 
                              className={
                                session.status === 'completed' 
                                  ? 'ml-2 bg-green-50 text-green-600' 
                                  : 'ml-2 bg-red-50 text-red-600'
                              }
                            >
                              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="text-neutral-medium flex items-center mt-1">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {format(new Date(session.startTime), "MMMM d, yyyy")}
                            <span className="mx-2">•</span>
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-icons text-neutral-medium text-5xl mb-4">history</span>
                  <h3 className="text-xl font-medium mb-2">No Past Sessions</h3>
                  <p className="text-neutral-medium">You haven't taught any classes yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="exams">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Exams & Assignments</CardTitle>
                <CardDescription>Create and manage exams for your students</CardDescription>
              </div>
              <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                    Create Exam
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Exam</DialogTitle>
                    <DialogDescription>
                      Create an exam to assign to your students.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...examForm}>
                    <form onSubmit={examForm.handleSubmit(handleCreateExam)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={examForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exam Title</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Algebra Midterm" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={examForm.control}
                          name="subjectId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a subject" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {subjects.map((subject: any) => (
                                    <SelectItem key={subject.id} value={subject.id.toString()}>
                                      {subject.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={examForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter a description of the exam" 
                                className="resize-none" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Questions</h3>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={addQuestion}
                          >
                            Add Question
                          </Button>
                        </div>
                        
                        {questions.map((question, index) => (
                          <div key={index} className="border rounded-lg p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Question {index + 1}</h4>
                              <div className="flex items-center gap-2">
                                <Select 
                                  value={question.type} 
                                  onValueChange={(value) => updateQuestion(index, 'type', value)}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Question Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                    <SelectItem value="text">Text Answer</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Input 
                                  type="number" 
                                  className="w-20" 
                                  placeholder="Points" 
                                  value={question.points} 
                                  onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value))} 
                                />
                              </div>
                            </div>
                            
                            <Input 
                              placeholder="Enter your question" 
                              value={question.question} 
                              onChange={(e) => updateQuestion(index, 'question', e.target.value)} 
                            />
                            
                            {question.type === 'multiple-choice' && (
                              <div className="space-y-2">
                                <h5 className="text-sm font-medium">Options</h5>
                                {question.options?.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex gap-2 items-center">
                                    <Input 
                                      placeholder={`Option ${optionIndex + 1}`} 
                                      value={option} 
                                      onChange={(e) => updateOption(index, optionIndex, e.target.value)} 
                                    />
                                    <Button 
                                      type="button" 
                                      variant={question.correctAnswer === optionIndex ? "default" : "outline"} 
                                      className="w-24"
                                      onClick={() => updateQuestion(index, 'correctAnswer', optionIndex)}
                                    >
                                      {question.correctAnswer === optionIndex ? "Correct" : "Set Correct"}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {question.type === 'text' && (
                              <div className="space-y-2">
                                <h5 className="text-sm font-medium">Correct Answer</h5>
                                <Input 
                                  placeholder="Enter the correct answer" 
                                  value={question.correctAnswer} 
                                  onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)} 
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsExamDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createExam.isPending}>
                          {createExam.isPending ? "Creating..." : "Create Exam"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingExams ? (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-neutral-medium">Loading exams...</p>
                </div>
              ) : exams.length > 0 ? (
                <div className="space-y-4">
                  {exams.map((exam: any) => (
                    <div key={exam.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-medium">{exam.title}</h3>
                          <p className="text-neutral-medium">{exam.subjectName}</p>
                          <div className="flex items-center mt-1">
                            <Badge variant="outline" className="mr-2">
                              {exam.questions.length} Questions
                            </Badge>
                            <span className="text-sm text-neutral-medium">
                              Created: {format(new Date(exam.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        <div className="flex mt-4 md:mt-0 gap-2">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                          <Button size="sm">
                            Assign to Students
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-icons text-neutral-medium text-5xl mb-4">assignment</span>
                  <h3 className="text-xl font-medium mb-2">No Exams Created</h3>
                  <p className="text-neutral-medium mb-4">Create your first exam to assign to students.</p>
                  <Button onClick={() => setIsExamDialogOpen(true)}>
                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                    Create Exam
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Profile</CardTitle>
              <CardDescription>Manage your teaching profile</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProfile ? (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-neutral-medium">Loading profile...</p>
                </div>
              ) : profile ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/3">
                      {profile.profileImage ? (
                        <img 
                          src={profile.profileImage} 
                          alt={profile.name} 
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-primary rounded-lg flex items-center justify-center text-white text-6xl">
                          {profile.name?.substring(0, 2)}
                        </div>
                      )}
                    </div>
                    
                    <div className="md:w-2/3 space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-medium">Name</h3>
                        <p className="text-lg">{profile.name}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-neutral-medium">Email</h3>
                        <p className="text-lg">{profile.email}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-neutral-medium">Bio</h3>
                        <p className="text-lg whitespace-pre-line">{profile.bio || "No bio available"}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-neutral-medium">Subjects</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {profile.subjects?.map((subject: any) => (
                            <Badge key={subject.id} variant="secondary" className="text-sm py-1">
                              <span className="material-icons text-primary text-sm mr-1">{subject.icon}</span>
                              {subject.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-neutral-medium">Hourly Rate</h3>
                        <p className="text-lg">${profile.hourlyRate}/hour</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-neutral-medium">Experience</h3>
                        <p className="text-lg">{profile.yearsOfExperience} years</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Weekly Availability</h3>
                    {profile.availability && profile.availability.length > 0 ? (
                      <div className="space-y-2">
                        {profile.availability.map((day: any, index: number) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b">
                            <div className="font-medium">{day.day}</div>
                            <div className="flex items-center text-neutral-medium">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {day.startTime} - {day.endTime}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-medium">No availability information provided.</p>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <Button>Edit Profile</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-icons text-neutral-medium text-5xl mb-4">account_circle</span>
                  <h3 className="text-xl font-medium mb-2">Complete Your Profile</h3>
                  <p className="text-neutral-medium mb-4">Set up your teacher profile to start finding students.</p>
                  <Button>Create Teacher Profile</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
