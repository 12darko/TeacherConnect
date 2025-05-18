import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { SubjectCard } from "@/components/SubjectCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { 
  BookOpen, 
  GraduationCap, 
  Video, 
  Users, 
  Clock, 
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Fetch featured subjects
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['/api/subjects'],
  });

  // Fetch top teachers
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['/api/teachers?featured=true'],
  });
  
  // Fetch testimonials
  const { data: testimonials = [] } = useQuery({
    queryKey: ['/api/reviews?featured=true'],
  });
  
  // Set up mock testimonials if none are returned from API
  const displayTestimonials = testimonials.length > 0 ? testimonials : [
    {
      id: 1,
      text: "My math skills improved dramatically after just a few sessions. The teacher was patient and explained concepts clearly.",
      rating: 5,
      studentName: "Emma Thompson",
      studentSubject: "Mathematics",
      studentInitials: "ET"
    },
    {
      id: 2,
      text: "The platform is very user-friendly and finding the right teacher was easy. The video quality during the sessions is excellent.",
      rating: 4,
      studentName: "Michael Chen",
      studentSubject: "Physics",
      studentInitials: "MC"
    },
    {
      id: 3,
      text: "I was struggling with my chemistry courses until I found this platform. Now I'm one of the top students in my class!",
      rating: 5,
      studentName: "Sophia Rodriguez",
      studentSubject: "Chemistry",
      studentInitials: "SR"
    }
  ];
  
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/90 to-primary text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find the Perfect Teacher for Your Learning Journey
              </h1>
              <p className="text-xl mb-8 text-white/90">
                Connect with expert teachers for personalized online lessons, assignments, and exams tailored to your learning goals.
              </p>
              <div className="flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <>
                    <Link href={user?.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard"}>
                      <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                        Go to Dashboard
                      </Button>
                    </Link>
                    <Link href="/find-teachers">
                      <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                        Find Teachers
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      className="bg-white text-primary hover:bg-white/90"
                      onClick={() => window.location.href = "/api/login"}
                    >
                      Get Started
                    </Button>
                    <Link href="/find-teachers">
                      <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                        Browse Teachers
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1610484826967-09c5720778c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                alt="Online learning" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Platform?</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              We provide an all-in-one learning solution with powerful features to enhance your educational experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="bg-primary/10 text-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Video className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Live Video Sessions</h3>
                <p className="text-neutral-600">
                  Connect with teachers in real-time through high-quality video conferencing with built-in tools for an interactive learning experience.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="bg-primary/10 text-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Custom Assessments</h3>
                <p className="text-neutral-600">
                  Teachers create personalized exams and assignments to track your progress and identify areas for improvement.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="bg-primary/10 text-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Verified Teachers</h3>
                <p className="text-neutral-600">
                  All teachers on our platform are verified professionals with expertise in their subjects, providing quality education.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Popular Subjects Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Popular Subjects</h2>
            <Link href="/find-teachers">
              <Button variant="outline" className="group">
                View All 
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {isLoadingSubjects ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-neutral-100 rounded-lg animate-pulse"></div>
              ))
            ) : (
              subjects.slice(0, 6).map((subject: any) => (
                <SubjectCard
                  key={subject.id}
                  id={subject.id}
                  name={subject.name}
                  icon={subject.icon}
                />
              ))
            )}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Getting started with our platform is easy. Follow these simple steps to begin your learning journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-bold mb-2">Find Your Teacher</h3>
              <p className="text-neutral-600">
                Browse through our selection of verified teachers based on subject, price, and ratings to find your perfect match.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-bold mb-2">Book a Session</h3>
              <p className="text-neutral-600">
                Schedule a session at a time that works for you. Our flexible booking system makes it easy to find convenient slots.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-bold mb-2">Start Learning</h3>
              <p className="text-neutral-600">
                Connect for your live video session and access personalized learning materials, assignments, and exams.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              onClick={() => window.location.href = "/api/login"}
              disabled={isAuthenticated}
            >
              {isAuthenticated ? "You're Already Signed In" : "Get Started Today"}
            </Button>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Students Say</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Don't just take our word for it. Hear from students who have transformed their learning experience with our platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayTestimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                text={testimonial.text}
                rating={testimonial.rating}
                studentName={testimonial.studentName}
                studentSubject={testimonial.studentSubject}
                studentInitials={testimonial.studentInitials}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Learning Experience?</h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of students who are achieving their academic goals with personalized online learning.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/find-teachers">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  Find Teachers Now
                </Button>
              </Link>
            ) : (
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => window.location.href = "/api/login"}
              >
                Sign Up Free
              </Button>
            )}
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-12 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <p className="text-neutral-600">Students</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1,000+</div>
              <p className="text-neutral-600">Expert Teachers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <p className="text-neutral-600">Subjects</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100,000+</div>
              <p className="text-neutral-600">Sessions Completed</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}