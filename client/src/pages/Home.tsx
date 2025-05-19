import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { SubjectCard } from "@/components/SubjectCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
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
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<any[]>({
    queryKey: ['/api/subjects'],
    queryFn: async () => {
      const response = await fetch('/api/subjects');
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      return response.json();
    }
  });

  // Fetch top teachers
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery<any[]>({
    queryKey: ['/api/teachers?featured=true'],
  });
  
  // Fetch testimonials
  const { data: testimonials = [], isLoading: isLoadingTestimonials } = useQuery<any[]>({
    queryKey: ['/api/testimonials?featured=true'],
    
  });
  
  // Fetch how it works steps
  const { data: howItWorksSteps = [], isLoading: isLoadingHowItWorks } = useQuery<any[]>({
    queryKey: ['/api/how-it-works'],
    queryFn: async () => {
      const response = await fetch('/api/how-it-works');
      if (!response.ok) {
        throw new Error('Failed to fetch how it works steps');
      }
      return response.json();
    }
  });
  
  // Fetch site statistics
  const { data: statistics = {}, isLoading: isLoadingStatistics } = useQuery<any>({
    queryKey: ['/api/statistics'],
    queryFn: async () => {
      const response = await fetch('/api/statistics');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      return response.json();
    }
  });
  
  // Fetch how it works features (different from the how-it-works steps)
  const { data: howItWorksFeatures = [], isLoading: isLoadingHowItWorksFeatures } = useQuery<any[]>({
    queryKey: ['/api/features?type=how-it-works'],
    queryFn: async () => {
      const response = await fetch('/api/features?type=how-it-works');
      if (!response.ok) {
        return [];
      }
      return response.json();
    }
  });
  
  // Fetch features from database
  const { data: features = [], isLoading: isLoadingFeatures } = useQuery<any[]>({
    queryKey: ['/api/features'],
  });
  
  // Set up testimonials if none are returned from API
  const mockTestimonials = [
    {
      id: 1,
      comment: "Amazing teacher! I learned so much. My math skills improved dramatically after just a few lessons.",
      rating: 5,
      studentName: "Emma Thompson",
      date: new Date(2023, 11, 15),
      studentImage: ""
    },
    {
      id: 2,
      comment: "The platform is very user-friendly and it was easy to find the right teacher. The video quality during sessions is excellent.",
      rating: 4,
      studentName: "Michael Chen",
      date: new Date(2024, 1, 22),
      studentImage: ""
    },
    {
      id: 3,
      comment: "I was struggling with my chemistry classes until I found this platform. Now I'm one of the top students in my class!",
      rating: 5,
      studentName: "Sophia Rodriguez",
      date: new Date(2024, 3, 10),
      studentImage: ""
    }
  ];
  
  // Map database testimonials to match our component props
  const mappedTestimonials = testimonials.map(t => ({
    id: t.id,
    comment: t.comment,
    rating: t.rating,
    studentName: t.name,
    date: new Date(t.date),
    studentImage: t.avatarUrl || ""
  }));
  
  const displayTestimonials = mappedTestimonials.length > 0 ? mappedTestimonials : mockTestimonials;
  
  // Fetch pricing plans
  const { data: pricingPlans = [], isLoading: isLoadingPricing } = useQuery<any[]>({
    queryKey: ['/api/pricing-plans'],
    queryFn: async () => {
      const response = await fetch('/api/pricing-plans');
      if (!response.ok) {
        throw new Error('Failed to fetch pricing plans');
      }
      return response.json();
    }
  });
  
  // Fetch FAQ items
  const { data: faqItems = [], isLoading: isLoadingFaq } = useQuery<any[]>({
    queryKey: ['/api/faq-items'],
    queryFn: async () => {
      const response = await fetch('/api/faq-items');
      if (!response.ok) {
        throw new Error('Failed to fetch FAQ items');
      }
      return response.json();
    }
  });
  
  // Removing duplicate statistics and how-it-works declarations
  // The declarations on lines 60 and 71 already handle these queries
  
  // PricingPlans component
  const PricingPlans = () => {
    if (isLoadingPricing) {
      return (
        <>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-96 animate-pulse bg-neutral-100 rounded-lg"></div>
          ))}
        </>
      );
    }
    
    // Fallback if no plans from API
    const mockPlans = [
      {
        id: 1,
        name: "Temel Plan",
        price: 199.99,
        currency: "TRY",
        description: "Öğrenme yolculuğunuza başlamak için ideal",
        features: ["Haftalık 2 saat özel ders", "Sınırsız mesajlaşma", "Temel ders materyalleri"],
        recommended: false
      },
      {
        id: 2,
        name: "Standart Plan",
        price: 349.99,
        currency: "TRY",
        description: "En popüler seçenek",
        features: ["Haftalık 5 saat özel ders", "Sınırsız mesajlaşma", "Tüm ders materyalleri", "Özelleştirilmiş sınav ve ödevler", "7/24 soru desteği"],
        recommended: true
      },
      {
        id: 3,
        name: "Premium Plan",
        price: 599.99,
        currency: "TRY",
        description: "Tam kapsamlı öğrenme deneyimi",
        features: ["Haftalık 10 saat özel ders", "Sınırsız mesajlaşma", "Tüm ders materyalleri", "Özelleştirilmiş sınav ve ödevler", "7/24 soru desteği", "Öncelikli öğretmen seçimi", "Gelişmiş analitik raporlar"],
        recommended: false
      }
    ];
    
    const displayPlans = pricingPlans.length > 0 ? pricingPlans : mockPlans;
    
    return (
      <>
        {displayPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative overflow-hidden ${plan.recommended ? 'border-2 border-primary shadow-lg' : 'border border-neutral-200'}`}
          >
            {plan.recommended && (
              <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 text-sm font-medium">
                Önerilen
              </div>
            )}
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className="text-neutral-600 mb-4">{plan.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">{plan.price.toLocaleString('tr-TR')}</span>
                <span className="text-neutral-500"> {plan.currency}/ay</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button 
                  className={`w-full font-medium ${plan.recommended ? 'bg-primary hover:bg-primary/90' : 'bg-neutral-100 text-primary hover:bg-neutral-200'}`}
                >
                  Şimdi Başla
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </>
    );
  };
  
  // FaqItems component
  const FaqItems = () => {
    if (isLoadingFaq) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse bg-neutral-100 rounded"></div>
          ))}
        </div>
      );
    }
    
    // Fallback if no FAQs from API
    const mockFaqs = [
      {
        id: 1,
        question: "Nasıl öğretmen bulabilirim?",
        answer: "Ana sayfadaki konu kategorilerine göz atabilir veya doğrudan arama çubuğunu kullanarak belirli bir konu veya isimle öğretmen arayabilirsiniz."
      },
      {
        id: 2,
        question: "Ödeme nasıl yapılır?",
        answer: "Platformumuzda ödemeler tamamen güvenli bir şekilde kredi kartı veya banka kartı ile yapılabilir. Tüm ödemeler SSL korumalıdır."
      },
      {
        id: 3,
        question: "Ders iptali konusunda politikanız nedir?",
        answer: "Dersler başlama saatinden en az 24 saat önce ücretsiz olarak iptal edilebilir. 24 saatten daha kısa sürede yapılan iptallerde ders ücretinin %50si iade edilir."
      },
      {
        id: 4,
        question: "Platformda öğretmen olarak nasıl çalışabilirim?",
        answer: "Öğretmen olarak kaydolmak için kayıt sırasında 'Öğretmen olarak kayıt ol' seçeneğini seçmelisiniz. Daha sonra eğitim geçmişiniz ve deneyiminiz hakkında bilgi girmeniz gerekecektir."
      },
      {
        id: 5,
        question: "Teknik sorunlar yaşarsam ne yapmalıyım?",
        answer: "Video görüşmesi sırasında teknik sorunlar yaşarsanız, önce internet bağlantınızı kontrol edin. Sorun devam ederse, sayfayı yenilemeyi deneyin. Hala çözülmediyse yardım bölümündeki canlı desteğimizle iletişime geçebilirsiniz."
      }
    ];
    
    const displayFaqs = faqItems.length > 0 ? faqItems : mockFaqs;
    
    return (
      <Accordion type="single" collapsible className="w-full">
        {displayFaqs.map((faq) => (
          <AccordionItem key={faq.id} value={`item-${faq.id}`}>
            <AccordionTrigger className="text-left font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent>
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  };
  
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
                      <Button size="lg" className="bg-white text-primary hover:bg-white/90 border-white font-medium">
                        Go to Dashboard
                      </Button>
                    </Link>
                    <Link href="/find-teachers">
                      <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 font-medium">
                        Find Teachers
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth">
                      <Button 
                        size="lg" 
                        className="bg-white text-primary hover:bg-white/90 border-white font-medium"
                      >
                        Get Started
                      </Button>
                    </Link>
                    <Link href="/find-teachers">
                      <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 font-medium">
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
            {isLoadingFeatures ? (
              // Loading state for features
              [...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="bg-gray-200 animate-pulse h-12 w-12 rounded-full mb-4"></div>
                    <div className="bg-gray-200 animate-pulse h-6 w-3/4 rounded mb-3"></div>
                    <div className="bg-gray-200 animate-pulse h-4 w-full rounded mb-2"></div>
                    <div className="bg-gray-200 animate-pulse h-4 w-5/6 rounded mb-2"></div>
                    <div className="bg-gray-200 animate-pulse h-4 w-4/6 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : features.length > 0 ? (
              // Display features from database
              features.map((feature) => (
                <Card key={feature.id}>
                  <CardContent className="pt-6">
                    <div className="bg-primary/10 text-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                      {/* Dynamic icon based on feature icon name */}
                      {feature.icon === 'video' && <Video className="h-6 w-6" />}
                      {feature.icon === 'book' && <BookOpen className="h-6 w-6" />}
                      {feature.icon === 'users' && <Users className="h-6 w-6" />}
                      {feature.icon === 'clock' && <Clock className="h-6 w-6" />}
                      {feature.icon === 'check' && <CheckCircle className="h-6 w-6" />}
                      {!['video', 'book', 'users', 'clock', 'check'].includes(feature.icon) && 
                        <GraduationCap className="h-6 w-6" />
                      }
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-neutral-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Fallback if no features are in database
              <>
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
              </>
            )}
          </div>
        </div>
      </section>
      
      {/* Popular Subjects Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Popular Subjects</h2>
            <Link href="/subjects">
              <Button variant="outline" className="group border-primary text-primary hover:bg-primary/10">
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
            {howItWorksSteps.length > 0 ? (
              howItWorksSteps.map((step) => (
                <div key={step.id} className="text-center">
                  <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-neutral-600">
                    {step.description}
                  </p>
                </div>
              ))
            ) : (
              <>
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
              </>
            )}
          </div>
          
          <div className="text-center mt-12">
            {isAuthenticated ? (
              <Link href={user?.role === "student" ? "/student-dashboard" : 
                           user?.role === "teacher" ? "/teacher-dashboard" :
                           user?.role === "admin" ? "/admin-dashboard" : "/"}>
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Get Started Now
                </Button>
              </Link>
            )}
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
            {isLoadingTestimonials ? (
              // Loading state
              [...Array(3)].map((_, i) => (
                <Card key={i} className="h-48 animate-pulse bg-neutral-100"></Card>
              ))
            ) : displayTestimonials.length > 0 ? (
              // Display testimonials
              displayTestimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  id={testimonial.id}
                  comment={testimonial.comment}
                  rating={testimonial.rating}
                  studentName={testimonial.studentName}
                  name={testimonial.name}
                  role={testimonial.role}
                  date={testimonial.date}
                  studentImage={testimonial.studentImage}
                  avatarUrl={testimonial.avatar_url || testimonial.avatarUrl}
                />
              ))
            ) : (
              // Fallback if no testimonials
              mockTestimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  id={testimonial.id}
                  comment={testimonial.comment}
                  rating={testimonial.rating}
                  studentName={testimonial.studentName}
                  date={testimonial.date}
                  studentImage={testimonial.studentImage}
                />
              ))
            )}
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
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-medium">
                  Find Teachers
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 font-medium"
                >
                  Sign Up Now
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-12 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                {isLoadingStatistics ? (
                  <div className="h-10 w-20 bg-gray-200 animate-pulse mx-auto rounded"></div>
                ) : (
                  `${statistics?.totalStudents?.toLocaleString() || '10,000'}+`
                )}
              </div>
              <p className="text-neutral-600">Students</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                {isLoadingStatistics ? (
                  <div className="h-10 w-20 bg-gray-200 animate-pulse mx-auto rounded"></div>
                ) : (
                  `${statistics?.totalTeachers?.toLocaleString() || '1,000'}+`
                )}
              </div>
              <p className="text-neutral-600">Expert Teachers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                {isLoadingStatistics ? (
                  <div className="h-10 w-16 bg-gray-200 animate-pulse mx-auto rounded"></div>
                ) : (
                  `${statistics?.totalSubjects?.toLocaleString() || '50'}+`
                )}
              </div>
              <p className="text-neutral-600">Subjects</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                {isLoadingStatistics ? (
                  <div className="h-10 w-24 bg-gray-200 animate-pulse mx-auto rounded"></div>
                ) : (
                  `${statistics?.totalSessions?.toLocaleString() || '100,000'}+`
                )}
              </div>
              <p className="text-neutral-600">Completed Lessons</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Uygun Fiyatlarla Kaliteli Eğitim</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              İhtiyaçlarınıza en uygun planı seçin ve hemen eğitim yolculuğunuza başlayın.
            </p>
          </div>
          
          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <PricingPlans />
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Sık Sorulan Sorular</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              EduConnect hakkında merak ettiğiniz konularda size yardımcı olabiliriz.
            </p>
          </div>
          
          {/* FAQ Items */}
          <div className="mt-8 max-w-4xl mx-auto">
            <FaqItems />
          </div>
        </div>
      </section>
    </div>
  );
}