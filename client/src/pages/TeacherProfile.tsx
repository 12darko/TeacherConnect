import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, StarHalf, Calendar as CalendarIcon, Clock, DollarSign, Award, MessageSquare } from "lucide-react";
import TestimonialCard from "@/components/TestimonialCard";
import { format } from "date-fns";

export default function TeacherProfile() {
  const [, params] = useRoute("/teacher/:id");
  const teacherId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for booking
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // Fetch teacher profile
  const { data: teacher, isLoading } = useQuery({
    queryKey: [`/api/teachers/${teacherId}`],
    enabled: !!teacherId,
  });
  
  // Fetch teacher's reviews
  const { data: reviews = [] } = useQuery({
    queryKey: [`/api/reviews?teacherId=${teacherId}`],
    enabled: !!teacherId,
  });
  
  // Book session mutation
  const bookSession = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest("POST", "/api/sessions", sessionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({
        title: "Session booked",
        description: "Your session has been successfully booked.",
      });
      setIsBookingModalOpen(false);
      setSelectedDate(undefined);
      setSelectedTime("");
    },
    onError: (error) => {
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "Failed to book session",
        variant: "destructive",
      });
    },
  });
  
  // Generate available time slots based on teacher's availability
  const getAvailableTimes = () => {
    if (!teacher?.availability || !selectedDate) return [];
    
    const dayOfWeek = format(selectedDate, 'EEEE').toLowerCase();
    const availableDay = teacher.availability.find((day: any) => 
      day.day.toLowerCase() === dayOfWeek
    );
    
    if (!availableDay) return [];
    
    // Generate time slots
    const times = [];
    const [startHour, startMinute] = availableDay.startTime.split(':').map(Number);
    const [endHour, endMinute] = availableDay.endTime.split(':').map(Number);
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === startHour && minute < startMinute) continue;
        if (hour === endHour && minute >= endMinute) continue;
        
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        times.push(`${formattedHour}:${minute === 0 ? '00' : minute} ${ampm}`);
      }
    }
    
    return times;
  };
  
  // Handle booking submission
  const handleBookSession = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book a session",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Incomplete selection",
        description: "Please select both date and time",
        variant: "destructive",
      });
      return;
    }
    
    const [hours, minutes] = selectedTime.split(' ')[0].split(':');
    const ampm = selectedTime.split(' ')[1];
    let hour = parseInt(hours);
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    
    const startDate = new Date(selectedDate);
    startDate.setHours(hour);
    startDate.setMinutes(parseInt(minutes));
    startDate.setSeconds(0);
    
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1);
    
    bookSession.mutate({
      teacherId: teacherId,
      studentId: user.id,
      subjectId: teacher.subjects[0].id,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      status: "scheduled",
      sessionUrl: `https://educonnect.com/classroom/${Date.now()}`,
    });
  };
  
  // Render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="text-yellow-400 h-5 w-5" fill="currentColor" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="text-yellow-400 h-5 w-5" fill="currentColor" />);
    }
    
    // Add empty stars to make 5 total
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-star-${i}`} className="text-yellow-400 h-5 w-5" />);
    }
    
    return stars;
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-neutral-medium">Loading teacher profile...</p>
      </div>
    );
  }
  
  if (!teacher) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-2">Teacher Not Found</h2>
        <p className="text-neutral-medium mb-4">The teacher you're looking for could not be found.</p>
        <Link href="/find-teachers">
          <Button>Browse Teachers</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Teacher info */}
        <div className="lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
            {/* Teacher avatar */}
            {teacher.profileImage ? (
              <img 
                src={teacher.profileImage} 
                alt={teacher.name} 
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-white text-4xl">
                {teacher.name.substring(0, 2)}
              </div>
            )}
            
            {/* Teacher info */}
            <div className="flex-grow">
              <h1 className="text-3xl font-heading font-semibold">{teacher.name}</h1>
              <p className="text-lg text-neutral-medium mb-2">
                {teacher.subjects.map((subject: any) => subject.name).join(", ")}
              </p>
              
              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex mr-2">
                  {renderStars(teacher.averageRating)}
                </div>
                <span className="text-neutral-medium">
                  {teacher.averageRating.toFixed(1)} ({teacher.totalReviews} reviews)
                </span>
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-primary mr-1" />
                  <span>${teacher.hourlyRate}/hour</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-primary mr-1" />
                  <span>{teacher.yearsOfExperience} years experience</span>
                </div>
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-primary mr-1" />
                  <span>{teacher.totalStudents} students taught</span>
                </div>
              </div>
            </div>
            
            {/* Book button (mobile) */}
            <div className="md:hidden w-full">
              <Button 
                className="w-full" 
                onClick={() => setIsBookingModalOpen(true)}
                disabled={!user || user.id === teacherId}
              >
                Book a Session
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="about">
            <TabsList className="mb-6">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About {teacher.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{teacher.bio || "No bio available."}</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Student Reviews</CardTitle>
                  <CardDescription>
                    {teacher.totalReviews} reviews, {teacher.averageRating.toFixed(1)} average rating
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review: any) => (
                        <TestimonialCard
                          key={review.id}
                          text={review.comment || "Great teacher!"}
                          rating={review.rating}
                          studentName={review.studentName || "Student"}
                          studentSubject={teacher.subjects[0]?.name || "Student"}
                          studentInitials={review.studentName?.substring(0, 2) || "ST"}
                          studentImage={review.studentProfileImage}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-medium">No reviews yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="subjects">
              <Card>
                <CardHeader>
                  <CardTitle>Subjects Taught</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {teacher.subjects.map((subject: any) => (
                      <Badge key={subject.id} variant="secondary" className="text-sm py-1">
                        <span className="material-icons text-primary text-sm mr-1">{subject.icon}</span>
                        {subject.name}
                      </Badge>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <h3 className="font-medium mb-2">Experience</h3>
                  <p className="text-neutral-medium">
                    {teacher.yearsOfExperience} years of teaching experience
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="availability">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Availability</CardTitle>
                  <CardDescription>When {teacher.name} is available to teach</CardDescription>
                </CardHeader>
                <CardContent>
                  {teacher.availability && teacher.availability.length > 0 ? (
                    <div className="space-y-2">
                      {teacher.availability.map((day: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b">
                          <div className="font-medium">{day.day}</div>
                          <div className="flex items-center text-neutral-medium">
                            <Clock className="h-4 w-4 mr-1" />
                            {day.startTime} - {day.endTime}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-medium">No availability information provided.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right column - Booking */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Book a Session</CardTitle>
              <CardDescription>Select a date and time to schedule your session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="font-medium mb-1">Session Price</div>
                  <div className="text-2xl font-semibold text-primary">${teacher.hourlyRate}/hour</div>
                </div>
                
                <Separator />
                
                {user ? (
                  user.id !== teacherId ? (
                    <>
                      <Button 
                        className="w-full" 
                        onClick={() => setIsBookingModalOpen(true)}
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Schedule a Class
                      </Button>
                      
                      <Button variant="outline" className="w-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </>
                  ) : (
                    <div className="text-center p-4 bg-neutral-lightest rounded-md">
                      <p className="text-neutral-medium">This is your profile</p>
                    </div>
                  )
                ) : (
                  <div className="text-center p-4 bg-neutral-lightest rounded-md">
                    <p className="text-neutral-medium mb-2">Please log in to book a session</p>
                    <Link href="/login">
                      <Button size="sm">Log In</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule a Session</DialogTitle>
            <DialogDescription>
              Choose a date and time for your session with {teacher.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <h3 className="font-medium">Select Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  // Disable past dates
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date < today) return true;
                  
                  // Disable days not in teacher's availability
                  if (!teacher.availability) return false;
                  
                  const dayOfWeek = format(date, 'EEEE').toLowerCase();
                  return !teacher.availability.some((day: any) => 
                    day.day.toLowerCase() === dayOfWeek
                  );
                }}
                showTimePicker={true}
                selectedTime={selectedTime}
                onTimeChange={setSelectedTime}
                availableTimes={getAvailableTimes()}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBookSession}
              disabled={!selectedDate || !selectedTime || bookSession.isPending}
            >
              {bookSession.isPending ? "Booking..." : "Book Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
