import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { BookOpen, Clock, CheckCircle, PlusCircle, Search, Filter, Download, Share2, Edit, Trash2, Eye, AlertCircle, Loader2 } from "lucide-react";

export default function TeacherExams() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExams, setSelectedExams] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<number | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignExamId, setAssignExamId] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");

  // Define interfaces for type safety
  interface Exam {
    id: number;
    title: string;
    subjectName: string;
    createdAt: string;
    assignedCount: number;
    teacherId: string;
    description?: string;
    questionCount: number;
  }

  interface Subject {
    id: number;
    name: string;
    icon?: string;
  }

  interface Student {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  }

  // Fetch exams created by the teacher
  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: [`/api/exams?teacherId=${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch subjects for filtering
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  // Fetch students for assigning exams
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/teacher/students', user?.id],
    enabled: !!user?.id,
  });

  // Delete exam mutation
  const deleteExam = useMutation({
    mutationFn: async (examId: number) => {
      const response = await apiRequest("DELETE", `/api/exams/${examId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/exams?teacherId=${user?.id}`] });
      toast({
        title: "Sınav silindi",
        description: "Sınav başarıyla silindi.",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Silme başarısız",
        description: error instanceof Error ? error.message : "Bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Assign exam mutation
  const assignExam = useMutation({
    mutationFn: async (data: { examId: number; studentIds: string[]; dueDate: string }) => {
      const response = await apiRequest("POST", "/api/exam-assignments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/exams?teacherId=${user?.id}`] });
      toast({
        title: "Sınav atandı",
        description: "Sınav seçilen öğrencilere başarıyla atandı.",
      });
      setAssignDialogOpen(false);
      setSelectedStudents([]);
      setDueDate("");
    },
    onError: (error) => {
      toast({
        title: "Atama başarısız",
        description: error instanceof Error ? error.message : "Bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  // Handle exam deletion
  const handleDeleteExam = (examId: number) => {
    setExamToDelete(examId);
    setDeleteDialogOpen(true);
  };

  // Handle exam assignment
  const handleAssignExam = (examId: number) => {
    setAssignExamId(examId);
    setAssignDialogOpen(true);
  };

  // Confirm exam deletion
  const confirmDeleteExam = () => {
    if (examToDelete) {
      deleteExam.mutate(examToDelete);
    }
  };

  // Confirm exam assignment
  const confirmAssignExam = () => {
    if (assignExamId && selectedStudents.length > 0 && dueDate) {
      assignExam.mutate({
        examId: assignExamId,
        studentIds: selectedStudents,
        dueDate,
      });
    } else {
      toast({
        title: "Geçersiz giriş",
        description: "Lütfen öğrenci seçin ve son tarih belirleyin.",
        variant: "destructive",
      });
    }
  };

  // Toggle student selection for assignment
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Filter exams based on active tab and search term
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exam.subjectName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "assigned") return exam.assignedCount > 0 && matchesSearch;
    if (activeTab === "unassigned") return exam.assignedCount === 0 && matchesSearch;
    
    return matchesSearch;
  });

  // Toggle exam selection
  const toggleExamSelection = (examId: number) => {
    setSelectedExams(prev =>
      prev.includes(examId)
        ? prev.filter(id => id !== examId)
        : [...prev, examId]
    );
  };

  // Check if all exams are selected
  const allExamsSelected = filteredExams.length > 0 && 
                           filteredExams.every((exam: any) => selectedExams.includes(exam.id));

  // Toggle all exams selection
  const toggleAllExams = () => {
    if (allExamsSelected) {
      setSelectedExams([]);
    } else {
      setSelectedExams(filteredExams.map((exam: any) => exam.id));
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-4">Erişim Reddedildi</h2>
        <p className="text-neutral-medium mb-6">Sınavları görüntülemek için giriş yapmanız gerekiyor.</p>
        <Button size="lg" onClick={() => window.location.href = "/api/login"}>Giriş Yap</Button>
      </div>
    );
  }

  // Loading state
  if (isLoadingExams) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-neutral-medium">Sınavlar yükleniyor...</p>
      </div>
    );
  }

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
                Oluşturduğunuz ve atadığınız sınavları yönetin
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Link href="/teacher-dashboard">
                <Button variant="outline" className="rounded-full shadow-sm border-neutral-200 hover:shadow-md transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  Dashboard'a Dön
                </Button>
              </Link>
              <Link href="/create-exam">
                <Button className="rounded-full shadow-md hover:shadow-lg transition-all">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Yeni Sınav
                </Button>
              </Link>
            </div>
          </div>
          
          {/* İstatistikler kartı */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 flex items-center">
              <div className="bg-blue-50 rounded-full p-3 mr-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Toplam Sınavlar</p>
                <h3 className="text-2xl font-bold">{exams.length || 0}</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 flex items-center">
              <div className="bg-green-50 rounded-full p-3 mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Atanan Sınavlar</p>
                <h3 className="text-2xl font-bold">
                  {exams.filter((exam: any) => exam.assignedCount > 0).length || 0}
                </h3>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 flex items-center">
              <div className="bg-amber-50 rounded-full p-3 mr-4">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Bekleyen Sınavlar</p>
                <h3 className="text-2xl font-bold">
                  {exams.filter((exam: any) => exam.assignedCount === 0).length || 0}
                </h3>
              </div>
            </div>
          </div>
        </div>
        
        {/* Arama ve Filtreler */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Sınav ara..."
                className="pl-10 rounded-xl border-neutral-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select>
                <SelectTrigger className="w-[180px] rounded-xl border-neutral-200">
                  <SelectValue placeholder="Derse göre filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Dersler</SelectItem>
                  {subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger className="w-[180px] rounded-xl border-neutral-200">
                  <SelectValue placeholder="Tarihe göre sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">En Yeni</SelectItem>
                  <SelectItem value="oldest">En Eski</SelectItem>
                </SelectContent>
              </Select>
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
            <TabsList className="grid w-full grid-cols-3 rounded-xl bg-neutral-50">
              <TabsTrigger 
                value="all" 
                className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Tüm Sınavlar
              </TabsTrigger>
              <TabsTrigger 
                value="assigned" 
                className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Atanmış Sınavlar
              </TabsTrigger>
              <TabsTrigger 
                value="unassigned" 
                className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Atanmamış Sınavlar
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Sınav Listesi */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
            {filteredExams.length > 0 ? (
              <div>
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg flex items-center">
                    <BookOpen className="mr-2 h-5 w-5 text-primary" />
                    Sınav Listesi
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-sm rounded-lg border-neutral-200">
                      <Download className="h-4 w-4 mr-2" />
                      Dışa Aktar
                    </Button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <Table className="w-full border-collapse">
                    <TableHeader className="bg-neutral-50">
                      <TableRow>
                        <TableHead className="w-[40px] py-4">
                          <Checkbox 
                            checked={allExamsSelected} 
                            onCheckedChange={toggleAllExams}
                          />
                        </TableHead>
                        <TableHead className="py-4 font-semibold text-neutral-700">Sınav Adı</TableHead>
                        <TableHead className="py-4 font-semibold text-neutral-700">Ders</TableHead>
                        <TableHead className="py-4 font-semibold text-neutral-700">Oluşturulma Tarihi</TableHead>
                        <TableHead className="py-4 font-semibold text-neutral-700">Atanan Öğrenci</TableHead>
                        <TableHead className="py-4 font-semibold text-neutral-700">Durum</TableHead>
                        <TableHead className="text-right py-4 font-semibold text-neutral-700">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map((exam: any) => (
                        <TableRow key={exam.id} className="hover:bg-neutral-50 transition-colors">
                          <TableCell className="py-3.5 border-b border-neutral-100">
                            <Checkbox 
                              checked={selectedExams.includes(exam.id)} 
                              onCheckedChange={() => toggleExamSelection(exam.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium py-3.5 border-b border-neutral-100">
                            {exam.title}
                          </TableCell>
                          <TableCell className="py-3.5 border-b border-neutral-100">
                            {exam.subjectName}
                          </TableCell>
                          <TableCell className="py-3.5 border-b border-neutral-100">
                            {formatDate(exam.createdAt)}
                          </TableCell>
                          <TableCell className="py-3.5 border-b border-neutral-100">
                            {exam.assignedCount > 0 ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                {exam.assignedCount} öğrenci
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-neutral-500 border-neutral-200">
                                Atanmamış
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3.5 border-b border-neutral-100">
                            {exam.assignedCount > 0 ? (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                Aktif
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                                Taslak
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-3.5 border-b border-neutral-100">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleAssignExam(exam.id)} className="h-8 w-8">
                                <Share2 className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Link href={`/edit-exam/${exam.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4 text-amber-600" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteExam(exam.id)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                              <Link href={`/preview-exam/${exam.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="py-16 px-4 text-center">
                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-10 w-10 text-neutral-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">Sınav Bulunamadı</h3>
                <p className="text-neutral-500 max-w-md mx-auto mb-6">
                  {searchTerm 
                    ? `"${searchTerm}" için arama sonucu bulunamadı. Lütfen farklı bir arama terimi deneyin.` 
                    : "Henüz sınav oluşturmadınız. Hemen yeni bir sınav oluşturmaya başlayın."}
                </p>
                <Link href="/create-exam">
                  <Button className="rounded-full">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Yeni Sınav Oluştur
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Tabs>
        
        {/* Silme Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                Sınavı Sil
              </DialogTitle>
              <DialogDescription>
                Bu sınavı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                İptal
              </Button>
              <Button variant="destructive" onClick={confirmDeleteExam} disabled={deleteExam.isPending}>
                {deleteExam.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  "Sınavı Sil"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Atama Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Share2 className="h-5 w-5 text-blue-600 mr-2" />
                Sınavı Öğrencilere Ata
              </DialogTitle>
              <DialogDescription>
                Bu sınavı öğrencilerinize atayın ve son teslim tarihi belirleyin.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="dueDate">Son Teslim Tarihi</Label>
                <Input
                  id="dueDate"
                  type="date"
                  className="mt-1"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Öğrenciler</Label>
                <div className="mt-1 border rounded-lg p-2 max-h-60 overflow-y-auto">
                  {students.length > 0 ? (
                    students.map((student: any) => (
                      <div key={student.id} className="flex items-center space-x-2 py-2 px-1 hover:bg-neutral-50 rounded-md">
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                        <Label className="cursor-pointer" onClick={() => toggleStudentSelection(student.id)}>
                          {student.firstName} {student.lastName}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="py-2 text-neutral-500 text-center">Öğrenci bulunamadı</p>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={confirmAssignExam} disabled={assignExam.isPending || !dueDate || selectedStudents.length === 0}>
                {assignExam.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Atanıyor...
                  </>
                ) : (
                  "Sınavı Ata"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}