import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  School,
  CalendarClock,
  Star,
  Clock,
  Users,
  BarChart,
  ThumbsUp,
  Bookmark,
  Video,
  MessageSquare,
  Calendar as CalendarIcon,
  PlayCircle,
  FileEdit,
  UserCheck,
  Video as VideoIcon,
  Share,
  Dot
} from "lucide-react";

export default function TeacherProfile() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isStudent } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [bookingSubject, setBookingSubject] = useState<string | null>(null);
  const [bookingHours, setBookingHours] = useState<number>(1);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Öğretmen verilerini getir
  const { data: teacher, isLoading } = useQuery({
    queryKey: [`/api/teachers/${id}`],
  });

  // Değerlendirmeleri getir
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: [`/api/reviews?teacherId=${id}`],
  });

  // Öğretmenin derslerini getir
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: [`/api/subjects?teacherId=${id}`],
  });

  // Müsaitlik saatlerini getir
  const { data: availability = [], isLoading: isLoadingAvailability } = useQuery({
    queryKey: [`/api/availability?teacherId=${id}`],
  });

  // Demo veriler (API dönene kadar)
  const demoTeacher = {
    id: parseInt(id || "1"),
    userId: "t1",
    firstName: "Ahmet",
    lastName: "Yılmaz",
    profileImageUrl: null,
    bio: "Matematik ve Fizik alanında 8 yıllık öğretmenlik deneyimine sahibim. Boğaziçi Üniversitesi Matematik bölümü mezunuyum. Öğrencilerime konuları anlaşılır ve eğlenceli bir şekilde aktarmak için çaba gösteriyorum. TYT ve AYT sınavlarına hazırlanan öğrencilere özel ders veriyorum.",
    subjectIds: [1, 3],
    subjectNames: ["Matematik", "Fizik"],
    hourlyRate: 250,
    yearsOfExperience: 8,
    averageRating: 4.7,
    totalReviews: 48,
    totalStudents: 156,
    credentials: ["Boğaziçi Üniversitesi - Matematik Bölümü", "Yüksek Lisans - Fizik", "TÖMER - İngilizce Öğretmenliği Sertifikası"],
    videoIntroUrl: "https://example.com/video.mp4",
    teaching_style: "İnteraktif, Soru-Cevap, Problem çözme odaklı",
    availability: [
      { day: "Pazartesi", startTime: "15:00", endTime: "20:00" },
      { day: "Çarşamba", startTime: "15:00", endTime: "20:00" },
      { day: "Cuma", startTime: "14:00", endTime: "18:00" },
    ]
  };

  const demoReviews = [
    {
      id: 1,
      studentName: "Zeynep K.",
      studentId: "student1",
      rating: 5,
      comment: "Ahmet hoca konuları çok anlaşılır şekilde anlatıyor. Dersten sonra tüm sorularımı cevaplayarak konuyu pekiştirmemi sağladı. Kesinlikle tavsiye ederim!",
      date: "2023-12-15",
      helpful: 12
    },
    {
      id: 2,
      studentName: "Murat D.",
      studentId: "student2",
      rating: 4,
      comment: "Özellikle matematik konusunda zorlanıyordum. Ahmet hoca sayesinde konuları daha iyi anlamaya başladım. Sabırlı ve detaylı anlatımı için teşekkürler.",
      date: "2023-11-22",
      helpful: 8
    },
    {
      id: 3,
      studentName: "Ayşe Y.",
      studentId: "student3",
      rating: 5,
      comment: "Fizik derslerinde formülleri ezberlemek yerine mantığını anlamamı sağladı. Sınav sorularını çözerken artık daha özgüvenli hissediyorum.",
      date: "2023-10-05",
      helpful: 15
    },
  ];

  const demoSubjects = [
    { id: 1, name: "Matematik", icon: "📐", description: "TYT ve AYT sınavlarına yönelik matematik hazırlığı. Temel konulardan başlayarak ileri seviyeye kadar." },
    { id: 3, name: "Fizik", icon: "⚛️", description: "Lise fizik konuları, üniversite sınavına hazırlık, mekanik, elektrik, manyetizma ve modern fizik." }
  ];

  const demoAvailability = [
    { day: 1, slots: ["15:00", "16:00", "17:00", "18:00", "19:00"] },
    { day: 3, slots: ["15:00", "16:00", "17:00", "18:00", "19:00"] },
    { day: 5, slots: ["14:00", "15:00", "16:00", "17:00"] },
  ];

  // API verilerini veya demo verileri göster
  const displayTeacher = teacher || demoTeacher;
  const displayReviews = reviews.length > 0 ? reviews : demoReviews;
  const displaySubjects = subjects.length > 0 ? subjects : demoSubjects;
  const displayAvailability = availability.length > 0 ? availability : demoAvailability;

  // Ders rezervasyonu yapma
  const bookSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      return await apiRequest("POST", "/api/sessions", sessionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions`] });
      toast({
        title: "Rezervasyon başarılı",
        description: "Ders başarıyla planlandı.",
      });
      setIsBookingDialogOpen(false);
      setIsPaymentDialogOpen(true);
      
      // Analitik olay takibi
      trackEvent('book_session', 'user_interaction', `teacher_${id}`);
    },
    onError: (error) => {
      toast({
        title: "Rezervasyon başarısız",
        description: "Ders planlanırken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    },
  });

  // Müsaitlik durumunu kontrol et
  const isDateAvailable = (date: Date) => {
    const day = date.getDay();
    return displayAvailability.some(a => a.day === day && a.slots.length > 0);
  };

  // Ders rezervasyonu yapma
  const handleBookSession = () => {
    if (!isAuthenticated) {
      toast({
        title: "Giriş yapmalısınız",
        description: "Ders rezervasyonu yapmak için giriş yapmalısınız.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!isStudent) {
      toast({
        title: "Erişim reddedildi",
        description: "Yalnızca öğrenciler ders rezervasyonu yapabilir.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate || !selectedTimeSlot || !bookingSubject) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen tarih, saat ve ders konusu seçin.",
        variant: "destructive",
      });
      return;
    }

    // Seçilen saate göre bitiş saatini hesapla
    const [hour, minute] = selectedTimeSlot.split(':').map(Number);
    const startDate = new Date(selectedDate);
    startDate.setHours(hour, minute, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + bookingHours);

    const sessionData = {
      teacherId: displayTeacher.userId,
      studentId: user?.id,
      subjectId: parseInt(bookingSubject),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      status: "pending"
    };

    bookSessionMutation.mutate(sessionData);
  };

  // Favorilere ekleme/çıkarma
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/favorites`, { teacherId: displayTeacher.userId });
    },
    onSuccess: () => {
      toast({
        title: "Favoriler güncellendi",
        description: "Öğretmen favoriler listenize eklendi.",
      });
    },
    onError: () => {
      toast({
        title: "İşlem başarısız",
        description: "Favoriler güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Değerlendirme için faydalı oylama
  const voteHelpfulMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      return await apiRequest("POST", `/api/reviews/${reviewId}/helpful`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reviews?teacherId=${id}`] });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Öğretmen bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol Profil Kartı */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 rounded-md mb-4">
                    {displayTeacher.profileImageUrl ? (
                      <AvatarImage src={displayTeacher.profileImageUrl} alt={`${displayTeacher.firstName} ${displayTeacher.lastName}`} />
                    ) : (
                      <AvatarFallback className="rounded-md bg-primary text-primary-foreground text-2xl">
                        {displayTeacher.firstName.charAt(0)}{displayTeacher.lastName.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <CardTitle className="text-xl text-center">
                    {displayTeacher.firstName} {displayTeacher.lastName}
                  </CardTitle>
                  <div className="flex items-center mt-1 mb-2">
                    <Star className="text-yellow-500 fill-yellow-500 h-4 w-4 mr-1" />
                    <span className="font-medium">{displayTeacher.averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm ml-1">
                      ({displayTeacher.totalReviews} değerlendirme)
                    </span>
                  </div>
                  {displayTeacher.subjectNames.map((subject) => (
                    <Badge key={subject} variant="secondary" className="font-normal mb-1">
                      {subject}
                    </Badge>
                  ))}
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavoriteMutation.mutate()}
                >
                  <Bookmark className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            
            <Separator />
            
            <CardContent className="py-4">
              <div className="space-y-4">
                <div className="flex items-center">
                  <School className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Deneyim</p>
                    <p className="font-medium">{displayTeacher.yearsOfExperience} yıl</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Toplam Öğrenci</p>
                    <p className="font-medium">{displayTeacher.totalStudents} öğrenci</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CalendarClock className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Müsaitlik</p>
                    <p className="font-medium">{displayTeacher.availability.length} gün müsait</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <BarChart className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Saatlik Ücret</p>
                    <p className="font-medium text-lg">{displayTeacher.hourlyRate}₺</p>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <Separator />
            
            <CardFooter className="pt-4 flex-col space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setIsBookingDialogOpen(true)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Ders Planla
              </Button>
              
              {displayTeacher.videoIntroUrl && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Tanıtım Videosunu İzle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Tanıtım Videosu</DialogTitle>
                      <DialogDescription>
                        {displayTeacher.firstName} {displayTeacher.lastName} öğretmenin tanıtım videosu
                      </DialogDescription>
                    </DialogHeader>
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <Video className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground ml-2">Video oynatıcı</p>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              <Button variant="outline" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Mesaj Gönder
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Sağ İçerik Alanı */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="about">
            <TabsList className="mb-6">
              <TabsTrigger value="about">Hakkında</TabsTrigger>
              <TabsTrigger value="subjects">Dersler</TabsTrigger>
              <TabsTrigger value="reviews">
                Değerlendirmeler ({displayReviews.length})
              </TabsTrigger>
              <TabsTrigger value="availability">Takvim</TabsTrigger>
            </TabsList>
            
            {/* Hakkında Sekmesi */}
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>Öğretmen Hakkında</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Biyografi</h3>
                    <p className="text-muted-foreground">{displayTeacher.bio}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Eğitim & Sertifikalar</h3>
                    <ul className="space-y-2">
                      {displayTeacher.credentials.map((credential, index) => (
                        <li key={index} className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
                          <span>{credential}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Öğretim Stili</h3>
                    <p className="text-muted-foreground">{displayTeacher.teaching_style}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Dersler Sekmesi */}
            <TabsContent value="subjects">
              <div className="space-y-4">
                {displaySubjects.map((subject) => (
                  <Card key={subject.id}>
                    <div className="p-6">
                      <div className="flex items-start">
                        <div className="bg-primary/10 p-3 rounded-md text-2xl mr-4">
                          {subject.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">{subject.name}</h3>
                          <p className="text-muted-foreground mt-1">{subject.description}</p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button 
                          onClick={() => {
                            setBookingSubject(subject.id.toString());
                            setIsBookingDialogOpen(true);
                          }}
                        >
                          Ders Planla
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* Değerlendirmeler Sekmesi */}
            <TabsContent value="reviews">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Öğrenci Değerlendirmeleri</CardTitle>
                    <div className="flex items-center">
                      <Star className="text-yellow-500 fill-yellow-500 h-5 w-5 mr-2" />
                      <span className="font-bold text-lg">
                        {displayTeacher.averageRating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        ({displayTeacher.totalReviews} yorum)
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {displayReviews.map((review) => (
                      <div key={review.id} className="pb-6 border-b last:border-0">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start">
                            <Avatar className="h-9 w-9 mr-3">
                              <AvatarFallback>
                                {review.studentName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{review.studentName}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(review.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="mt-4 text-gray-600">{review.comment}</p>
                        <div className="flex items-center justify-end mt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => voteHelpfulMutation.mutate(review.id)}
                            className="text-xs"
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Faydalı ({review.helpful})
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Müsaitlik Sekmesi */}
            <TabsContent value="availability">
              <Card>
                <CardHeader>
                  <CardTitle>Ders Planlamak İçin Müsait Zamanlar</CardTitle>
                  <CardDescription>
                    Müsait günler ve saatler için takvimi inceleyin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="border rounded-md p-3"
                        modifiers={{
                          available: (date) => isDateAvailable(date),
                        }}
                        modifiersClassNames={{
                          available: "bg-primary/10 text-primary font-medium hover:bg-primary/20",
                        }}
                      />
                      <div className="flex items-center text-sm mt-2 justify-end">
                        <div className="inline-flex items-center mr-4">
                          <div className="h-3 w-3 bg-primary/10 rounded-sm mr-1"></div>
                          <span>Müsait Gün</span>
                        </div>
                        <div className="inline-flex items-center">
                          <div className="h-3 w-3 bg-primary rounded-sm mr-1"></div>
                          <span>Seçilen Tarih</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-4">
                        {selectedDate ? (
                          <>
                            {selectedDate.toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })} 
                            <span className="text-muted-foreground font-normal">
                              {' - '}
                              {selectedDate.toLocaleDateString('tr-TR', { weekday: 'long' })}
                            </span>
                          </>
                        ) : (
                          "Tarih seçilmedi"
                        )}
                      </h3>
                      
                      {selectedDate && isDateAvailable(selectedDate) ? (
                        <>
                          <div className="grid grid-cols-3 gap-2 mb-6">
                            {displayAvailability
                              .find(a => a.day === selectedDate.getDay())
                              ?.slots.map((time) => (
                                <Button
                                  key={time}
                                  variant={selectedTimeSlot === time ? "default" : "outline"}
                                  onClick={() => setSelectedTimeSlot(time)}
                                  className="text-sm"
                                >
                                  {time}
                                </Button>
                              ))}
                          </div>
                          
                          {selectedTimeSlot && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Ders Süresi
                                </label>
                                <Select 
                                  value={bookingHours.toString()} 
                                  onValueChange={(value) => setBookingHours(parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Süre seçin" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1 saat</SelectItem>
                                    <SelectItem value="2">2 saat</SelectItem>
                                    <SelectItem value="3">3 saat</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Ders Konusu
                                </label>
                                <Select 
                                  value={bookingSubject} 
                                  onValueChange={setBookingSubject}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Konu seçin" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {displaySubjects.map((subject) => (
                                      <SelectItem key={subject.id} value={subject.id.toString()}>
                                        {subject.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <Button
                                className="w-full"
                                onClick={() => setIsBookingDialogOpen(true)}
                              >
                                Ders Planla
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 bg-muted/50 rounded-lg">
                          <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            {selectedDate
                              ? "Seçilen tarihte müsait zaman dilimi bulunmuyor."
                              : "Lütfen takvimden bir tarih seçin."}
                          </p>
                          {selectedDate && (
                            <Button
                              variant="link"
                              className="mt-2"
                              onClick={() => {
                                const availableDay = displayAvailability[0]?.day;
                                if (availableDay !== undefined) {
                                  const today = new Date();
                                  const daysToAdd = (availableDay - today.getDay() + 7) % 7;
                                  const nextAvailableDate = new Date(today);
                                  nextAvailableDate.setDate(today.getDate() + daysToAdd);
                                  setSelectedDate(nextAvailableDate);
                                }
                              }}
                            >
                              İlk müsait güne git
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Ders Planlama Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ders Rezervasyonu</DialogTitle>
            <DialogDescription>
              Lütfen rezervasyon detaylarını onaylayın.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Öğretmen</h4>
                <p>{displayTeacher.firstName} {displayTeacher.lastName}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Konu</h4>
                <p>
                  {bookingSubject
                    ? displaySubjects.find(s => s.id.toString() === bookingSubject)?.name
                    : "Seçilmedi"}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Süre</h4>
                <p>{bookingHours} saat</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Tarih</h4>
                <p>
                  {selectedDate
                    ? selectedDate.toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        weekday: 'long'
                      })
                    : "Seçilmedi"}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Saat</h4>
                <p>
                  {selectedTimeSlot
                    ? `${selectedTimeSlot} - ${(() => {
                        const [hour, minute] = selectedTimeSlot.split(':').map(Number);
                        const endTime = new Date();
                        endTime.setHours(hour + bookingHours, minute);
                        return `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
                      })()}`
                    : "Seçilmedi"}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-medium">Toplam Ücret</h4>
                <p className="text-xl font-semibold">
                  {(displayTeacher.hourlyRate * bookingHours).toLocaleString('tr-TR')}₺
                </p>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {displayTeacher.hourlyRate}₺ × {bookingHours} saat
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleBookSession}>
              Rezervasyon Yap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ödeme Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödeme İşlemi</DialogTitle>
            <DialogDescription>
              Rezervasyonunuz alındı. Ödeme işlemine devam edin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Ders Ücreti</span>
                <span>{(displayTeacher.hourlyRate * bookingHours).toLocaleString('tr-TR')}₺</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Platform Komisyonu</span>
                <span>{(displayTeacher.hourlyRate * bookingHours * 0.10).toLocaleString('tr-TR')}₺</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Toplam</span>
                <span>{(displayTeacher.hourlyRate * bookingHours * 1.10).toLocaleString('tr-TR')}₺</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Kart Bilgileri</h4>
              <div className="space-y-2">
                <Input placeholder="Kart Numarası" />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Son Kullanma Tarihi (AA/YY)" />
                  <Input placeholder="CVV" />
                </div>
                <Input placeholder="Kart Sahibinin Adı" />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              İptal
            </Button>
            <Link href="/dashboard">
              <Button>
                Ödemeyi Tamamla
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}