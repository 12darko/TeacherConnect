import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import SubjectCard from "@/components/SubjectCard";
import TeacherCard from "@/components/TeacherCard";
import TestimonialCard from "@/components/TestimonialCard";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";

export default function Home() {
  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
  });

  // Fetch featured teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/teachers'],
  });

  const testimonials = [
    {
      text: "My math grades improved dramatically after just a few sessions with Sarah. She explains complex concepts in a way that's easy to understand.",
      rating: 5,
      studentName: "Jason Doe",
      studentSubject: "Mathematics",
      studentInitials: "JD"
    },
    {
      text: "As a working professional, I needed flexibility. EduConnect made it easy to find an experienced language teacher who could work with my schedule.",
      rating: 5,
      studentName: "Alicia Taylor",
      studentSubject: "Language",
      studentInitials: "AT"
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-primary text-white py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold leading-tight">Learn From The Best Teachers Online</h1>
                <p className="mt-4 text-lg text-blue-100">Connect with expert teachers for personalized 1-on-1 lessons, interactive classes, and guided assignments.</p>
                <div className="mt-6 flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                  <Link href="/find-teachers">
                    <Button size="lg" className="bg-accent hover:bg-accent-dark w-full sm:w-auto">
                      Find a Teacher
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white hover:bg-opacity-10 w-full sm:w-auto"
                    onClick={() => window.location.href = "/api/login"}
                  >
                    Sign In / Register
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2">
                <img 
                  src="https://images.unsplash.com/photo-1587691592099-24045742c181?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                  alt="Teacher and student in online learning session" 
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subject Categories Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-heading font-semibold text-center mb-8">Browse by Subject</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {subjects.map((subject) => (
              <SubjectCard 
                key={subject.id}
                id={subject.id}
                name={subject.name}
                icon={subject.icon}
              />
            ))}
            <Link href="/find-teachers">
              <a className="bg-neutral-lightest hover:bg-blue-50 rounded-lg p-4 flex flex-col items-center justify-center transition duration-150 h-32">
                <span className="material-icons text-3xl text-primary mb-2">more_horiz</span>
                <span className="text-center font-medium text-neutral-dark">More Subjects</span>
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Teachers Section */}
      <section className="py-12 bg-neutral-lightest">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold">Featured Teachers</h2>
            <Link href="/find-teachers">
              <a className="text-primary hover:text-primary-dark font-medium flex items-center">
                View all 
                <span className="material-icons text-sm ml-1">chevron_right</span>
              </a>
            </Link>
          </div>
          
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {teachers.slice(0, 4).map((teacher) => (
              <TeacherCard
                key={teacher.id}
                id={teacher.userId}
                name={teacher.name}
                profileImage={teacher.profileImage}
                subject={subjects.find(s => teacher.subjectIds.includes(s.id))?.name || "Multiple Subjects"}
                rating={teacher.averageRating}
                reviewCount={teacher.totalReviews}
                bio={teacher.bio || "Experienced teacher available for lessons."}
                hourlyRate={teacher.hourlyRate}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-heading font-semibold text-center mb-8">How EduConnect Works</h2>
          
          <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
            <div className="text-center px-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-icons text-3xl text-primary">search</span>
              </div>
              <h3 className="text-xl font-heading font-medium mb-2">1. Find Your Perfect Teacher</h3>
              <p className="text-neutral-medium">Browse teacher profiles and read reviews to find the perfect match for your learning needs.</p>
            </div>
            
            <div className="text-center px-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-icons text-3xl text-primary">event</span>
              </div>
              <h3 className="text-xl font-heading font-medium mb-2">2. Book Sessions</h3>
              <p className="text-neutral-medium">Schedule one-on-one or group classes at times that work best for your schedule.</p>
            </div>
            
            <div className="text-center px-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-icons text-3xl text-primary">video_call</span>
              </div>
              <h3 className="text-xl font-heading font-medium mb-2">3. Learn Through Video Classes</h3>
              <p className="text-neutral-medium">Connect with your teacher via our integrated video platform for interactive learning sessions.</p>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = "/api/login"}
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 bg-neutral-lightest">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-heading font-semibold text-center mb-8">What Our Students Say</h2>
          
          <div className="max-w-4xl mx-auto">
            <img 
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600" 
              alt="Students learning online" 
              className="rounded-lg w-full h-64 object-cover mb-8"
            />
            
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={index}
                  text={testimonial.text}
                  rating={testimonial.rating}
                  studentName={testimonial.studentName}
                  studentSubject={testimonial.studentSubject}
                  studentInitials={testimonial.studentInitials}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* App Features Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 md:pr-8 mb-8 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-heading font-semibold mb-4">A Complete Learning Platform</h2>
              <p className="text-neutral-medium mb-6">EduConnect provides all the tools you need for effective online learning. Our platform is designed to make education accessible, interactive, and engaging.</p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckIcon className="h-3 w-3 text-primary" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-base font-medium text-neutral-dark">Live Video Classes</h4>
                    <p className="text-sm text-neutral-medium">Interactive HD video conferencing with screen sharing and virtual whiteboard.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckIcon className="h-3 w-3 text-primary" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-base font-medium text-neutral-dark">Assignments & Quizzes</h4>
                    <p className="text-sm text-neutral-medium">Teachers can create and assign work to measure your progress.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckIcon className="h-3 w-3 text-primary" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-base font-medium text-neutral-dark">Progress Tracking</h4>
                    <p className="text-sm text-neutral-medium">Detailed statistics to monitor your improvement over time.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckIcon className="h-3 w-3 text-primary" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-base font-medium text-neutral-dark">AI-Powered Recommendations</h4>
                    <p className="text-sm text-neutral-medium">Get personalized teacher and course suggestions based on your needs.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Link href="/find-teachers">
                  <a className="inline-flex items-center text-primary hover:text-primary-dark font-medium">
                    Explore all features
                    <span className="material-icons text-sm ml-1">arrow_forward</span>
                  </a>
                </Link>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Student using educational platform" 
                className="rounded-lg shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Download Section */}
      <section className="py-12 bg-primary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold mb-4">Access EduConnect Anywhere</h2>
            <p className="text-blue-100 mb-8">Our platform is available on web, desktop, and mobile devices. Learn from anywhere, at any time.</p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="secondary" size="lg" className="inline-flex items-center">
                <span className="material-icons mr-2">laptop</span>
                Web Platform
              </Button>
              <Button variant="secondary" size="lg" className="inline-flex items-center">
                <span className="material-icons mr-2">desktop_windows</span>
                Desktop App
              </Button>
              <Button variant="secondary" size="lg" className="inline-flex items-center">
                <span className="material-icons mr-2">smartphone</span>
                Mobile App
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-12 bg-neutral-lightest">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-heading font-semibold mb-4">Ready to Transform Your Learning?</h2>
              <p className="text-neutral-medium mb-8">Join thousands of students who are already learning with EduConnect.</p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto"
                  onClick={() => window.location.href = "/api/login"}
                >
                  Sign Up or Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
