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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-1">Sınavlarım</h1>
          <p className="text-neutral-medium">Atanan sınavları görüntüleyin ve tamamlayın</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/student-dashboard">
            <Button variant="outline">
              Dashboard'a Dön
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="pending" className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Bekleyen
            {pendingExams.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingExams.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Tamamlanan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingExams.map((exam: any) => (
                <Card key={exam.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle>{exam.examTitle}</CardTitle>
                    <CardDescription>
                      <span className="flex items-center">
                        <BookOpen className="mr-2 h-4 w-4" />
                        {exam.subjectName}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Öğretmen:</span>
                        <span>{exam.teacherName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Soru Sayısı:</span>
                        <span>{exam.questionCount} soru</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Süre Limiti:</span>
                        <span>{exam.timeLimit} dakika</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Son Tarih:</span>
                        <span>{formatDate(exam.dueDate)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3">
                    <Link href={`/take-exam/${exam.id}`}>
                      <Button className="w-full">Sınavı Başlat</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-25" />
              <h3 className="mt-4 text-lg font-medium">Bekleyen Sınav Yok</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Şu anda atanmış bekleyen sınavınız bulunmuyor.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedExams.length > 0 ? (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Tamamlanan Sınavlar</CardTitle>
                <CardDescription>
                  Tamamladığınız tüm sınavlar ve sonuçlarınız
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sınav</TableHead>
                      <TableHead>Konu</TableHead>
                      <TableHead>Tamamlanma Tarihi</TableHead>
                      <TableHead>Puan</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedExams.map((exam: any) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.examTitle}</TableCell>
                        <TableCell>{exam.subjectName}</TableCell>
                        <TableCell>{formatDate(exam.submittedAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={exam.score >= 70 ? "text-green-600" : "text-red-500"}>
                              {exam.score}%
                            </span>
                            {exam.score >= 70 ? (
                              <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="ml-2 h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/exam-results/${exam.id}`}>
                            <Button variant="outline" size="sm">
                              Detaylar
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-25" />
              <h3 className="mt-4 text-lg font-medium">Tamamlanan Sınav Yok</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Henüz tamamladığınız bir sınav bulunmuyor.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}