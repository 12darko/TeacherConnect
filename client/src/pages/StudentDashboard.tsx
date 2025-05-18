import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { BadgeCheck, Book, Calendar, Clock, GraduationCap, Monitor, Users } from "lucide-react";

export default function StudentDashboard() {
  const [, params] = useLocation();
  const urlParams = new URLSearchParams(params);
  const initialTab = urlParams.get("tab") || "overview";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Fetch student stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: [`/api/student-stats/${user?.id}`],
    enabled: !!user?.id,
  });
  
  // Fetch upcoming sessions
  const { data: upcomingSessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: [`/api/sessions?studentId=${user?.id}&status=pending`],
    enabled: !!user?.id,
  });
  
  // Fetch exam assignments
  const { data: examAssignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: [`/api/exam-assignments?studentId=${user?.id}`],
    enabled: !!user?.id,
  });
  
  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-4">Access Denied</h2>
        <p className="text-neutral-medium mb-6">You need to log in to view your dashboard.</p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => window.location.href = "/api/login"}>Log In</Button>
          <Button size="lg" variant="outline" onClick={() => window.location.href = "/"}>Go to Homepage</Button>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-neutral-medium">Loading your dashboard...</p>
      </div>
    );
  }
  
  const pendingAssignmentCount = examAssignments.filter((assignment: any) => !assignment.completed).length;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-1">Student Dashboard</h1>
          <p className="text-neutral-medium">Welcome back, {user?.firstName || user?.email}</p>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 md:grid-cols-4 lg:w-[800px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="assignments">
            Assignments
            {pendingAssignmentCount > 0 && (
              <span className="ml-2 rounded-full bg-primary text-white text-xs px-2 py-0.5">
                {pendingAssignmentCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Sessions</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingStats ? "..." : stats?.totalSessions || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-neutral-medium flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  Sessions with teachers
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Hours Learning</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingStats ? "..." : stats?.totalHours || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-neutral-medium flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  Total learning time
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Exams Completed</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingStats ? "..." : stats?.examsCompleted || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-neutral-medium flex items-center">
                  <Book className="mr-1 h-4 w-4" />
                  Average score: {isLoadingStats ? "..." : `${stats?.averageScore || 0}%`}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Learning Streak</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingStats ? "..." : stats?.learningStreak || 0} days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-neutral-medium flex items-center">
                  <BadgeCheck className="mr-1 h-4 w-4" />
                  Last active: {isLoadingStats ? "..." : stats?.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : "Never"}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Your next scheduled learning sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSessions ? (
                  <div className="text-center py-6">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-sm text-neutral-medium">Loading sessions...</p>
                  </div>
                ) : upcomingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingSessions.slice(0, 3).map((session: any) => (
                      <div key={session.id} className="flex items-start border-b pb-4">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-md mr-4">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{session.subjectName}</h4>
                          <p className="text-sm text-neutral-medium">with {session.teacherName}</p>
                          <p className="text-sm text-neutral-medium mt-1">
                            {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-neutral-50 rounded-md">
                    <Calendar className="h-10 w-10 mx-auto text-neutral-400" />
                    <p className="mt-2 font-medium">No upcoming sessions</p>
                    <p className="text-sm text-neutral-medium mt-1 mb-4">Book a session with a teacher to get started.</p>
                    <Link href="/find-teachers">
                      <Button>Find a Teacher</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
              {upcomingSessions.length > 0 && (
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("sessions")}>
                    View All Sessions
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Assigned Exams</CardTitle>
                <CardDescription>Exams assigned to you by teachers</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAssignments ? (
                  <div className="text-center py-6">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-sm text-neutral-medium">Loading assignments...</p>
                  </div>
                ) : examAssignments.filter((a: any) => !a.completed).length > 0 ? (
                  <div className="space-y-4">
                    {examAssignments
                      .filter((a: any) => !a.completed)
                      .slice(0, 3)
                      .map((assignment: any) => (
                        <div key={assignment.id} className="flex items-start border-b pb-4">
                          <div className="bg-amber-100 text-amber-600 p-2 rounded-md mr-4">
                            <Book className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{assignment.examTitle}</h4>
                            <p className="text-sm text-neutral-medium">Assigned by {assignment.teacherName}</p>
                            {assignment.dueDate && (
                              <p className="text-sm text-neutral-medium mt-1">
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Link href={`/exam/${assignment.id}`}>
                            <Button size="sm">Start</Button>
                          </Link>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-neutral-50 rounded-md">
                    <Book className="h-10 w-10 mx-auto text-neutral-400" />
                    <p className="mt-2 font-medium">No pending exams</p>
                    <p className="text-sm text-neutral-medium mt-1">
                      You don't have any exams to complete right now.
                    </p>
                  </div>
                )}
              </CardContent>
              {examAssignments.filter((a: any) => !a.completed).length > 0 && (
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("assignments")}>
                    View All Assignments
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>
        
        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Learning Sessions</CardTitle>
                  <CardDescription>All your scheduled and past sessions</CardDescription>
                </div>
                <Link href="/find-teachers">
                  <Button>Book New Session</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="text-center py-12">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-4 text-neutral-medium">Loading your sessions...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Upcoming</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {upcomingSessions.length}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Completed</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {stats?.totalSessions || 0}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Total Hours</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {stats?.totalHours || 0}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="rounded-md border">
                    <div className="bg-neutral-50 p-4 border-b">
                      <h3 className="font-medium">Upcoming Sessions</h3>
                    </div>
                    {upcomingSessions.length > 0 ? (
                      <div className="divide-y">
                        {upcomingSessions.map((session: any) => (
                          <div key={session.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                              <h4 className="font-medium">{session.subjectName}</h4>
                              <p className="text-sm text-neutral-medium">with {session.teacherName}</p>
                              <p className="text-sm text-neutral-medium mt-1">
                                {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' to '}
                                {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="mt-3 md:mt-0 space-x-2">
                              {new Date(session.startTime) <= new Date() && session.status === "approved" && (
                                <Link href={`/classroom/${session.id}`}>
                                  <Button>Join Now</Button>
                                </Link>
                              )}
                              <Button variant="outline" disabled={session.status !== "pending"}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Calendar className="h-10 w-10 mx-auto text-neutral-400" />
                        <p className="mt-2 font-medium">No upcoming sessions</p>
                        <p className="text-sm text-neutral-medium mt-1 mb-4">Book a session with a teacher to get started.</p>
                        <Link href="/find-teachers">
                          <Button>Find a Teacher</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Your Assignments</CardTitle>
              <CardDescription>Exams and assignments from your teachers</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAssignments ? (
                <div className="text-center py-12">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-4 text-neutral-medium">Loading your assignments...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Pending</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {examAssignments.filter((a: any) => !a.completed).length}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Completed</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {examAssignments.filter((a: any) => a.completed).length}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Average Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {stats?.averageScore || 0}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="rounded-md border">
                    <div className="bg-neutral-50 p-4 border-b">
                      <h3 className="font-medium">Pending Assignments</h3>
                    </div>
                    {examAssignments.filter((a: any) => !a.completed).length > 0 ? (
                      <div className="divide-y">
                        {examAssignments
                          .filter((a: any) => !a.completed)
                          .map((assignment: any) => (
                            <div key={assignment.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                              <div>
                                <h4 className="font-medium">{assignment.examTitle}</h4>
                                <p className="text-sm text-neutral-medium">Assigned by {assignment.teacherName}</p>
                                {assignment.dueDate && (
                                  <p className="text-sm text-neutral-medium mt-1">
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="mt-3 md:mt-0">
                                <Link href={`/exam/${assignment.id}`}>
                                  <Button>Start Exam</Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <BadgeCheck className="h-10 w-10 mx-auto text-neutral-400" />
                        <p className="mt-2 font-medium">All caught up!</p>
                        <p className="text-sm text-neutral-medium mt-1">
                          You don't have any pending assignments.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="rounded-md border">
                    <div className="bg-neutral-50 p-4 border-b">
                      <h3 className="font-medium">Completed Assignments</h3>
                    </div>
                    {examAssignments.filter((a: any) => a.completed).length > 0 ? (
                      <div className="divide-y">
                        {examAssignments
                          .filter((a: any) => a.completed)
                          .map((assignment: any) => (
                            <div key={assignment.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                              <div>
                                <h4 className="font-medium">{assignment.examTitle}</h4>
                                <p className="text-sm text-neutral-medium">Assigned by {assignment.teacherName}</p>
                                <p className="text-sm text-neutral-medium mt-1">
                                  Submitted: {new Date(assignment.submittedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="mt-3 md:mt-0 flex items-center">
                                <div className="bg-green-100 text-green-600 rounded-full px-3 py-1 text-sm font-medium">
                                  Score: {assignment.score}%
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <GraduationCap className="h-10 w-10 mx-auto text-neutral-400" />
                        <p className="mt-2 font-medium">No completed assignments yet</p>
                        <p className="text-sm text-neutral-medium mt-1">
                          Complete your assignments to see your scores here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Progress Tab */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Your Learning Progress</CardTitle>
              <CardDescription>Track your learning journey and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="text-center py-12">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-4 text-neutral-medium">Loading your progress data...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Learning Hours</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-primary">
                          {stats?.totalHours || 0}
                        </p>
                        <p className="text-sm text-neutral-medium mt-1">
                          Total time spent learning
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Exam Average</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-primary">
                          {stats?.averageScore || 0}%
                        </p>
                        <p className="text-sm text-neutral-medium mt-1">
                          Average score across all exams
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Activity Streak</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-primary">
                          {stats?.learningStreak || 0} days
                        </p>
                        <p className="text-sm text-neutral-medium mt-1">
                          Consecutive days of learning
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Sessions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-primary">
                          {stats?.totalSessions || 0}
                        </p>
                        <p className="text-sm text-neutral-medium mt-1">
                          Total sessions attended
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="p-8 text-center bg-neutral-50 rounded-lg">
                    <Monitor className="h-12 w-12 mx-auto text-neutral-400 mb-2" />
                    <h3 className="text-xl font-medium mb-2">Detailed Analytics Coming Soon</h3>
                    <p className="text-neutral-medium max-w-lg mx-auto">
                      We're working on detailed progress analytics to help you visualize your learning journey. Check back soon for graphs, subject breakdowns, and more insights into your education.
                    </p>
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