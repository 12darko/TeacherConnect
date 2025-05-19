import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

// İşlem tipi tanımı
type Transaction = {
  id: string;
  date: string;
  type: "deposit" | "withdrawal" | "commission";
  amount: number;
  status: "pending" | "completed" | "failed";
  studentName?: string;
  description?: string;
};

// Ders planlama bileşeni
import SessionFormDialog from "@/components/ui/CreateSessionForm";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { EarningsCardDemo } from "@/components/ui/teacher/EarningsCardDemo";
import { 
  Users, 
  Clock, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  Star, 
  BookOpen,
  PlusCircle,
  ArrowRight,
  Check,
  X,
  GraduationCap,
  CreditCard
} from "lucide-react";
import { format, addHours } from "date-fns";
import { tr } from "date-fns/locale";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Haftalık takvim bileşeni
const WeeklySchedule = ({ sessions = [] }: { sessions: any[] }) => {
  const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00
  
  // Gün ve saate göre dersleri grupla
  const sessionsByDayAndHour = days.map(day => {
    return hours.map(hour => {
      return sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        const sessionDay = format(sessionDate, 'EEEE', { locale: tr });
        const sessionHour = sessionDate.getHours();
        return sessionDay === day && sessionHour === hour;
      });
    });
  });
  
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="grid grid-cols-8 bg-muted/50">
        <div className="p-2 text-sm font-medium text-center border-r">Saat</div>
        {days.map(day => (
          <div key={day} className="p-2 text-sm font-medium text-center border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-8">
        {/* Saat sütunu */}
        <div className="border-r">
          {hours.map(hour => (
            <div key={hour} className="h-16 p-2 text-xs text-center border-b last:border-b-0">
              {hour}:00
            </div>
          ))}
        </div>
        
        {/* Günler ve dersler */}
        {days.map((day, dayIndex) => (
          <div key={day} className="border-r last:border-r-0">
            {hours.map((hour, hourIndex) => {
              const sessionsAtThisTime = sessionsByDayAndHour[dayIndex][hourIndex];
              return (
                <div key={`${day}-${hour}`} className="h-16 p-1 border-b last:border-b-0 relative">
                  {sessionsAtThisTime.length > 0 ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <div 
                          className="absolute inset-1 bg-primary/80 text-white rounded-md flex items-center justify-center cursor-pointer text-xs hover:bg-primary"
                        >
                          {sessionsAtThisTime.length} Ders
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0">
                        <div className="p-3 border-b">
                          <h4 className="font-medium">{day}, {hour}:00</h4>
                          <p className="text-xs text-muted-foreground">{sessionsAtThisTime.length} ders planlandı</p>
                        </div>
                        <div className="max-h-80 overflow-auto">
                          {sessionsAtThisTime.map(session => (
                            <div key={session.id} className="p-3 border-b last:border-b-0">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium">{session.subjectName}</h5>
                                <Badge variant={
                                  session.status === "completed" ? "success" :
                                  session.status === "cancelled" ? "destructive" :
                                  "secondary"
                                }>
                                  {session.status === "completed" ? "Tamamlandı" :
                                   session.status === "cancelled" ? "İptal Edildi" :
                                   "Bekliyor"}
                                </Badge>
                              </div>
                              <p className="text-sm mt-1">Öğrenci: {session.studentName}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(session.startTime), 'dd MMMM HH:mm', { locale: tr })}
                                </span>
                                <Link href={`/classroom/${session.id}`}>
                                  <Button size="sm" variant="outline">
                                    Derse Git
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Öğrenci talebi bileşeni
interface SessionRequestProps {
  id: number;
  studentName: string;
  studentAvatar?: string;
  subject: string;
  date: Date;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
}

const SessionRequest = ({
  id,
  studentName,
  studentAvatar,
  subject,
  date,
  onAccept,
  onReject
}: SessionRequestProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 mr-3 flex items-center justify-center overflow-hidden">
          {studentAvatar ? (
            <img src={studentAvatar} alt={studentName} className="w-full h-full object-cover" />
          ) : (
            <GraduationCap className="h-6 w-6 text-primary/40" />
          )}
        </div>
        <div>
          <h4 className="font-medium">{studentName}</h4>
          <div className="flex items-center text-sm text-muted-foreground">
            <BookOpen className="mr-1 h-3.5 w-3.5" />
            <span>{subject}</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground mt-0.5">
            <CalendarIcon className="mr-1 h-3.5 w-3.5" />
            <span>{format(date, 'dd MMMM yyyy HH:mm', { locale: tr })}</span>
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => onReject(id)}>
          <X className="h-4 w-4" />
        </Button>
        <Button size="sm" className="h-8 w-8 p-0" onClick={() => onAccept(id)}>
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Ders oluşturma formu için tanımlama
const createSessionSchema = z.object({
  studentId: z.string().min(1, "Öğrenci seçmelisiniz"),
  subjectId: z.string().min(1, "Konu seçmelisiniz"),
  date: z.date({
    required_error: "Ders tarihini seçmelisiniz",
  }),
  time: z.string().min(1, "Ders saatini seçmelisiniz"),
  duration: z.string().min(1, "Ders süresini seçmelisiniz"),
});

// Eski ders oluşturma formu bileşeni - artık kullanılmıyor
function OldCreateSessionForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  
  // Öğrenci listesi için query
  const { data: students = [] } = useQuery<any[]>({
    queryKey: ['/api/users/students'],
    queryFn: async () => {
      const response = await fetch(`/api/users?role=student`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      return response.json();
    },
  });
  
  // Konu listesi için query
  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ['/api/subjects'],
    queryFn: async () => {
      const response = await fetch('/api/subjects');
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      return response.json();
    },
  });

  // Form tanımlaması
  const form = useForm<z.infer<typeof createSessionSchema>>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      studentId: "",
      subjectId: "",
      time: "10:00",
      duration: "60",
    },
  });

  // Form gönderildiğinde çalışacak fonksiyon
  const onSubmit = async (values: z.infer<typeof createSessionSchema>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Başlangıç ve bitiş zamanlarını hesapla
      const startTime = new Date(values.date);
      const [hours, minutes] = values.time.split(':').map(Number);
      startTime.setHours(hours, minutes, 0, 0);
      
      // Bitiş zamanını dakika olarak verilen süre kadar ilerlet
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + parseInt(values.duration));
      
      // API'ye gönderilecek veri
      const sessionData = {
        teacherId: user.id,
        studentId: values.studentId,
        subjectId: parseInt(values.subjectId),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: "scheduled",
        sessionUrl: `/classroom/${Date.now()}`, // Benzersiz URL oluştur
      };
      
      // API isteği yap
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      
      if (!response.ok) {
        throw new Error('Ders oluşturulurken bir hata oluştu');
      }
      
      const result = await response.json();
      
      // Başarı mesajı göster
      toast({
        title: "Ders başarıyla oluşturuldu",
        description: `${values.time} saatinde ders oluşturuldu.`,
      });
      
      // Query cache'i güncelle ve modalı kapat
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/pending'] });
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Ders oluşturulurken hata:", error);
      toast({
        title: "Hata",
        description: "Ders oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Yeni Ders Oluştur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Ders Oluştur</DialogTitle>
          <DialogDescription>
            Yeni bir ders oluşturmak için aşağıdaki formu doldurun.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Öğrenci</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Öğrenci seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.firstName} {student.lastName || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konu</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Konu seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tarih</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "dd MMMM yyyy", { locale: tr })
                          ) : (
                            <span>Tarih seçin</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saat</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Saat seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 14 }, (_, i) => {
                          const hour = i + 8; // 8:00'den 21:00'e kadar
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Süre (dakika)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Süre seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">30 dakika</SelectItem>
                        <SelectItem value="60">60 dakika</SelectItem>
                        <SelectItem value="90">90 dakika</SelectItem>
                        <SelectItem value="120">120 dakika</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                )}
                Ders Oluştur
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Ana öğretmen dashboard bileşeni
export default function TeacherDashboard() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const initialTab = urlParams.get("tab") || "overview";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Öğretmenin ders oturumlarını getir
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery<any[]>({
    queryKey: ['/api/sessions', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/sessions?teacherId=${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Bekleyen ders taleplerini getir
  const { data: pendingRequests = [], isLoading: isLoadingRequests } = useQuery<any[]>({
    queryKey: ['/api/sessions/pending', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/sessions?teacherId=${user?.id}&status=pending`);
      if (!response.ok) {
        throw new Error('Failed to fetch pending requests');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Öğretmene gelen yorumları getir
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery<any[]>({
    queryKey: ['/api/reviews', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/reviews?teacherId=${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Öğretmenin profilini getir
  const { data: profile = {}, isLoading: isLoadingProfile } = useQuery<any>({
    queryKey: ['/api/teachers/profile', user?.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/teachers/profile?userId=${user?.id}`);
        if (response.status === 404) {
          return { notFound: true };
        }
        if (!response.ok) {
          throw new Error('Failed to fetch teacher profile');
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching teacher profile:", error);
        return { error: true };
      }
    },
    enabled: !!user?.id,
  });
  
  // Demo işlemler - gerçek uygulamada API'dan gelir
  const demoTransactions = [
    {
      id: "tx1",
      date: "2023-05-15T14:30:00Z",
      type: "deposit" as const,
      amount: 250,
      status: "completed" as const,
      studentName: "Ahmet Yılmaz",
      description: "Matematik dersi ödemesi"
    },
    {
      id: "tx2",
      date: "2023-05-12T10:15:00Z",
      type: "deposit" as const,
      amount: 250,
      status: "completed" as const,
      studentName: "Zeynep Kaya",
      description: "Matematik dersi ödemesi"
    },
    {
      id: "tx3",
      date: "2023-05-10T16:45:00Z",
      type: "commission" as const,
      amount: 50,
      status: "completed" as const,
      description: "Platform komisyonu"
    },
    {
      id: "tx4",
      date: "2023-05-05T09:20:00Z",
      type: "withdrawal" as const,
      amount: 400,
      status: "completed" as const,
      description: "Banka hesabına transfer"
    },
    {
      id: "tx5",
      date: "2023-05-01T11:00:00Z",
      type: "deposit" as const,
      amount: 250,
      status: "completed" as const,
      studentName: "Murat Demir",
      description: "Fizik dersi ödemesi"
    }
  ];
  
  // Giriş yapmamış veya öğretmen olmayan kullanıcıları kontrol et
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Erişim Reddedildi</h2>
        <p className="text-muted-foreground mb-6">Öğretmen paneline erişmek için giriş yapmanız gerekiyor.</p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => window.location.href = "/api/login"}>Giriş Yap</Button>
          <Button size="lg" variant="outline" onClick={() => window.location.href = "/"}>Ana Sayfaya Git</Button>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }
  
  // Sayfa içeriği
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-1">Öğretmen Paneli</h1>
          <p className="text-muted-foreground">Hoş geldiniz, {user?.firstName || user?.email}</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <SessionFormDialog />
          <Link href="/create-exam">
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Sınav Oluştur
            </Button>
          </Link>
          <Link href={`/teacher/${user?.id}`}>
            <Button>
              <BookOpen className="mr-2 h-4 w-4" />
              Profilimi Görüntüle
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="schedule">Ders Programı</TabsTrigger>
          <TabsTrigger value="students">
            Öğrenciler
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="earnings">Kazançlar</TabsTrigger>
        </TabsList>
        
        {/* Genel Bakış Sekmesi */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Bugün</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingSessions ? "..." : 
                    sessions.filter((s: any) => 
                      new Date(s.startTime).toDateString() === new Date().toDateString()
                    ).length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <CalendarIcon className="mr-1 h-4 w-4" />
                  Bugünkü dersler
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Toplam Öğrenci</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingProfile ? "..." : profile?.totalStudents || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  Aktif öğrenciler
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Toplam Saat</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingSessions ? "..." : 
                    sessions.filter((s: any) => s.status === "completed").length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  Tamamlanan dersler
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Değerlendirme</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingProfile ? "..." : 
                    profile?.averageRating ? profile.averageRating.toFixed(1) : "N/A"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Star className="mr-1 h-4 w-4" />
                  {isLoadingReviews ? "..." : reviews.length} değerlendirme
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Kazanç Özeti - Genel Bakış Sekmesinde */}
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle>Bu Ayki Kazanç</CardTitle>
                  <CardDescription>Aylık gelir durumunuz</CardDescription>
                </div>
                <Link href="#" onClick={() => setActiveTab("earnings")}>
                  <Button variant="ghost" className="text-sm">
                    Tüm kazançları görüntüle
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-sm">Toplam Kazanç</h4>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-700">12.850₺</p>
                  <p className="text-xs text-green-600 mt-1">+14% geçen aya göre</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-sm">Çekilebilir</h4>
                    <CreditCard className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-blue-700">7.600₺</p>
                  <p className="text-xs text-blue-600 mt-1">3 bekleyen ödeme</p>
                </div>
                
                <div className="p-4 bg-red-50 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-sm">Platform Komisyonu</h4>
                    <DollarSign className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-700">1.285₺</p>
                  <p className="text-xs text-red-600 mt-1">%10 komisyon</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ders Talepleri */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Bekleyen Talepler</CardTitle>
                <CardDescription>Öğrencilerden gelen ders talepleri</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="text-center py-6">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Talepler yükleniyor...</p>
                  </div>
                ) : pendingRequests.length > 0 ? (
                  <div className="border rounded-md">
                    {pendingRequests.slice(0, 5).map((request: any) => (
                      <SessionRequest
                        key={request.id}
                        id={request.id}
                        studentName={request.studentName}
                        studentAvatar={request.studentAvatar}
                        subject={request.subjectName}
                        date={new Date(request.startTime)}
                        onAccept={(id) => {
                          // Kabul işlevi burada uygulanacak
                          console.log(`Accepted request ${id}`);
                        }}
                        onReject={(id) => {
                          // Reddetme işlevi burada uygulanacak
                          console.log(`Rejected request ${id}`);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/50 rounded-md">
                    <BookOpen className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="mt-2 font-medium">Bekleyen talep yok</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Şu anda öğrencilerden bekleyen ders talebi bulunmuyor.
                    </p>
                  </div>
                )}
              </CardContent>
              {pendingRequests.length > 5 && (
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setActiveTab("students")}
                  >
                    Tüm Talepleri Görüntüle ({pendingRequests.length})
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            {/* Yaklaşan Dersler */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Bugünkü Dersler</CardTitle>
                <CardDescription>Bugün için planlanmış dersleriniz</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSessions ? (
                  <div className="text-center py-6">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Dersler yükleniyor...</p>
                  </div>
                ) : sessions.filter((s: any) => 
                    new Date(s.startTime).toDateString() === new Date().toDateString()
                  ).length > 0 ? (
                  <div className="space-y-4">
                    {sessions
                      .filter((s: any) => 
                        new Date(s.startTime).toDateString() === new Date().toDateString()
                      )
                      .sort((a: any, b: any) => 
                        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                      )
                      .map((session: any) => (
                        <div key={session.id} className="flex items-start border-b pb-4">
                          <div className="bg-primary/10 text-primary p-2 rounded-md mr-4">
                            <CalendarIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{session.subjectName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Öğrenci: {session.studentName}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(session.startTime), 'HH:mm', { locale: tr })} - 
                              {format(new Date(session.endTime), 'HH:mm', { locale: tr })}
                            </p>
                          </div>
                          {new Date() >= new Date(session.startTime) && new Date() <= new Date(session.endTime) ? (
                            <Button asChild>
                              <Link href={`/classroom/${session.id}`}>
                                Derse Katıl
                              </Link>
                            </Button>
                          ) : (
                            <Badge>
                              {new Date() < new Date(session.startTime) 
                                ? `${Math.floor((new Date(session.startTime).getTime() - new Date().getTime()) / (1000 * 60))} dk kaldı` 
                                : "Tamamlandı"}
                            </Badge>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/50 rounded-md">
                    <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="mt-2 font-medium">Bugün dersiniz yok</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Bugün için planlanmış bir dersiniz bulunmuyor.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setActiveTab("schedule")}
                >
                  Tüm Program
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Ders Programı Sekmesi */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Ders Programı</CardTitle>
                  <CardDescription>Haftalık ders planınızı görüntüleyin ve yönetin</CardDescription>
                </div>
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="ml-auto">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span>{selectedDate ? format(selectedDate, 'PPPP', { locale: tr }) : 'Tarih seçin'}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-4 text-muted-foreground">Program yükleniyor...</p>
                </div>
              ) : (
                <WeeklySchedule sessions={sessions} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Öğrenciler Sekmesi */}
        <TabsContent value="students">
          <div className="grid grid-cols-1 gap-6">
            {/* Bekleyen Talepler */}
            <Card>
              <CardHeader>
                <CardTitle>Bekleyen Ders Talepleri</CardTitle>
                <CardDescription>Öğrencilerden gelen ders taleplerini yönetin</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="text-center py-6">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Talepler yükleniyor...</p>
                  </div>
                ) : pendingRequests.length > 0 ? (
                  <div className="border rounded-md">
                    {pendingRequests.map((request: any) => (
                      <SessionRequest
                        key={request.id}
                        id={request.id}
                        studentName={request.studentName}
                        studentAvatar={request.studentAvatar}
                        subject={request.subjectName}
                        date={new Date(request.startTime)}
                        onAccept={(id) => {
                          // Kabul işlevi burada uygulanacak
                          console.log(`Accepted request ${id}`);
                        }}
                        onReject={(id) => {
                          // Reddetme işlevi burada uygulanacak
                          console.log(`Rejected request ${id}`);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/50 rounded-md">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="mt-2 font-medium">Bekleyen talep yok</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Şu anda öğrencilerden bekleyen ders talebi bulunmuyor.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Bu bölümde öğrenci listeleri ve diğer öğrenci yönetimi özellikleri eklenebilir */}
          </div>
        </TabsContent>
        
        {/* Kazançlar Sekmesi */}
        <TabsContent value="earnings">
          <div className="space-y-6">
            <EarningsCardDemo
              totalEarnings={12850}
              pendingEarnings={7600}
              withdrawnEarnings={4950}
              recentTransactions={demoTransactions}
              loadingTransactions={false}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Kazanç İstatistikleri</CardTitle>
                <CardDescription>
                  Aylık ve yıllık kazanç dağılımınız
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full bg-muted/50 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Gelir grafiği burada gösterilecek
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-muted/30 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Saatlik Ortalama</h3>
                    <p className="text-2xl font-bold">{profile?.hourlyRate || 250}₺</p>
                    <p className="text-xs text-muted-foreground mt-1">Standart ücretiniz</p>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-md">
                    <h3 className="text-sm font-medium mb-2">En Yüksek Kazanç</h3>
                    <p className="text-2xl font-bold">3.250₺</p>
                    <p className="text-xs text-muted-foreground mt-1">Nisan 2025</p>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Yıllık Projeksiyon</h3>
                    <p className="text-2xl font-bold">42.500₺</p>
                    <p className="text-xs text-muted-foreground mt-1">Mevcut trendinize göre</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ödeme Ayarları</CardTitle>
                <CardDescription>
                  Banka hesabı ve ödeme tercihlerinizi yönetin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-medium">Banka Hesabı</h3>
                    <div className="p-4 border rounded-md">
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-full mr-3">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Akbank</p>
                          <p className="text-sm text-muted-foreground">**** **** **** 5678</p>
                        </div>
                      </div>
                      <div className="mt-4 text-right">
                        <Button variant="outline" size="sm">Değiştir</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Ödeme Takvimi</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 border-b">
                        <span className="text-sm">Ödeme sıklığı</span>
                        <span className="text-sm font-medium">İki haftada bir</span>
                      </div>
                      <div className="flex justify-between p-2 border-b">
                        <span className="text-sm">Sonraki ödeme</span>
                        <span className="text-sm font-medium">15 Haziran 2025</span>
                      </div>
                      <div className="flex justify-between p-2 border-b">
                        <span className="text-sm">Tahmini tutar</span>
                        <span className="text-sm font-medium">2.750₺</span>
                      </div>
                      <div className="flex justify-between p-2">
                        <span className="text-sm">Platform komisyonu</span>
                        <span className="text-sm font-medium">%10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline">İptal</Button>
                <Button>Değişiklikleri Kaydet</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}