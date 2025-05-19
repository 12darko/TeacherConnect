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
      {/* Hero Section - Improved Design */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary to-primary-dark pt-20 pb-24 md:py-28">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:30px_30px]"></div>
        <div className="absolute top-0 w-full h-40 bg-gradient-to-b from-primary to-transparent"></div>
        <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-primary to-transparent"></div>
        
        {/* Floating Elements */}
        <div className="absolute left-0 top-1/4 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl"></div>
        <div className="absolute right-0 bottom-1/4 w-80 h-80 bg-primary-light/20 rounded-full blur-3xl"></div>
        
        <div className="container relative mx-auto px-4 z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-1">
                  <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2"></span>
                  Eğitim deneyimini dönüştür
                </div>
                
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                    Öğrenme Yolculuğun İçin
                  </span> <br/>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                    Mükemmel Öğretmeni Bul
                  </span>
                </h1>
                
                <p className="text-xl text-white/90 leading-relaxed max-w-xl">
                  Öğrenme hedeflerine uygun özel dersler, ödevler ve sınavlar için uzman öğretmenlerle bağlantı kur.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-2">
                {isAuthenticated ? (
                  <>
                    <Link href={user?.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard"}>
                      <Button 
                        size="lg" 
                        className="bg-white text-primary hover:bg-white/90 border-white font-semibold shadow-lg shadow-primary-dark/20"
                      >
                        Panele Git
                      </Button>
                    </Link>
                    <Link href="/find-teachers">
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="text-white border-white hover:bg-white/10 font-semibold backdrop-blur-sm"
                      >
                        Öğretmen Bul
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth">
                      <Button 
                        size="lg" 
                        variant="default"
                        className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg shadow-primary-dark/30 px-8 py-6"
                      >
                        Hemen Başla
                      </Button>
                    </Link>
                    <Link href="/find-teachers">
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="text-white border-white hover:bg-white/10 font-semibold backdrop-blur-sm py-6"
                      >
                        Öğretmenlere Göz At
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-6 text-white">
                {statistics && (
                  <>
                    <div className="flex flex-col">
                      <span className="text-3xl font-bold">{statistics.totalTeachers}+</span>
                      <span className="text-white/70">Uzman Öğretmen</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-3xl font-bold">{statistics.totalStudents}+</span>
                      <span className="text-white/70">Mutlu Öğrenci</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-3xl font-bold">{statistics.totalSessions}+</span>
                      <span className="text-white/70">Tamamlanan Ders</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="hidden md:block md:col-span-5 relative">
              <div className="absolute inset-0 -left-10 -top-10 bg-white/10 rounded-xl blur-3xl transform rotate-6"></div>
              <img 
                src="https://images.unsplash.com/photo-1610484826967-09c5720778c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                alt="Online learning" 
                className="relative rounded-xl shadow-2xl z-10 transform transition-all duration-500 hover:scale-105"
              />
              <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full border-8 border-primary-light bg-white/90 backdrop-blur flex items-center justify-center text-primary">
                <div className="text-center">
                  <div className="text-2xl font-bold">4.9</div>
                  <div className="text-xs">Kullanıcı Puanı</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section - Improved Design */}
      <section className="py-24 bg-neutral-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute -bottom-36 -left-36 w-72 h-72 bg-primary/5 rounded-full"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 px-4 py-2 bg-primary/10 text-primary border-none font-medium">
              NEDEN BİZ?
            </Badge>
            <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-dark to-primary">
              Platformumuzun Avantajları
            </h2>
            <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
              Eğitim deneyiminizi zenginleştirmek için tasarlanmış güçlü özellikleriyle eksiksiz bir öğrenme çözümü sunuyoruz.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoadingFeatures ? (
              // Loading state for features - improved
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 shadow-sm">
                  <div className="bg-gray-200 animate-pulse h-16 w-16 rounded-2xl mb-6"></div>
                  <div className="bg-gray-200 animate-pulse h-8 w-3/4 rounded-lg mb-4"></div>
                  <div className="space-y-3">
                    <div className="bg-gray-200 animate-pulse h-4 w-full rounded"></div>
                    <div className="bg-gray-200 animate-pulse h-4 w-5/6 rounded"></div>
                    <div className="bg-gray-200 animate-pulse h-4 w-4/6 rounded"></div>
                  </div>
                </div>
              ))
            ) : features.length > 0 ? (
              // Display features from database - enhanced cards
              features.map((feature: any, index: number) => (
                <div 
                  key={feature.id} 
                  className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-neutral-100 relative ${index === 1 ? 'lg:transform lg:-translate-y-4' : ''}`}
                >
                  <div className="absolute -right-3 -top-3 w-24 h-24 bg-primary/5 rounded-full -z-10"></div>
                  <div className="bg-gradient-to-br from-primary to-primary-dark p-4 rounded-2xl w-16 h-16 flex items-center justify-center text-white mb-6">
                    {/* Dynamic icon based on feature icon name */}
                    {feature.icon === 'video' && <Video className="h-7 w-7" />}
                    {feature.icon === 'book' && <BookOpen className="h-7 w-7" />}
                    {feature.icon === 'users' && <Users className="h-7 w-7" />}
                    {feature.icon === 'clock' && <Clock className="h-7 w-7" />}
                    {feature.icon === 'check' && <CheckCircle className="h-7 w-7" />}
                    {!['video', 'book', 'users', 'clock', 'check'].includes(feature.icon) && 
                      <GraduationCap className="h-7 w-7" />
                    }
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))
            ) : (
              // Fallback if no features are in database
              <>
                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-neutral-100 relative group">
                  <div className="absolute -right-3 -top-3 w-24 h-24 bg-primary/5 rounded-full -z-10"></div>
                  <div className="bg-gradient-to-br from-primary to-primary-dark p-4 rounded-2xl w-16 h-16 flex items-center justify-center text-white mb-6 group-hover:scale-105 transition-transform">
                    <Video className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Canlı Video Dersler</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Öğretmenlerle gerçek zamanlı olarak, etkileşimli öğrenme deneyimi için tasarlanmış araçlarla yüksek kaliteli video konferanslar aracılığıyla bağlantı kurun.
                  </p>
                </div>
                
                <div className="bg-white rounded-2xl p-8 shadow-md border border-neutral-100 relative group lg:transform lg:-translate-y-4">
                  <div className="absolute -left-3 -bottom-3 w-24 h-24 bg-primary/5 rounded-full -z-10"></div>
                  <div className="bg-gradient-to-br from-primary to-primary-dark p-4 rounded-2xl w-16 h-16 flex items-center justify-center text-white mb-6 group-hover:scale-105 transition-transform">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Özel Değerlendirmeler</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Öğretmenler, ilerlemenizi takip etmek ve gelişim alanlarınızı belirlemek için kişiselleştirilmiş sınavlar ve ödevler oluşturur.
                  </p>
                </div>
                
                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-neutral-100 relative group">
                  <div className="absolute -right-3 -top-3 w-24 h-24 bg-primary/5 rounded-full -z-10"></div>
                  <div className="bg-gradient-to-br from-primary to-primary-dark p-4 rounded-2xl w-16 h-16 flex items-center justify-center text-white mb-6 group-hover:scale-105 transition-transform">
                    <Users className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Doğrulanmış Öğretmenler</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Platformumuzdaki tüm öğretmenler, konularında uzmanlığa sahip, kaliteli eğitim sağlayan doğrulanmış profesyonellerdir.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
      
      {/* Popular Subjects Section - Improved Design */}
      <section className="py-20 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-neutral-50 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <Badge className="mb-3 px-3 py-1 bg-primary/10 text-primary border-none">
                POPÜLER KONULAR
              </Badge>
              <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
                Uzmanlaşmak İstediğiniz <br className="hidden md:block"/> Alan Hangisi?
              </h2>
            </div>
            <Link href="/subjects">
              <Button variant="success" className="mt-4 md:mt-0 group hover:bg-green-700">
                Tüm Konuları Gör
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
      
      {/* How It Works Section - Improved Design */}
      <section className="py-24 bg-gradient-to-b from-white to-neutral-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute -bottom-24 right-0 w-80 h-80 bg-primary/5 rounded-full"></div>
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-primary/5 rounded-full"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 bg-primary/10 text-primary border-none font-medium">
              NASIL ÇALIŞIR?
            </Badge>
            <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-dark to-primary">
              Öğrenmeye Başlamanın 3 Kolay Adımı
            </h2>
            <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
              Platformumuzla öğrenmeye başlamak çok kolay. Aşağıdaki adımları izleyerek öğrenme yolculuğunuza başlayın.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.length > 0 ? (
              howItWorksSteps.map((step) => (
                <div key={step.id} className="text-center relative px-4 py-6 hover:transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-neutral-100 -z-10"></div>
                  <div className="bg-gradient-to-br from-primary to-primary-dark text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-md">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))
            ) : (
              <>
                <div className="text-center relative px-4 py-6 hover:transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-neutral-100 -z-10"></div>
                  <div className="bg-gradient-to-br from-primary to-primary-dark text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-md">
                    1
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Öğretmenini Bul</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Konu, fiyat ve değerlendirmelere göre doğrulanmış öğretmenlerimiz arasından size uygun olanı seçin.
                  </p>
                </div>
                
                <div className="text-center relative px-4 py-6 hover:transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-neutral-100 -z-10"></div>
                  <div className="bg-gradient-to-br from-primary to-primary-dark text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-md">
                    2
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Ders Planla</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Size uygun bir zamanda ders planlayın. Esnek rezervasyon sistemimiz, uygun zaman dilimlerini bulmanızı kolaylaştırır.
                  </p>
                </div>
                
                <div className="text-center relative px-4 py-6 hover:transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-neutral-100 -z-10"></div>
                  <div className="bg-gradient-to-br from-primary to-primary-dark text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-md">
                    3
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Öğrenmeye Başla</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Canlı video dersinize bağlanın ve kişiselleştirilmiş öğrenme materyallerine, ödevlere ve sınavlara erişin.
                  </p>
                </div>
              </>
            )}
          </div>
          
          <div className="text-center mt-16">
            {isAuthenticated ? (
              <Link href={user?.role === "student" ? "/student-dashboard" : 
                           user?.role === "teacher" ? "/teacher-dashboard" :
                           user?.role === "admin" ? "/admin-dashboard" : "/"}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-8 py-6 shadow-lg shadow-primary/20 font-medium"
                >
                  Panele Git
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-8 py-6 shadow-lg shadow-primary/20 font-medium"
                >
                  Hemen Başla
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
      
      {/* Testimonials Section - Improved Design */}
      <section className="py-24 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent -z-10"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/5 rounded-full"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 bg-primary/10 text-primary border-none font-medium">
              ÖĞRENCİ YORUMLARI
            </Badge>
            <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-dark to-primary">
              Öğrencilerimiz Ne Diyor?
            </h2>
            <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
              Sadece bizim sözümüze güvenmeyin. Platformumuzla öğrenme deneyimlerini dönüştüren öğrencilerimizin yorumlarını dinleyin.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoadingTestimonials ? (
              // Enhanced loading state
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-100 h-64 animate-pulse">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-neutral-200"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                      <div className="h-3 bg-neutral-200 rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 bg-neutral-200 rounded w-full"></div>
                    <div className="h-3 bg-neutral-200 rounded w-full"></div>
                    <div className="h-3 bg-neutral-200 rounded w-3/4"></div>
                  </div>
                </div>
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