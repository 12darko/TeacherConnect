import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { trackEvent } from "@/lib/analytics";
import { UserManagementTable } from "@/components/ui/admin/UserManagementTable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  BookOpen,
  DollarSign,
  Activity,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  GraduationCap,
  Settings,
  User,
  Calendar,
  Flag,
} from "lucide-react";

// Komisyon Ayarları Bileşeni
const CommissionSettings = () => {
  const [platformCommission, setPlatformCommission] = useState(10);
  const { toast } = useToast();
  
  const handleCommissionChange = (newValue: number) => {
    setPlatformCommission(newValue);
    
    // Burada API'ye komisyon değişikliği yapılabilir
    toast({
      title: "Komisyon oranı güncellendi",
      description: `Platform komisyon oranı %${newValue} olarak ayarlandı.`,
    });
    
    trackEvent('admin_action', 'commission_update', null, newValue);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Komisyon Ayarları</CardTitle>
        <CardDescription>
          Platform komisyon oranlarını ve ödeme politikalarını yönetin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <h3 className="font-medium">Platform Komisyonu</h3>
            <span className="font-medium text-primary">{platformCommission}%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Öğretmenlerin kazançlarından kesilecek platform komisyon oranı.
          </p>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => handleCommissionChange(Math.max(5, platformCommission - 1))}
              disabled={platformCommission <= 5}
            >
              -
            </Button>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${platformCommission * 4}%` }}
              ></div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => handleCommissionChange(Math.min(25, platformCommission + 1))}
              disabled={platformCommission >= 25}
            >
              +
            </Button>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Min: 5%</span>
            <span>Max: 25%</span>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <h3 className="font-medium mb-4">Diğer Ödeme Ayarları</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Ödeme Tutarı</label>
                <div className="flex">
                  <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md">₺</span>
                  <input
                    type="number"
                    className="flex-1 border rounded-r-md px-3 py-2"
                    defaultValue="100"
                    min="50"
                    step="10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Ödeme Çekim Günleri</label>
                <select className="w-full border rounded-md px-3 py-2">
                  <option value="1,15">Ayın 1. ve 15. günleri</option>
                  <option value="1">Ayın 1. günü</option>
                  <option value="15">Ayın 15. günü</option>
                  <option value="30">Ayın son günü</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ücretsiz Deneme Süresi</label>
                <div className="flex">
                  <input
                    type="number"
                    className="flex-1 border rounded-l-md px-3 py-2"
                    defaultValue="14"
                    min="0"
                    max="30"
                  />
                  <span className="bg-muted px-3 py-2 border border-l-0 rounded-r-md">gün</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Otomatik Onay Süresi</label>
                <div className="flex">
                  <input
                    type="number"
                    className="flex-1 border rounded-l-md px-3 py-2"
                    defaultValue="7"
                    min="1"
                    max="30"
                  />
                  <span className="bg-muted px-3 py-2 border border-l-0 rounded-r-md">gün</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Ayarları Kaydet</Button>
      </CardFooter>
    </Card>
  );
};

// Veri & İstatistik Bileşeni
const AnalyticsDashboard = () => {
  // Örnek veri
  const userStats = [
    { name: 'Ocak', öğrenci: 400, öğretmen: 240, toplam: 640 },
    { name: 'Şubat', öğrenci: 450, öğretmen: 260, toplam: 710 },
    { name: 'Mart', öğrenci: 520, öğretmen: 280, toplam: 800 },
    { name: 'Nisan', öğrenci: 590, öğretmen: 320, toplam: 910 },
    { name: 'Mayıs', öğrenci: 650, öğretmen: 360, toplam: 1010 },
    { name: 'Haziran', öğrenci: 730, öğretmen: 390, toplam: 1120 },
  ];

  const revenueData = [
    { name: 'Ocak', gelir: 5200 },
    { name: 'Şubat', gelir: 6100 },
    { name: 'Mart', gelir: 7800 },
    { name: 'Nisan', gelir: 8900 },
    { name: 'Mayıs', gelir: 10400 },
    { name: 'Haziran', gelir: 12100 },
  ];

  const subjectDistribution = [
    { name: 'Matematik', value: 35 },
    { name: 'Fizik', value: 20 },
    { name: 'Kimya', value: 15 },
    { name: 'Biyoloji', value: 10 },
    { name: 'İngilizce', value: 25 },
    { name: 'Tarih', value: 10 },
    { name: 'Coğrafya', value: 5 },
  ];

  const sessionStats = [
    { name: 'Pazartesi', tamamlanan: 65, iptal: 5 },
    { name: 'Salı', tamamlanan: 75, iptal: 8 },
    { name: 'Çarşamba', tamamlanan: 85, iptal: 6 },
    { name: 'Perşembe', tamamlanan: 80, iptal: 4 },
    { name: 'Cuma', tamamlanan: 70, iptal: 7 },
    { name: 'Cumartesi', tamamlanan: 90, iptal: 3 },
    { name: 'Pazar', tamamlanan: 55, iptal: 2 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam Kullanıcı</CardDescription>
            <CardTitle className="text-3xl">1,120</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex items-center">
              <Users className="mr-1 h-4 w-4" />
              Öğrenci: 730 | Öğretmen: 390
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aylık Gelir</CardDescription>
            <CardTitle className="text-3xl">₺12,100</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex items-center">
              <DollarSign className="mr-1 h-4 w-4" />
              %16.4 artış (önceki aya göre)
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tamamlanan Dersler</CardDescription>
            <CardTitle className="text-3xl">520</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex items-center">
              <BookOpen className="mr-1 h-4 w-4" />
              Bu hafta: 85 | Geçen hafta: 78
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ortalama Oturum</CardDescription>
            <CardTitle className="text-3xl">62 dk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex items-center">
              <Activity className="mr-1 h-4 w-4" />
              %4.2 artış (önceki aya göre)
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Artışı</CardTitle>
            <CardDescription>Aylık kullanıcı sayısı artışı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userStats}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="öğrenci" stackId="a" fill="#8884d8" />
                  <Bar dataKey="öğretmen" stackId="a" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Gelir Analizi</CardTitle>
            <CardDescription>Aylık gelir grafiği</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`₺${value}`, 'Gelir']} />
                  <Area type="monotone" dataKey="gelir" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ders Dağılımı</CardTitle>
            <CardDescription>Dersler bazında öğrenci dağılımı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subjectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Oran']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Haftalık Ders İstatistikleri</CardTitle>
            <CardDescription>Günlük tamamlanan ve iptal edilen dersler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sessionStats}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tamamlanan" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="iptal" stroke="#ff4d4f" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Destek ve Şikayet Yönetimi Bileşeni
const SupportTicketsManagement = () => {
  const tickets = [
    { 
      id: 1, 
      user: "Ahmet Yılmaz", 
      userType: "Öğrenci",
      subject: "Ödeme sorunu",
      message: "Dersi tamamladım ancak öğretmen dersi iptal edilmiş gibi işaretlemiş.",
      status: "open",
      priority: "high",
      createdAt: "2025-05-15T14:30:00"
    },
    { 
      id: 2, 
      user: "Ayşe Kaya", 
      userType: "Öğretmen",
      subject: "Teknik sorun",
      message: "Video görüşmesi sırasında ses problemi yaşıyorum.",
      status: "in-progress",
      priority: "medium",
      createdAt: "2025-05-15T10:15:00"
    },
    { 
      id: 3, 
      user: "Mehmet Demir", 
      userType: "Öğrenci",
      subject: "Hesap problemi",
      message: "Şifremi değiştirdim ancak giriş yapamıyorum.",
      status: "closed",
      priority: "low",
      createdAt: "2025-05-14T16:45:00"
    },
    { 
      id: 4, 
      user: "Zeynep Aydın", 
      userType: "Öğretmen",
      subject: "Ödeme gecikmesi",
      message: "Geçen ayın ödemesi hesabıma geçmedi.",
      status: "open",
      priority: "high",
      createdAt: "2025-05-14T09:20:00"
    },
    { 
      id: 5, 
      user: "Can Özkan", 
      userType: "Öğrenci",
      subject: "Ders iptali",
      message: "Öğretmen dersi son dakika iptal etti.",
      status: "in-progress",
      priority: "medium",
      createdAt: "2025-05-13T18:10:00"
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Açık</span>;
      case "in-progress":
        return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">İşlemde</span>;
      case "closed":
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Kapandı</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Yüksek</span>;
      case "medium":
        return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">Orta</span>;
      case "low":
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Düşük</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Destek Talepleri</CardTitle>
        <CardDescription>Kullanıcıların destek ve şikayet taleplerini yönetin</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="bg-muted/50 p-4 border-b">
            <div className="grid grid-cols-7 gap-4 font-medium">
              <div>Kullanıcı</div>
              <div>Tür</div>
              <div className="col-span-2">Konu</div>
              <div>Durum</div>
              <div>Öncelik</div>
              <div>Tarih</div>
            </div>
          </div>
          
          <div className="divide-y">
            {tickets.map(ticket => (
              <div key={ticket.id} className="grid grid-cols-7 gap-4 p-4 items-center">
                <div>{ticket.user}</div>
                <div>{ticket.userType}</div>
                <div className="col-span-2">{ticket.subject}</div>
                <div>{getStatusBadge(ticket.status)}</div>
                <div>{getPriorityBadge(ticket.priority)}</div>
                <div className="text-sm text-muted-foreground">{formatDate(ticket.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">Toplam 5 destek talebi gösteriliyor</div>
        <Button variant="outline">Tümünü Görüntüle</Button>
      </CardFooter>
    </Card>
  );
};

// Ana Admin Dashboard
export default function AdminDashboard() {
  const [, params] = useLocation();
  const urlParams = new URLSearchParams(params);
  const initialTab = urlParams.get("tab") || "overview";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  
  // Giriş yapmamış veya admin olmayan kullanıcıları kontrol et
  if (!isLoading && (!isAuthenticated || !isAdmin)) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Erişim Reddedildi</h2>
        <p className="text-muted-foreground mb-6">Admin paneline erişmek için yönetici yetkileriyle giriş yapmanız gerekiyor.</p>
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-1">Admin Paneli</h1>
          <p className="text-muted-foreground">Site yönetimi ve istatistikler</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Site Ayarları
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 md:w-[700px]">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="commission">Komisyon</TabsTrigger>
          <TabsTrigger value="analytics">İstatistikler</TabsTrigger>
          <TabsTrigger value="support">Destek</TabsTrigger>
        </TabsList>
        
        {/* Genel Bakış Sekmesi */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Toplam Kullanıcı</CardDescription>
                <CardTitle className="text-3xl">1,120</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  Son 30 günde 120 yeni kayıt
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full" onClick={() => setActiveTab("users")}>
                  Kullanıcıları Yönet
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Aylık Gelir</CardDescription>
                <CardTitle className="text-3xl">₺12,100</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <DollarSign className="mr-1 h-4 w-4" />
                  Komisyon Geliri: ₺1,210
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full" onClick={() => setActiveTab("commission")}>
                  Komisyonları Yönet
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Aktif Dersler</CardDescription>
                <CardTitle className="text-3xl">84</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  Bugün 12 ders planlandı
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full" onClick={() => setActiveTab("analytics")}>
                  Ders İstatistikleri
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Bekleyen Talepler</CardDescription>
                <CardTitle className="text-3xl">5</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Flag className="mr-1 h-4 w-4" />
                  2 yüksek öncelikli talep
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full" onClick={() => setActiveTab("support")}>
                  Destek Taleplerini Görüntüle
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Son Aktiviteler</CardTitle>
                <CardDescription>Son 24 saatteki platform aktiviteleri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start border-b pb-4">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-md mr-4">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">Yeni Kullanıcı Kaydı</h4>
                      <p className="text-sm text-muted-foreground">Eda Yılmaz adlı kullanıcı öğrenci olarak kaydoldu.</p>
                      <p className="text-xs text-muted-foreground mt-1">3 saat önce</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start border-b pb-4">
                    <div className="bg-green-100 text-green-600 p-2 rounded-md mr-4">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">Yeni Ödeme</h4>
                      <p className="text-sm text-muted-foreground">₺450 değerinde yeni ödeme alındı.</p>
                      <p className="text-xs text-muted-foreground mt-1">5 saat önce</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start border-b pb-4">
                    <div className="bg-amber-100 text-amber-600 p-2 rounded-md mr-4">
                      <Flag className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">Yeni Destek Talebi</h4>
                      <p className="text-sm text-muted-foreground">Ahmet Yılmaz tarafından "Ödeme sorunu" konulu destek talebi oluşturuldu.</p>
                      <p className="text-xs text-muted-foreground mt-1">8 saat önce</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-purple-100 text-purple-600 p-2 rounded-md mr-4">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">Yeni Ders Oluşturuldu</h4>
                      <p className="text-sm text-muted-foreground">Mehmet Kaya, "Fizik - Temel Kurallar" adlı dersi oluşturdu.</p>
                      <p className="text-xs text-muted-foreground mt-1">12 saat önce</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Tüm Aktiviteleri Görüntüle</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Platform Özeti</CardTitle>
                <CardDescription>Kritik platform istatistikleri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={[
                        { name: 'Matematik', count: 245 },
                        { name: 'Fizik', count: 180 },
                        { name: 'Kimya', count: 120 },
                        { name: 'Biyoloji', count: 95 },
                        { name: 'İngilizce', count: 210 },
                      ]}
                      margin={{ top: 20, right: 20, bottom: 20, left: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Öğrenci Sayısı" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("analytics")}>
                  Detaylı İstatistikleri Görüntüle
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Kullanıcılar Sekmesi */}
        <TabsContent value="users">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Kullanıcı Yönetimi</CardTitle>
              <CardDescription>
                Tüm öğrenci ve öğretmenleri görüntüleyin, rolleri düzenleyin ve kullanıcı hesaplarını yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagementTable />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Komisyon Sekmesi */}
        <TabsContent value="commission">
          <CommissionSettings />
        </TabsContent>
        
        {/* İstatistikler Sekmesi */}
        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>
        
        {/* Destek Sekmesi */}
        <TabsContent value="support">
          <SupportTicketsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}