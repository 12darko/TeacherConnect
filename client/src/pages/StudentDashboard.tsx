import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { CalendarIcon, GraduationCapIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ArrowUpRightIcon } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

export default function StudentDashboard() {
  const [, params] = useLocation();
  const urlParams = new URLSearchParams(params);
  const initialTab = urlParams.get("tab") || "upcoming";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user } = useAuth();
  
  // Fetch student sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['/api/sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/sessions?studentId=${user.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return res.json();
    },
    enabled: !!user?.id,
  });
  
  // Fetch student assignments
  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['/api/exam-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/exam-assignments?studentId=${user.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch assignments');
      return res.json();
    },
    enabled: !!user?.id,
  });
  
  // Fetch student stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/student-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/student-stats/${user.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: !!user?.id,
  });
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-4">Please Log In</h2>
        <p className="text-neutral-medium mb-6">You need to log in to access your student dashboard.</p>
        <Link href="/login">
          <Button size="lg">Log In</Button>
        </Link>
      </div>
    );
  }
  
  if (user.role !== "student") {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-4">Teacher Account Detected</h2>
        <p className="text-neutral-medium mb-6">This dashboard is for students. Please go to the teacher dashboard.</p>
        <Link href="/teacher-dashboard">
          <Button size="lg">Go to Teacher Dashboard</Button>
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
  
  // Filter assignments
  const pendingAssignments = assignments.filter((assignment: any) => !assignment.completed);
  const completedAssignments = assignments.filter((assignment: any) => assignment.completed);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-1">Student Dashboard</h1>
          <p className="text-neutral-medium">Welcome back, {user.firstName || 'Student'}!</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/find-teachers">
            <Button>
              Find Teachers
            </Button>
          </Link>
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
                <p className="text-neutral-medium">Classes Attended</p>
                <h3 className="text-2xl font-semibold">
                  {isLoadingStats ? '...' : stats?.totalSessionsAttended || 0}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <GraduationCapIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-neutral-medium">Exams Completed</p>
                <h3 className="text-2xl font-semibold">
                  {isLoadingStats ? '...' : stats?.totalExamsCompleted || 0}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                <span className="material-icons text-yellow-600">grade</span>
              </div>
              <div>
                <p className="text-neutral-medium">Average Score</p>
                <h3 className="text-2xl font-semibold">
                  {isLoadingStats ? '...' : `${Math.round(stats?.averageExamScore || 0)}%`}
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
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
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
                              <span className="font-medium text-lg">{session.subjectName} with {session.teacherName}</span>
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
                                  Join Class
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
                  <p className="text-neutral-medium mb-4">You don't have any classes scheduled yet.</p>
                  <Link href="/find-teachers">
                    <Button>Find a Teacher</Button>
                  </Link>
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
                            <span className="font-medium text-lg">{session.subjectName} with {session.teacherName}</span>
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
                        <div className="mt-4 sm:mt-0">
                          {session.status === 'completed' && (
                            <Button variant="outline" size="sm">
                              Leave Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-icons text-neutral-medium text-5xl mb-4">history</span>
                  <h3 className="text-xl font-medium mb-2">No Past Sessions</h3>
                  <p className="text-neutral-medium">You haven't attended any classes yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>Exams and assignments from your teachers</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAssignments ? (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-neutral-medium">Loading assignments...</p>
                </div>
              ) : pendingAssignments.length > 0 || completedAssignments.length > 0 ? (
                <div className="space-y-6">
                  {pendingAssignments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Pending</h3>
                      <div className="space-y-4">
                        {pendingAssignments.map((assignment: any) => (
                          <div key={assignment.id} className="border rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h4 className="font-medium text-lg">{assignment.examTitle}</h4>
                                <div className="text-neutral-medium flex items-center mt-1">
                                  {assignment.dueDate && (
                                    <>
                                      <ClockIcon className="h-4 w-4 mr-1" />
                                      Due: {format(new Date(assignment.dueDate), "MMMM d, yyyy")}
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="mt-4 sm:mt-0">
                                <Link href={`/exam/${assignment.id}`}>
                                  <Button>
                                    Start Exam
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {completedAssignments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Completed</h3>
                      <div className="space-y-4">
                        {completedAssignments.map((assignment: any) => (
                          <div key={assignment.id} className="border rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h4 className="font-medium text-lg">{assignment.examTitle}</h4>
                                <div className="flex items-center mt-1">
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                    Score: {assignment.score}%
                                  </Badge>
                                  <span className="text-neutral-medium ml-2">
                                    Submitted: {format(new Date(assignment.submittedAt), "MMM d, yyyy")}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-4 sm:mt-0">
                                <Link href={`/exam/${assignment.id}/results`}>
                                  <Button variant="outline" size="sm">
                                    View Results
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-icons text-neutral-medium text-5xl mb-4">assignment</span>
                  <h3 className="text-xl font-medium mb-2">No Assignments</h3>
                  <p className="text-neutral-medium">You don't have any assignments yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>My Progress</CardTitle>
              <CardDescription>Track your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-neutral-medium">Loading stats...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Performance Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <CalendarIcon className="h-5 w-5 text-primary mr-2" />
                          <span className="font-medium">Sessions Attended</span>
                        </div>
                        <p className="text-2xl font-semibold">{stats?.totalSessionsAttended || 0}</p>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <GraduationCapIcon className="h-5 w-5 text-primary mr-2" />
                          <span className="font-medium">Exams Completed</span>
                        </div>
                        <p className="text-2xl font-semibold">{stats?.totalExamsCompleted || 0}</p>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <span className="material-icons text-primary mr-2">grade</span>
                          <span className="font-medium">Average Score</span>
                        </div>
                        <p className="text-2xl font-semibold">{Math.round(stats?.averageExamScore || 0)}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Progress Breakdown</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Sessions Completion</span>
                          <span className="text-sm text-neutral-medium">
                            {stats?.totalSessionsAttended || 0} / 20
                          </span>
                        </div>
                        <Progress value={(stats?.totalSessionsAttended || 0) * 5} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Exam Performance</span>
                          <span className="text-sm text-neutral-medium">
                            {Math.round(stats?.averageExamScore || 0)}%
                          </span>
                        </div>
                        <Progress value={stats?.averageExamScore || 0} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Overall Progress</span>
                          <span className="text-sm text-neutral-medium">
                            {Math.round(((stats?.totalSessionsAttended || 0) * 5 + (stats?.averageExamScore || 0)) / 2)}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.round(((stats?.totalSessionsAttended || 0) * 5 + (stats?.averageExamScore || 0)) / 2)} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                    {stats?.lastActivity ? (
                      <div className="border rounded-lg p-4">
                        <p className="text-neutral-medium">
                          Last activity: {format(new Date(stats.lastActivity), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    ) : (
                      <p className="text-neutral-medium">No recent activity</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
