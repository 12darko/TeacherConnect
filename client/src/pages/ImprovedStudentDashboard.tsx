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

// Yeni bileşenleri içe aktarıyoruz
import { PerformanceChart } from "@/components/ui/dashboard/PerformanceChart";
import { CountdownTimer } from "@/components/ui/dashboard/CountdownTimer";
import { ProgressCard } from "@/components/ui/dashboard/ProgressCard";
import { AISuggestionCard } from "@/components/ui/dashboard/AISuggestionCard";
import { ExamResultCard } from "@/components/ui/dashboard/ExamResultCard";

export default function ImprovedStudentDashboard() {
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
  
  // Fetch last exam result
  const { data: lastExam, isLoading: isLoadingLastExam } = useQuery({
    queryKey: [`/api/exam-assignments?studentId=${user?.id}&completed=true&limit=1`],
    enabled: !!user?.id,
  });
  
  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-4">Erişim Reddedildi</h2>
        <p className="text-neutral-medium mb-6">Dashboard'u görüntülemek için giriş yapmanız gerekiyor.</p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => window.location.href = "/api/login"}>Giriş Yap</Button>
          <Button size="lg" variant="outline" onClick={() => window.location.href = "/"}>Ana Sayfaya Git</Button>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-neutral-medium">Dashboard yükleniyor...</p>
      </div>
    );
  }
  
  // Find next session (if any)
  const nextSession = upcomingSessions.length > 0 
    ? upcomingSessions.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]
    : null;
  
  const nextSessionDate = nextSession ? new Date(nextSession.startTime) : undefined;
  
  // Calculate last exam result
  const lastExamResult = lastExam?.length > 0 ? lastExam[0] : null;
  
  // Count pending assignments
  const pendingAssignmentCount = examAssignments.filter((assignment: any) => !assignment.completed).length;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-1">Öğrenci Paneli</h1>
          <p className="text-neutral-medium">Hoş geldin, {user?.firstName || user?.email}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/find-teachers">
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Öğretmen Bul
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 md:grid-cols-4 lg:w-[800px]">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="sessions">Derslerim</TabsTrigger>
          <TabsTrigger value="assignments">
            Sınavlarım
            {pendingAssignmentCount > 0 && (
              <span className="ml-2 rounded-full bg-primary text-white text-xs px-2 py-0.5">
                {pendingAssignmentCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="progress">İlerleme</TabsTrigger>
        </TabsList>
        
        {/* Genel Bakış Sekmesi - İyileştirilmiş ve yeni bileşenler eklenmiş */}
        <TabsContent value="overview">
          {/* İlk Satır: Hızlı İstatistikler ve AI Önerisi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Ders Geri Sayımı */}
            <CountdownTimer 
              targetDate={nextSessionDate} 
              title={nextSession ? nextSession.subjectName : "Sonraki Dersiniz"}
              description={nextSession ? `${nextSession.teacherName} ile ders` : "Ders başlayana kadar kalan süre"}
            />
            
            {/* Son Sınav Sonucu */}
            {lastExamResult ? (
              <ExamResultCard 
                examId={lastExamResult.examId}
                examTitle={lastExamResult.examTitle}
                score={lastExamResult.score}
                maxScore={100}
                passThreshold={70}
                completedAt={new Date(lastExamResult.submittedAt)}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Sınav Sonucu</CardTitle>
                </CardHeader>
                <CardContent className="py-6 text-center">
                  <Book className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-2" />
                  <p className="text-sm text-muted-foreground">Henüz tamamlanmış sınavınız yok</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-primary"
                    onClick={() => setActiveTab("assignments")}
                  >
                    Sınavları Görüntüle
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {/* AI Önerisi */}
            <AISuggestionCard type="study" />
          </div>
          
          {/* İkinci Satır: Performans Grafiği ve İlerleme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Performans Grafiği */}
            <PerformanceChart />
            
            {/* İlerleme Kartları */}
            <ProgressCard 
              title="Haftalık Ödev Tamamlama" 
              value={stats?.weeklyCompletedAssignments || 4} 
              target={5} 
              icon="target"
              description="Haftalık ödev tamamlama hedefine kalan"
            />
            
            <ProgressCard 
              title="Aylık İlerleme" 
              value={stats?.monthlyProgress || 65} 
              target={100} 
              icon="trophy"
              description="Aylık hedeflerinize göre ilerleme durumunuz"
            />
          </div>
          
          {/* Üçüncü Satır: İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Toplam Dersler</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingStats ? "..." : stats?.totalSessions || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  Tamamlanan dersler
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Öğrenme Saati</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingStats ? "..." : stats?.totalHours || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  Toplam öğrenme süresi
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tamamlanan Sınavlar</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingStats ? "..." : stats?.examsCompleted || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Book className="mr-1 h-4 w-4" />
                  Ort. skor: {isLoadingStats ? "..." : `${stats?.averageScore || 0}%`}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Öğrenme Serisi</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingStats ? "..." : stats?.learningStreak || 0} gün
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <BadgeCheck className="mr-1 h-4 w-4" />
                  Son aktif: {isLoadingStats ? "..." : stats?.lastActivity ? new Date(stats.lastActivity).toLocaleDateString('tr-TR') : "Hiç"}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Dördüncü Satır: Gelecek Dersler ve Sınavlar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Yaklaşan Dersler</CardTitle>
                <CardDescription>Planlanmış öğrenme dersleriniz</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSessions ? (
                  <div className="text-center py-6">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Dersler yükleniyor...</p>
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
                          <p className="text-sm text-muted-foreground">öğretmen: {session.teacherName}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(session.startTime).toLocaleDateString('tr-TR')} - {new Date(session.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/50 rounded-md">
                    <Calendar className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="mt-2 font-medium">Yaklaşan ders yok</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Başlamak için bir öğretmen ile ders planlayın.</p>
                    <Link href="/find-teachers">
                      <Button>Öğretmen Bul</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
              {upcomingSessions.length > 0 && (
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("sessions")}>
                    Tüm Dersleri Görüntüle
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Bekleyen Sınavlar</CardTitle>
                <CardDescription>Öğretmenleriniz tarafından atanan sınavlar</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAssignments ? (
                  <div className="text-center py-6">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Sınavlar yükleniyor...</p>
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
                            <p className="text-sm text-muted-foreground">atayan: {assignment.teacherName}</p>
                            {assignment.dueDate && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Son teslim: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                              </p>
                            )}
                          </div>
                          <Link href={`/exam/${assignment.id}`}>
                            <Button size="sm">Başla</Button>
                          </Link>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/50 rounded-md">
                    <Book className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="mt-2 font-medium">Bekleyen sınav yok</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Şu anda tamamlamanız gereken sınav bulunmuyor.
                    </p>
                  </div>
                )}
              </CardContent>
              {examAssignments.filter((a: any) => !a.completed).length > 0 && (
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("assignments")}>
                    Tüm Sınavları Görüntüle
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>
        
        {/* Diğer sekmeleri buraya ekleyebilirsiniz */}
        <TabsContent value="sessions">
          {/* Mevcut dersler sekme içeriğini buraya ekleyin */}
        </TabsContent>
        
        <TabsContent value="assignments">
          {/* Mevcut sınavlar sekme içeriğini buraya ekleyin */}
        </TabsContent>
        
        <TabsContent value="progress">
          {/* İlerleme sekme içeriğini buraya ekleyin */}
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Detaylı Performans Analizi</CardTitle>
                <CardDescription>Öğrenme sürecinizde kaydettiğiniz ilerlemeyi görüntüleyin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <PerformanceChart />
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ProgressCard 
                title="Dil Bilgisi" 
                value={stats?.grammarProgress || 78}
                target={100}
                icon="trophy" 
                description="Dilbilgisi konularındaki ilerlemeniz"
              />
              
              <ProgressCard 
                title="Matematik" 
                value={stats?.mathProgress || 62}
                target={100}
                icon="trophy" 
                description="Matematik konularındaki ilerlemeniz"
              />
              
              <ProgressCard 
                title="Fen Bilimleri" 
                value={stats?.scienceProgress || 85}
                target={100}
                icon="trophy" 
                description="Fen bilimleri konularındaki ilerlemeniz"
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>AI Destekli İlerleme Önerileri</CardTitle>
                <CardDescription>Yapay zeka algoritmamızın öğrenme süreciniz için önerileri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-md flex gap-4">
                  <div className="bg-primary/10 text-primary p-2 rounded-full h-10 w-10 flex items-center justify-center">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Matematik Çalışmanı Artır</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Matematik dersinde ortalama skorunuz diğer derslere göre daha düşük. Haftalık 2 saat daha çalışmanızı öneriyoruz.
                    </p>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-md flex gap-4">
                  <div className="bg-primary/10 text-primary p-2 rounded-full h-10 w-10 flex items-center justify-center">
                    <Book className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Fen Bilimleri: Güçlü Alanın</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fen bilimleri konularında mükemmel ilerleme kaydediyorsunuz. Bu alanda ileri seviye konuları keşfetmeyi düşünebilirsiniz.
                    </p>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-md flex gap-4">
                  <div className="bg-primary/10 text-primary p-2 rounded-full h-10 w-10 flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Düzenli Çalışma Önerisi</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hafta içi her gün en az 45 dakika çalışma düzenini sürdürmeniz, öğrenme kalitenizi %30'a kadar artırabilir.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/ai-tutor">
                  <Button variant="outline" className="w-full">
                    AI Tutor ile Detaylı Analiz Al
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}