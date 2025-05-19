import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function StudentExams() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");

  // Fetch exam assignments for the student
  const { data: examAssignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: [`/api/exam-assignments?studentId=${user?.id}`],
    enabled: !!user?.id,
  });

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-4">Erişim Reddedildi</h2>
        <p className="text-neutral-medium mb-6">Sınavları görüntülemek için giriş yapmanız gerekiyor.</p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => window.location.href = "/api/login"}>Giriş Yap</Button>
          <Button size="lg" variant="outline" onClick={() => window.location.href = "/"}>Ana Sayfaya Git</Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || isLoadingAssignments) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-neutral-medium">Sınavlar yükleniyor...</p>
      </div>
    );
  }

  // Filter exams by status
  const pendingExams = examAssignments.filter((exam: any) => !exam.completed);
  const completedExams = examAssignments.filter((exam: any) => exam.completed);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="container mx-auto px-4">
        {/* Başlık ve üst bilgiler */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
                Sınavlarım
              </h1>
              <p className="text-neutral-600 mt-2">
                Size atanan sınavları görüntüleyin ve başarınızı takip edin
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/student-dashboard">
                <Button variant="outline" className="rounded-full shadow-sm border-neutral-200 hover:shadow-md transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  Dashboard'a Dön
                </Button>
              </Link>
            </div>
          </div>
          
          {/* İstatistikler kartı */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 flex items-center">
              <div className="bg-blue-50 rounded-full p-3 mr-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Toplam Sınavlar</p>
                <h3 className="text-2xl font-bold">{pendingExams.length + completedExams.length}</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 flex items-center">
              <div className="bg-amber-50 rounded-full p-3 mr-4">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Bekleyen</p>
                <h3 className="text-2xl font-bold">{pendingExams.length}</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 flex items-center">
              <div className="bg-green-50 rounded-full p-3 mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Tamamlanan</p>
                <h3 className="text-2xl font-bold">{completedExams.length}</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 flex items-center">
              <div className="bg-purple-50 rounded-full p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Ortalama Puan</p>
                <h3 className="text-2xl font-bold">
                  {completedExams.length > 0 
                    ? Math.round(completedExams.reduce((acc: number, exam: any) => acc + exam.score, 0) / completedExams.length) 
                    : "-"}%
                </h3>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sekmeler */}
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={setActiveTab} 
          className="space-y-6"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-2">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-neutral-50">
              <TabsTrigger 
                value="pending" 
                className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center"
              >
                <Clock className="w-4 h-4 mr-2 text-amber-600" />
                <span>Bekleyen Sınavlar</span>
                {pendingExams.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 hover:bg-amber-100">
                    {pendingExams.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center"
              >
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                <span>Tamamlanan Sınavlar</span>
                {completedExams.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">
                    {completedExams.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Bekleyen Sınavlar */}
          <TabsContent value="pending">
            {pendingExams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingExams.map((exam: any) => (
                  <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden transition-all duration-300 hover:shadow-md group">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <h3 className="text-lg font-bold">{exam.examTitle}</h3>
                          <span className="text-sm text-neutral-500 flex items-center mt-1">
                            <BookOpen className="mr-1.5 h-4 w-4 text-primary" />
                            {exam.subjectName}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-full bg-amber-50 border border-amber-100">
                          <Clock className="h-5 w-5 text-amber-500" />
                        </div>
                      </div>
                      
                      <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between text-sm px-3 py-2 bg-neutral-50 rounded-lg">
                          <span className="font-medium">Öğretmen</span>
                          <span className="text-neutral-700">{exam.teacherName}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm px-3 py-2 bg-neutral-50 rounded-lg">
                          <span className="font-medium">Soru Sayısı</span>
                          <span className="text-neutral-700">{exam.questionCount} soru</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm px-3 py-2 bg-neutral-50 rounded-lg">
                          <span className="font-medium">Süre</span>
                          <span className="text-neutral-700">{exam.timeLimit} dakika</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-6 pb-6 pt-3 border-t border-neutral-100 mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-neutral-600">Son Tarih</span>
                        <span className="text-sm font-semibold text-red-600">{formatDate(exam.dueDate)}</span>
                      </div>
                      
                      <Link href={`/take-exam/${exam.id}`} className="block w-full">
                        <Button className="w-full rounded-xl py-6 group-hover:bg-primary-dark transition-colors">
                          Sınavı Başlat
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 py-12 px-4 text-center">
                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-10 w-10 text-neutral-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">Bekleyen Sınav Bulunamadı</h3>
                <p className="text-neutral-500 max-w-md mx-auto">
                  Şu anda size atanmış bekleyen sınav bulunmuyor. Öğretmenleriniz yeni sınavları atadığında burada görünecektir.
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Tamamlanan Sınavlar */}
          <TabsContent value="completed">
            {completedExams.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="p-6 border-b border-neutral-100">
                  <h3 className="font-bold text-lg flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    Tamamlanan Sınavlar ve Sonuçlarınız
                  </h3>
                  <p className="text-neutral-500 text-sm mt-1">
                    Tamamladığınız tüm sınavları ve aldığınız puanları burada görebilirsiniz
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <Table className="w-full border-collapse">
                      <TableHeader className="bg-neutral-50">
                        <TableRow>
                          <TableHead className="py-4 font-semibold text-neutral-700">Sınav</TableHead>
                          <TableHead className="py-4 font-semibold text-neutral-700">Konu</TableHead>
                          <TableHead className="py-4 font-semibold text-neutral-700">Tamamlanma Tarihi</TableHead>
                          <TableHead className="py-4 font-semibold text-neutral-700">Puan</TableHead>
                          <TableHead className="text-right py-4 font-semibold text-neutral-700">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedExams.map((exam: any) => (
                          <TableRow key={exam.id} className="hover:bg-neutral-50 transition-colors">
                            <TableCell className="font-medium py-3.5 border-b border-neutral-100">
                              {exam.examTitle}
                            </TableCell>
                            <TableCell className="py-3.5 border-b border-neutral-100">
                              {exam.subjectName}
                            </TableCell>
                            <TableCell className="py-3.5 border-b border-neutral-100">
                              {formatDate(exam.submittedAt)}
                            </TableCell>
                            <TableCell className="py-3.5 border-b border-neutral-100">
                              <div className="inline-flex items-center px-2.5 py-1 rounded-full font-medium text-sm" 
                                style={{ 
                                  backgroundColor: exam.score >= 70 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                  color: exam.score >= 70 ? '#16a34a' : '#ef4444'
                                }}
                              >
                                {exam.score >= 70 ? 
                                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> : 
                                  <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                                }
                                {exam.score}%
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-3.5 border-b border-neutral-100">
                              <Link href={`/exam-results/${exam.id}`}>
                                <Button variant="outline" size="sm" className="rounded-full shadow-sm hover:shadow-md transition-all">
                                  Detaylar
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 py-12 px-4 text-center">
                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-neutral-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">Tamamlanan Sınav Bulunamadı</h3>
                <p className="text-neutral-500 max-w-md mx-auto">
                  Henüz tamamladığınız bir sınav bulunmuyor. Sınavları tamamladıkça, performansınız ve puanlarınız burada görüntülenecektir.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}