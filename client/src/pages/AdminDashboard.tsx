import { useState } from "react";
import { Link } from "wouter";
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  BookOpen,
  UserCheck,
  School,
  Settings,
  BarChart,
  PlusCircle,
  Shield,
  Edit,
  Trash2,
  ExternalLink,
  Home
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, isAuthenticated, isLoading } = useAuth();

  // Öğretmen veya öğrenci role onay taleplerini getir
  const { data: roleRequests = [], isLoading: isLoadingRequests } = useQuery<any[]>({
    queryKey: ['/api/auth/role-requests'],
    enabled: !!user?.id && user?.role === "admin",
  });

  // Site istatistiklerini getir
  const { data: statistics = {}, isLoading: isLoadingStats } = useQuery<any>({
    queryKey: ['/api/statistics'],
    enabled: !!user?.id,
  });

  // Kullanıcıları getir
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: !!user?.id && user?.role === "admin",
  });

  // Öğretmenleri getir
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery<any[]>({
    queryKey: ['/api/teachers'],
    enabled: !!user?.id,
  });

  // Dersleri getir
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<any[]>({
    queryKey: ['/api/subjects'],
    enabled: !!user?.id,
  });

  // Giriş yapmamış veya admin olmayan kullanıcıları kontrol et
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-4">Erişim Reddedildi</h2>
        <p className="text-muted-foreground mb-6">Admin paneline erişmek için giriş yapmanız gerekiyor.</p>
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

  // Admin olup olmadığını kontrol et
  if (user?.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-heading font-semibold mb-4">Admin Yetkisi Gerekli</h2>
        <p className="text-muted-foreground mb-6">Bu sayfaya erişmek için admin yetkisine sahip olmanız gerekmektedir.</p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" variant="outline" onClick={() => window.location.href = "/"}>
            <Home className="mr-2 h-4 w-4" />
            Ana Sayfaya Git
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-1">Admin Paneli</h1>
          <p className="text-muted-foreground">Hoş geldiniz, {user?.firstName || user?.email}</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Link href="/site-settings">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Site Ayarları
            </Button>
          </Link>
          <Link href="/">
            <Button>
              <ExternalLink className="mr-2 h-4 w-4" />
              Siteyi Görüntüle
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 lg:w-[800px]">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="teachers">Öğretmenler</TabsTrigger>
          <TabsTrigger value="subjects">Dersler</TabsTrigger>
          <TabsTrigger value="requests">
            Talepler
            {roleRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {roleRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Genel Bakış Sekmesi */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Toplam Kullanıcı</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingStats ? "..." : statistics.totalUsers || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  Kayıtlı kullanıcılar
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Toplam Öğrenci</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingStats ? "..." : statistics.totalStudents || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <School className="mr-1 h-4 w-4" />
                  Aktif öğrenciler
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Toplam Öğretmen</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingStats ? "..." : statistics.totalTeachers || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <UserCheck className="mr-1 h-4 w-4" />
                  Onaylı öğretmenler
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Toplam Ders</CardDescription>
                <CardTitle className="text-3xl">
                  {isLoadingStats ? "..." : statistics.totalLessons || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <BookOpen className="mr-1 h-4 w-4" />
                  Tamamlanan dersler
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Grafik ve istatistikler bölümü */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Site Aktivitesi</CardTitle>
                <CardDescription>Son 30 günlük site istatistikleri</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Grafik verileri yükleniyor veya henüz mevcut değil
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
                <CardDescription>Sık kullanılan admin işlemleri</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button className="w-full justify-start" variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Yeni Ders Ekle
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Yeni Kullanıcı Ekle
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Ödeme Ayarları
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart className="mr-2 h-4 w-4" />
                  Raporları Görüntüle
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Onay bekleyen talepler */}
          <Card>
            <CardHeader>
              <CardTitle>Onay Bekleyen Talepler</CardTitle>
              <CardDescription>Kullanıcılardan gelen rol değişikliği ve onay talepleri</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="text-center py-6">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Talepler yükleniyor...</p>
                </div>
              ) : roleRequests.length > 0 ? (
                <div className="space-y-4">
                  {roleRequests.slice(0, 5).map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h4 className="font-medium">{request.userName || request.userEmail}</h4>
                        <p className="text-sm text-muted-foreground">
                          <Badge variant="outline">
                            {request.currentRole} → {request.requestedRole}
                          </Badge>
                          <span className="ml-2">Talep tarihi: {new Date(request.createdAt).toLocaleDateString('tr-TR')}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Reddet</Button>
                        <Button size="sm">Onayla</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Onay bekleyen talep yok</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Şu anda bekleyen rol değişikliği talebi bulunmuyor.
                  </p>
                </div>
              )}
            </CardContent>
            {roleRequests.length > 5 && (
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("requests")}>
                  Tüm Talepleri Görüntüle ({roleRequests.length})
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* Kullanıcılar Sekmesi */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Kullanıcı Yönetimi</CardTitle>
                  <CardDescription>Tüm kayıtlı kullanıcıları yönetin</CardDescription>
                </div>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Yeni Kullanıcı
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="text-center py-6">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Kullanıcılar yükleniyor...</p>
                </div>
              ) : users.length > 0 ? (
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 py-3 px-4 border-b bg-muted/40">
                    <div className="font-medium">Kullanıcı</div>
                    <div className="font-medium">E-posta</div>
                    <div className="font-medium">Rol</div>
                    <div className="font-medium">Kayıt Tarihi</div>
                    <div className="font-medium text-right">İşlemler</div>
                  </div>
                  {users.map((user: any) => (
                    <div key={user.id} className="grid grid-cols-5 py-3 px-4 border-b last:border-b-0 items-center">
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-muted-foreground">ID: {user.id.substring(0, 8)}...</div>
                      </div>
                      <div className="text-sm">{user.email}</div>
                      <div>
                        <Badge variant={
                          user.role === "admin" ? "default" :
                          user.role === "teacher" ? "secondary" : "outline"
                        }>
                          {user.role}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Henüz kullanıcı yok</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Sisteme kayıtlı kullanıcı bulunmuyor.
                  </p>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Yeni Kullanıcı Ekle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Öğretmenler Sekmesi */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Öğretmen Yönetimi</CardTitle>
                  <CardDescription>Platformda bulunan tüm öğretmenleri yönetin</CardDescription>
                </div>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Yeni Öğretmen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTeachers ? (
                <div className="text-center py-6">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Öğretmenler yükleniyor...</p>
                </div>
              ) : teachers.length > 0 ? (
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 py-3 px-4 border-b bg-muted/40">
                    <div className="font-medium">Öğretmen</div>
                    <div className="font-medium">Branş</div>
                    <div className="font-medium">Değerlendirme</div>
                    <div className="font-medium">Durum</div>
                    <div className="font-medium text-right">İşlemler</div>
                  </div>
                  {teachers.map((teacher: any) => (
                    <div key={teacher.id} className="grid grid-cols-5 py-3 px-4 border-b last:border-b-0 items-center">
                      <div>
                        <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                        <div className="text-sm text-muted-foreground">{teacher.email}</div>
                      </div>
                      <div>{teacher.subjects?.join(", ") || "Belirtilmemiş"}</div>
                      <div className="flex items-center">
                        {teacher.rating ? (
                          <>
                            <span className="text-amber-500 mr-1">{teacher.rating.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">({teacher.reviewCount || 0})</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">Değerlendirme yok</span>
                        )}
                      </div>
                      <div>
                        <Badge variant={
                          teacher.isVerified ? "success" : "secondary"
                        }>
                          {teacher.isVerified ? "Onaylı" : "Onay Bekliyor"}
                        </Badge>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline">Profil</Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Henüz öğretmen yok</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Sistemde kayıtlı öğretmen bulunmuyor.
                  </p>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Yeni Öğretmen Ekle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Dersler Sekmesi */}
        <TabsContent value="subjects">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Ders Yönetimi</CardTitle>
                  <CardDescription>Platformdaki tüm dersleri yönetin</CardDescription>
                </div>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Yeni Ders Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSubjects ? (
                <div className="text-center py-6">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Dersler yükleniyor...</p>
                </div>
              ) : subjects.length > 0 ? (
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 py-3 px-4 border-b bg-muted/40">
                    <div className="font-medium">Ders</div>
                    <div className="font-medium">Öğretmen Sayısı</div>
                    <div className="font-medium">Popülerlik</div>
                    <div className="font-medium text-right">İşlemler</div>
                  </div>
                  {subjects.map((subject: any) => (
                    <div key={subject.id} className="grid grid-cols-4 py-3 px-4 border-b last:border-b-0 items-center">
                      <div className="flex items-center gap-2">
                        {subject.icon && (
                          <div className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10">
                            <span className="text-lg">{subject.icon}</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{subject.name}</div>
                          {subject.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {subject.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>{subject.teacherCount || 0} öğretmen</div>
                      <div className="w-40 bg-muted rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${subject.popularity || 0}%` }}
                        ></div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Henüz ders yok</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Sistemde tanımlı ders bulunmuyor.
                  </p>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Yeni Ders Ekle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Talepler Sekmesi */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Rol Değişikliği Talepleri</CardTitle>
              <CardDescription>Kullanıcılardan gelen öğretmen veya öğrenci rolü talepleri</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="text-center py-6">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Talepler yükleniyor...</p>
                </div>
              ) : roleRequests.length > 0 ? (
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 py-3 px-4 border-b bg-muted/40">
                    <div className="font-medium">Kullanıcı</div>
                    <div className="font-medium">Talep Türü</div>
                    <div className="font-medium">Tarih</div>
                    <div className="font-medium">Açıklama</div>
                    <div className="font-medium text-right">İşlemler</div>
                  </div>
                  {roleRequests.map((request: any) => (
                    <div key={request.id} className="grid grid-cols-5 py-3 px-4 border-b last:border-b-0 items-center">
                      <div>
                        <div className="font-medium">{request.userName || request.userEmail}</div>
                        <div className="text-sm text-muted-foreground">ID: {request.userId.substring(0, 8)}...</div>
                      </div>
                      <div>
                        <Badge variant="outline">
                          {request.currentRole} → {request.requestedRole}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        {new Date(request.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-sm truncate max-w-xs">
                        {request.description || "Açıklama yok"}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="destructive">Reddet</Button>
                        <Button size="sm">Onayla</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Bekleyen talep yok</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Şu anda bekleyen rol değişikliği talebi bulunmuyor.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}