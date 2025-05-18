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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  Book, 
  Clock, 
  Calendar, 
  CheckCircle, 
  PlusCircle, 
  BarChart3,
  DollarSign
} from "lucide-react";

export default function TeacherDashboard() {
  const [, params] = useLocation();
  const urlParams = new URLSearchParams(params);
  const initialTab = urlParams.get("tab") || "overview";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Fetch teacher profile
  const { data: teacherProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: [`/api/teachers/by-user/${user?.id}`],
    enabled: !!user?.id,
  });
  
  // Fetch upcoming sessions
  const { data: upcomingSessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: [`/api/sessions?teacherId=${user?.id}&status=pending`],
    enabled: !!user?.id,
  });
  
  // Fetch created exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: [`/api/exams?teacherId=${user?.id}`],
    enabled: !!user?.id,
  });
  
  // Fetch reviews
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: [`/api/reviews?teacherId=${user?.id}`],
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
  if (isLoading || isLoadingProfile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-neutral-medium">Loading your dashboard...</p>
      </div>
    );
  }
  
  // Calculate some statistics
  const totalStudents = [...new Set(upcomingSessions.map((s: any) => s.studentId))].length;
  const totalEarnings = upcomingSessions
    .filter((s: any) => s.status === "completed")
    .reduce((total: number, session: any) => {
      const durationHours = 
        (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 
        (1000 * 60 * 60);
      return total + (durationHours * (teacherProfile?.hourlyRate || 0));
    }, 0);
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
    : 0;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-1">Teacher Dashboard</h1>
          <p className="text-neutral-medium">Welcome back, {user?.firstName || user?.email}</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link href="/create-exam">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 md:grid-cols-4 lg:w-[800px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Students Taught</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingSessions ? "..." : totalStudents}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-neutral-medium flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  Total unique students
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Teaching Hours</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingSessions ? "..." : upcomingSessions
                    .filter((s: any) => s.status === "completed")
                    .reduce((total: number, session: any) => {
                      const durationHours = 
                        (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 
                        (1000 * 60 * 60);
                      return total + durationHours;
                    }, 0).toFixed(1)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-neutral-medium flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  Total teaching time
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Created Exams</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingExams ? "..." : exams.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-neutral-medium flex items-center">
                  <Book className="mr-1 h-4 w-4" />
                  Total assessments created
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rating</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingReviews ? "..." : averageRating.toFixed(1)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-neutral-medium flex items-center">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  From {reviews.length} student reviews
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Your next scheduled teaching sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSessions ? (
                  <div className="text-center py-6">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-sm text-neutral-medium">Loading sessions...</p>
                  </div>
                ) : upcomingSessions.filter((s: any) => s.status === "pending" || s.status === "approved").length > 0 ? (
                  <div className="space-y-4">
                    {upcomingSessions
                      .filter((s: any) => s.status === "pending" || s.status === "approved")
                      .slice(0, 4)
                      .map((session: any) => (
                        <div key={session.id} className="flex items-start border-b pb-4">
                          <div className="bg-blue-100 text-blue-600 p-2 rounded-md mr-4">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-medium">{session.subjectName}</h4>
                              <Badge 
                                variant={session.status === "pending" ? "outline" : "default"}
                                className="capitalize"
                              >
                                {session.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-neutral-medium">with {session.studentName}</p>
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
                    <p className="text-sm text-neutral-medium mt-1">
                      Wait for students to book sessions with you.
                    </p>
                  </div>
                )}
              </CardContent>
              {upcomingSessions.filter((s: any) => s.status === "pending" || s.status === "approved").length > 0 && (
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("sessions")}>
                    View All Sessions
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Earnings</CardTitle>
                <CardDescription>Your earnings summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <DollarSign className="h-8 w-8 mx-auto text-primary mb-2" />
                  <div className="text-3xl font-bold mb-1">${totalEarnings.toFixed(2)}</div>
                  <p className="text-sm text-neutral-medium">Total earnings</p>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Current month</span>
                      <span className="font-medium">
                        ${upcomingSessions
                          .filter((s: any) => {
                            const sessionDate = new Date(s.startTime);
                            const now = new Date();
                            return s.status === "completed" && 
                              sessionDate.getMonth() === now.getMonth() && 
                              sessionDate.getFullYear() === now.getFullYear();
                          })
                          .reduce((total: number, session: any) => {
                            const durationHours = 
                              (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 
                              (1000 * 60 * 60);
                            return total + (durationHours * (teacherProfile?.hourlyRate || 0));
                          }, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Hourly rate</span>
                      <span className="font-medium">${teacherProfile?.hourlyRate || 0}/hr</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Teaching Sessions</CardTitle>
                  <CardDescription>Manage your teaching sessions</CardDescription>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                  <Badge variant="outline" className="cursor-pointer">All</Badge>
                  <Badge variant="outline" className="cursor-pointer">Pending</Badge>
                  <Badge variant="outline" className="cursor-pointer">Approved</Badge>
                  <Badge variant="outline" className="cursor-pointer">Completed</Badge>
                  <Badge variant="outline" className="cursor-pointer">Cancelled</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="text-center py-12">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-4 text-neutral-medium">Loading your sessions...</p>
                </div>
              ) : upcomingSessions.length > 0 ? (
                <div className="space-y-6">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b bg-neutral-50 text-sm">
                      <div className="col-span-2">Student & Subject</div>
                      <div className="col-span-1">Date & Time</div>
                      <div className="col-span-1">Duration</div>
                      <div className="col-span-1">Status</div>
                      <div className="col-span-1 text-right">Actions</div>
                    </div>
                    {upcomingSessions.map((session: any) => {
                      const startTime = new Date(session.startTime);
                      const endTime = new Date(session.endTime);
                      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                      
                      return (
                        <div key={session.id} className="grid grid-cols-6 gap-4 p-4 border-b items-center">
                          <div className="col-span-2">
                            <div className="font-medium">{session.studentName}</div>
                            <div className="text-sm text-neutral-medium">{session.subjectName}</div>
                          </div>
                          <div className="col-span-1">
                            <div className="text-sm">
                              {startTime.toLocaleDateString()}
                            </div>
                            <div className="text-sm text-neutral-medium">
                              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="col-span-1">
                            <div className="text-sm">
                              {durationHours.toFixed(1)} hours
                            </div>
                            <div className="text-sm text-neutral-medium">
                              ${(durationHours * (teacherProfile?.hourlyRate || 0)).toFixed(2)}
                            </div>
                          </div>
                          <div className="col-span-1">
                            <Badge 
                              variant={
                                session.status === "approved" ? "default" : 
                                session.status === "completed" ? "success" : 
                                session.status === "cancelled" ? "destructive" : "outline"
                              }
                              className="capitalize"
                            >
                              {session.status}
                            </Badge>
                          </div>
                          <div className="col-span-1 text-right space-x-2">
                            {session.status === "pending" && (
                              <>
                                <Button size="sm" variant="outline">
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
                                  Decline
                                </Button>
                              </>
                            )}
                            {session.status === "approved" && new Date() >= startTime && new Date() <= endTime && (
                              <Link href={`/classroom/${session.id}`}>
                                <Button size="sm">
                                  Join Now
                                </Button>
                              </Link>
                            )}
                            {session.status === "completed" && (
                              <Button size="sm" variant="outline" disabled>
                                Completed
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-neutral-50 rounded-lg">
                  <Calendar className="h-12 w-12 mx-auto text-neutral-400 mb-2" />
                  <h3 className="text-xl font-medium mb-2">No Sessions Yet</h3>
                  <p className="text-neutral-medium max-w-md mx-auto mb-6">
                    You don't have any teaching sessions yet. When students book sessions with you, they'll appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Exams Tab */}
        <TabsContent value="exams">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Your Exams</CardTitle>
                  <CardDescription>Create and manage your exam content</CardDescription>
                </div>
                <Link href="/create-exam">
                  <Button className="mt-4 md:mt-0">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Exam
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingExams ? (
                <div className="text-center py-12">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-4 text-neutral-medium">Loading your exams...</p>
                </div>
              ) : exams.length > 0 ? (
                <div className="space-y-6">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-7 gap-4 p-4 font-medium border-b bg-neutral-50 text-sm">
                      <div className="col-span-2">Exam Title</div>
                      <div className="col-span-1">Subject</div>
                      <div className="col-span-1">Questions</div>
                      <div className="col-span-1">Assigned To</div>
                      <div className="col-span-1">Created</div>
                      <div className="col-span-1 text-right">Actions</div>
                    </div>
                    {exams.map((exam: any) => (
                      <div key={exam.id} className="grid grid-cols-7 gap-4 p-4 border-b items-center">
                        <div className="col-span-2">
                          <div className="font-medium">{exam.title}</div>
                          <div className="text-sm text-neutral-medium truncate max-w-xs">
                            {exam.description || "No description"}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-sm">{exam.subjectName}</div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-sm">{exam.questions?.length || 0} questions</div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-sm">{exam.assignedCount || 0} students</div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-sm">
                            {new Date(exam.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="col-span-1 text-right space-x-2">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            Assign
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-neutral-50 rounded-lg">
                  <Book className="h-12 w-12 mx-auto text-neutral-400 mb-2" />
                  <h3 className="text-xl font-medium mb-2">No Exams Created Yet</h3>
                  <p className="text-neutral-medium max-w-md mx-auto mb-6">
                    Create your first exam to assess your students' knowledge. You can assign exams to specific students.
                  </p>
                  <Link href="/create-exam">
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Exam
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Student Reviews</CardTitle>
              <CardDescription>What your students say about you</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReviews ? (
                <div className="text-center py-12">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-4 text-neutral-medium">Loading your reviews...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Average Rating</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <div className="text-3xl font-bold text-primary mr-2">
                            {averageRating.toFixed(1)}
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`h-5 w-5 ${
                                  i < Math.round(averageRating)
                                    ? "text-yellow-400 fill-current"
                                    : "text-neutral-300"
                                }`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <div className="ml-2 text-sm text-neutral-medium">
                            from {reviews.length} reviews
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Rating Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = reviews.filter((r: any) => r.rating === rating).length;
                            const percentage = Math.round((count / reviews.length) * 100);
                            
                            return (
                              <div key={rating} className="flex items-center">
                                <div className="w-16 text-sm">{rating} stars</div>
                                <div className="flex-1 mx-2 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <div className="w-9 text-sm text-right">{percentage}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="border rounded-md divide-y">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="p-4">
                        <div className="flex justify-between mb-2">
                          <div className="font-medium">{review.studentName}</div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-neutral-300"
                                }`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-neutral-700 mb-2">{review.comment}</p>
                        <div className="text-sm text-neutral-medium">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-neutral-50 rounded-lg">
                  <BarChart3 className="h-12 w-12 mx-auto text-neutral-400 mb-2" />
                  <h3 className="text-xl font-medium mb-2">No Reviews Yet</h3>
                  <p className="text-neutral-medium max-w-md mx-auto">
                    Once students leave reviews after your sessions, they'll appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}