import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TestimonialCard } from "@/components/TestimonialCard";
import { StarIcon, CheckIcon, CalendarIcon, GraduationCapIcon, ClockIcon, ArrowLeftIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function TeacherProfile() {
  const [, params] = useRoute("/teacher/:id");
  const teacherId = params?.id || "";
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isStudent } = useAuth();
  const { toast } = useToast();
  
  // States for session booking
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [sessionDate, setSessionDate] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState("");
  const [sessionEndTime, setSessionEndTime] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  
  // State for review form
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  
  // Fetch teacher profile
  const { data: teacherProfile, isLoading: isLoadingTeacher } = useQuery({
    queryKey: [`/api/teachers/${teacherId}`],
    enabled: !!teacherId,
  });
  
  // Fetch teacher reviews
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: [`/api/reviews?teacherId=${teacherId}`],
    enabled: !!teacherId,
  });
  
  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
  });
  
  // Book session mutation
  const bookSession = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/sessions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session booked",
        description: "Your session has been successfully booked.",
      });
      setIsBookingModalOpen(false);
      
      // Reset form
      setSelectedSubject(null);
      setSessionDate("");
      setSessionStartTime("");
      setSessionEndTime("");
      setSessionNotes("");
    },
    onError: (error) => {
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Submit review mutation
  const submitReview = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/reviews", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Your review has been submitted successfully.",
      });
      setIsReviewModalOpen(false);
      
      // Reset form
      setReviewRating(5);
      setReviewText("");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/reviews?teacherId=${teacherId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/teachers/${teacherId}`] });
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Handle booking session
  const handleBookSession = () => {
    if (!user || !isAuthenticated || !isStudent) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in as a student to book a session.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedSubject) {
      toast({
        title: "Subject required",
        description: "Please select a subject for the session.",
        variant: "destructive",
      });
      return;
    }
    
    if (!sessionDate || !sessionStartTime || !sessionEndTime) {
      toast({
        title: "Time details required",
        description: "Please provide the date and time for the session.",
        variant: "destructive",
      });
      return;
    }
    
    const startDateTime = new Date(`${sessionDate}T${sessionStartTime}`);
    const endDateTime = new Date(`${sessionDate}T${sessionEndTime}`);
    
    if (endDateTime <= startDateTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }
    
    bookSession.mutate({
      teacherId,
      studentId: user.id,
      subjectId: selectedSubject,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      notes: sessionNotes,
      status: "pending",
    });
  };
  
  // Handle submit review
  const handleSubmitReview = () => {
    if (!user || !isAuthenticated || !isStudent) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in as a student to submit a review.",
        variant: "destructive",
      });
      return;
    }
    
    if (!reviewText) {
      toast({
        title: "Review text required",
        description: "Please provide your feedback in the review.",
        variant: "destructive",
      });
      return;
    }
    
    submitReview.mutate({
      teacherId,
      studentId: user.id,
      rating: reviewRating,
      comment: reviewText,
    });
  };
  
  if (isLoadingTeacher) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-neutral-medium">Loading teacher profile...</p>
      </div>
    );
  }
  
  if (!teacherProfile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-2">Teacher Not Found</h2>
        <p className="text-neutral-medium mb-4">The teacher profile you're looking for could not be found.</p>
        <Button variant="outline" onClick={() => setLocation("/find-teachers")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Search
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="outline" 
        className="mb-6" 
        onClick={() => setLocation("/find-teachers")}
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Back to Search
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="h-32 w-32 rounded-full overflow-hidden mb-4">
                  <img 
                    src={teacherProfile.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherProfile.name)}&background=random`} 
                    alt={`${teacherProfile.name}'s profile`}
                    className="h-full w-full object-cover"
                  />
                </div>
                
                <h1 className="text-2xl font-heading font-semibold">{teacherProfile.name}</h1>
                
                <div className="flex items-center mt-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(teacherProfile.averageRating || 0)
                          ? "text-yellow-400 fill-current"
                          : "text-neutral-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-neutral-medium">
                    ({teacherProfile.totalReviews || 0} reviews)
                  </span>
                </div>
                
                <div className="text-center text-xl font-semibold text-primary mb-4">
                  ${teacherProfile.hourlyRate}/hr
                </div>
                
                {isAuthenticated && isStudent && (
                  <Button 
                    className="w-full mb-4" 
                    onClick={() => setIsBookingModalOpen(true)}
                  >
                    Book a Session
                  </Button>
                )}
                
                <div className="w-full border-t pt-4">
                  <h3 className="font-medium mb-2">Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {teacherProfile.subjectIds?.map((subjectId: number) => {
                      const subject = subjects.find((s: any) => s.id === subjectId);
                      return subject ? (
                        <div 
                          key={subjectId}
                          className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm"
                        >
                          {subject.name}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <GraduationCapIcon className="h-5 w-5 mr-3 text-neutral-medium mt-0.5" />
                  <div>
                    <h4 className="font-medium">Education</h4>
                    <p className="text-neutral-medium">{teacherProfile.education || "Not specified"}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 mr-3 text-neutral-medium mt-0.5" />
                  <div>
                    <h4 className="font-medium">Years Teaching</h4>
                    <p className="text-neutral-medium">{teacherProfile.yearsOfExperience || "Not specified"}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 mr-3 text-neutral-medium mt-0.5" />
                  <div>
                    <h4 className="font-medium">Certifications</h4>
                    <p className="text-neutral-medium">{teacherProfile.certifications || "Not specified"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Tabs defaultValue="about">
            <TabsList className="mb-6">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About {teacherProfile.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">
                    {teacherProfile.bio || "No bio information available."}
                  </p>
                  
                  <h3 className="font-medium mt-6 mb-3">Teaching Style</h3>
                  <p className="text-neutral-medium">
                    {teacherProfile.teachingStyle || "No teaching style information available."}
                  </p>
                  
                  <h3 className="font-medium mt-6 mb-3">Specializations</h3>
                  <p className="text-neutral-medium">
                    {teacherProfile.specializations || "No specialization information available."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Student Reviews</CardTitle>
                  {isAuthenticated && isStudent && (
                    <Button
                      variant="outline"
                      onClick={() => setIsReviewModalOpen(true)}
                    >
                      Write a Review
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isLoadingReviews ? (
                    <div className="text-center py-12">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                      <p className="mt-2 text-neutral-medium">Loading reviews...</p>
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review: any) => (
                        <TestimonialCard
                          key={review.id}
                          text={review.comment}
                          rating={review.rating}
                          studentName={review.studentName || "Anonymous Student"}
                          studentSubject={review.subjectName || "General"}
                          studentInitials={
                            review.studentName
                              ? review.studentName
                                  .split(' ')
                                  .map((name: string) => name[0])
                                  .join('')
                              : "AS"
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-neutral-50 rounded-lg">
                      <span className="material-icons text-neutral-medium text-5xl mb-4">rate_review</span>
                      <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
                      <p className="text-neutral-medium">
                        This teacher doesn't have any reviews yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="availability">
              <Card>
                <CardHeader>
                  <CardTitle>Availability Schedule</CardTitle>
                  <CardDescription>
                    When {teacherProfile.name} is available for sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teacherProfile.availabilitySchedule ? (
                    <div className="space-y-4">
                      {/* Render schedule here */}
                      <p className="text-neutral-medium">{teacherProfile.availabilitySchedule}</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-neutral-50 rounded-lg">
                      <span className="material-icons text-neutral-medium text-5xl mb-4">calendar_today</span>
                      <h3 className="text-lg font-medium mb-2">No Schedule Posted</h3>
                      <p className="text-neutral-medium">
                        This teacher hasn't posted their availability schedule yet.
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-neutral-medium">
                    Contact the teacher or book a session to discuss specific availability.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Book Session Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Book a Session with {teacherProfile.name}</DialogTitle>
            <DialogDescription>
              Fill out the details below to request a session. You'll be notified when the teacher confirms.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <select
                id="subject"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedSubject || ""}
                onChange={(e) => setSelectedSubject(parseInt(e.target.value))}
              >
                <option value="">Select a subject</option>
                {teacherProfile.subjectIds?.map((subjectId: number) => {
                  const subject = subjects.find((s: any) => s.id === subjectId);
                  return subject ? (
                    <option key={subjectId} value={subjectId}>
                      {subject.name}
                    </option>
                  ) : null;
                })}
              </select>
            </div>
            
            <div>
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date" 
                value={sessionDate} 
                onChange={(e) => setSessionDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input 
                  id="start-time" 
                  type="time" 
                  value={sessionStartTime} 
                  onChange={(e) => setSessionStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input 
                  id="end-time" 
                  type="time" 
                  value={sessionEndTime} 
                  onChange={(e) => setSessionEndTime(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                placeholder="Add any additional information..." 
                value={sessionNotes} 
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </div>
            
            <div className="text-sm bg-blue-50 text-blue-600 p-3 rounded-md">
              <p className="font-medium">Session Cost:</p>
              <p>
                ${teacherProfile.hourlyRate} per hour × {
                  sessionStartTime && sessionEndTime
                    ? ((new Date(`2000-01-01T${sessionEndTime}`).getTime() - 
                        new Date(`2000-01-01T${sessionStartTime}`).getTime()) / 
                        (1000 * 60 * 60)).toFixed(1)
                    : "0"
                } hours = ${
                  sessionStartTime && sessionEndTime
                    ? (teacherProfile.hourlyRate * 
                        ((new Date(`2000-01-01T${sessionEndTime}`).getTime() - 
                          new Date(`2000-01-01T${sessionStartTime}`).getTime()) / 
                          (1000 * 60 * 60))).toFixed(2)
                    : "0.00"
                }
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBookingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBookSession}
              disabled={bookSession.isPending}
            >
              {bookSession.isPending ? "Booking..." : "Book Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Write Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Write a Review for {teacherProfile.name}</DialogTitle>
            <DialogDescription>
              Share your experience to help other students.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rating">Rating</Label>
              <div className="flex items-center mt-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewRating(rating)}
                    className="p-1"
                  >
                    <StarIcon
                      className={`h-8 w-8 ${
                        rating <= reviewRating
                          ? "text-yellow-400 fill-current"
                          : "text-neutral-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="review">Your Review</Label>
              <Textarea 
                id="review" 
                placeholder="Share your experience with this teacher..." 
                value={reviewText} 
                onChange={(e) => setReviewText(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={submitReview.isPending}
            >
              {submitReview.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}