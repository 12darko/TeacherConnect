import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { TeacherProfileCard } from "@/components/ui/teacher/TeacherProfileCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Search, Filter, BookOpen, Bookmark, Clock } from "lucide-react";

// Öğretmen tipi
type Teacher = {
  id: number;
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  subjectIds: number[];
  subjectNames: string[];
  hourlyRate: number;
  yearsOfExperience: number;
  averageRating: number;
  totalReviews: number;
  totalStudents: number;
  availability: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
};

export default function FindTeachers() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [experienceFilter, setExperienceFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("rating");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [favoriteTeachers, setFavoriteTeachers] = useState<string[]>([]);

  // Fetch teachers
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['/api/teachers'],
  });

  // Fetch subjects for filtering
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['/api/subjects'],
  });

  // Filtreleme ve sıralama işlemleri
  const filteredTeachers = teachers.filter((teacher: Teacher) => {
    // Arama sorgusu filtresi
    const matchesSearch = !searchQuery || 
      `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Konu filtresi
    const matchesSubject = subjectFilter === "all" || 
      teacher.subjectIds.includes(parseInt(subjectFilter));
    
    // Fiyat aralığı filtresi
    const matchesPrice = teacher.hourlyRate >= priceRange[0] && 
      teacher.hourlyRate <= priceRange[1];
    
    // Puan filtresi
    const matchesRating = !ratingFilter || 
      teacher.averageRating >= ratingFilter;
    
    // Deneyim filtresi
    const matchesExperience = !experienceFilter || 
      teacher.yearsOfExperience >= experienceFilter;
    
    return matchesSearch && matchesSubject && matchesPrice && matchesRating && matchesExperience;
  });

  // Sıralama
  const sortedTeachers = [...filteredTeachers].sort((a: Teacher, b: Teacher) => {
    switch (sortBy) {
      case "rating":
        return b.averageRating - a.averageRating;
      case "price-low":
        return a.hourlyRate - b.hourlyRate;
      case "price-high":
        return b.hourlyRate - a.hourlyRate;
      case "experience":
        return b.yearsOfExperience - a.yearsOfExperience;
      case "popularity":
        return b.totalStudents - a.totalStudents;
      default:
        return 0;
    }
  });

  // Favorilere ekleme/çıkarma
  const toggleFavorite = (teacherId: string) => {
    setFavoriteTeachers(prev => {
      if (prev.includes(teacherId)) {
        trackEvent('remove_favorite', 'teacher', teacherId);
        return prev.filter(id => id !== teacherId);
      } else {
        trackEvent('add_favorite', 'teacher', teacherId);
        return [...prev, teacherId];
      }
    });
  };

  // Öğretmen tıklama takibi
  const handleTeacherClick = (teacherId: string) => {
    trackEvent('view_teacher', 'teacher', teacherId);
  };

  // Demo veri (API bağlantısı yokken gösterim için)
  const demoTeachers: Teacher[] = [
    {
      id: 1,
      userId: "t1",
      firstName: "Ahmet",
      lastName: "Yılmaz",
      profileImageUrl: null,
      subjectIds: [1, 3],
      subjectNames: ["Matematik", "Fizik"],
      hourlyRate: 250,
      yearsOfExperience: 8,
      averageRating: 4.7,
      totalReviews: 48,
      totalStudents: 156,
      availability: [
        { day: "Pazartesi", startTime: "15:00", endTime: "20:00" },
        { day: "Çarşamba", startTime: "15:00", endTime: "20:00" },
        { day: "Cuma", startTime: "14:00", endTime: "18:00" },
      ]
    },
    {
      id: 2,
      userId: "t2",
      firstName: "Zeynep",
      lastName: "Kaya",
      profileImageUrl: null,
      subjectIds: [2, 5],
      subjectNames: ["İngilizce", "Türkçe"],
      hourlyRate: 200,
      yearsOfExperience: 6,
      averageRating: 4.9,
      totalReviews: 62,
      totalStudents: 118,
      availability: [
        { day: "Salı", startTime: "13:00", endTime: "19:00" },
        { day: "Perşembe", startTime: "13:00", endTime: "19:00" },
        { day: "Cumartesi", startTime: "10:00", endTime: "16:00" },
      ]
    },
    {
      id: 3,
      userId: "t3",
      firstName: "Mehmet",
      lastName: "Demir",
      profileImageUrl: null,
      subjectIds: [1, 4],
      subjectNames: ["Matematik", "Kimya"],
      hourlyRate: 280,
      yearsOfExperience: 12,
      averageRating: 4.5,
      totalReviews: 78,
      totalStudents: 210,
      availability: [
        { day: "Pazartesi", startTime: "16:00", endTime: "20:00" },
        { day: "Salı", startTime: "16:00", endTime: "20:00" },
        { day: "Cumartesi", startTime: "09:00", endTime: "14:00" },
      ]
    },
    {
      id: 4,
      userId: "t4",
      firstName: "Ayşe",
      lastName: "Şahin",
      profileImageUrl: null,
      subjectIds: [3, 4],
      subjectNames: ["Fizik", "Kimya"],
      hourlyRate: 270,
      yearsOfExperience: 9,
      averageRating: 4.6,
      totalReviews: 52,
      totalStudents: 133,
      availability: [
        { day: "Çarşamba", startTime: "14:00", endTime: "19:00" },
        { day: "Perşembe", startTime: "14:00", endTime: "19:00" },
        { day: "Pazar", startTime: "12:00", endTime: "18:00" },
      ]
    },
    {
      id: 5,
      userId: "t5",
      firstName: "Mustafa",
      lastName: "Öztürk",
      profileImageUrl: null,
      subjectIds: [2, 5],
      subjectNames: ["İngilizce", "Türkçe"],
      hourlyRate: 230,
      yearsOfExperience: 7,
      averageRating: 4.8,
      totalReviews: 67,
      totalStudents: 142,
      availability: [
        { day: "Pazartesi", startTime: "14:00", endTime: "18:00" },
        { day: "Çarşamba", startTime: "14:00", endTime: "18:00" },
        { day: "Cuma", startTime: "14:00", endTime: "18:00" },
      ]
    },
  ];

  // Demo subjects
  const demoSubjects = [
    { id: 1, name: "Matematik", icon: "📐" },
    { id: 2, name: "İngilizce", icon: "🗣️" },
    { id: 3, name: "Fizik", icon: "⚛️" },
    { id: 4, name: "Kimya", icon: "🧪" },
    { id: 5, name: "Türkçe", icon: "📝" },
    { id: 6, name: "Biyoloji", icon: "🧬" },
    { id: 7, name: "Tarih", icon: "📜" },
    { id: 8, name: "Coğrafya", icon: "🌍" },
    { id: 9, name: "Programlama", icon: "💻" },
  ];

  // API'den veriler yüklenmediyse demo verileri göster
  const displayTeachers = sortedTeachers.length > 0 ? sortedTeachers : demoTeachers;
  const displaySubjects = subjects.length > 0 ? subjects : demoSubjects;

  // Minimum ve maksimum ücretleri hesapla
  const minPrice = Math.min(...displayTeachers.map((t: Teacher) => t.hourlyRate));
  const maxPrice = Math.max(...displayTeachers.map((t: Teacher) => t.hourlyRate));

  // Component ilk yüklendiğinde fiyat aralığını ayarla
  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [teachers.length]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-1">Öğretmen Bul</h1>
          <p className="text-muted-foreground">
            İhtiyacınıza uygun deneyimli öğretmenler ile bağlantı kurun
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sıralama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">En Yüksek Puan</SelectItem>
              <SelectItem value="price-low">Fiyat: Düşükten Yükseğe</SelectItem>
              <SelectItem value="price-high">Fiyat: Yüksekten Düşüğe</SelectItem>
              <SelectItem value="experience">Deneyim</SelectItem>
              <SelectItem value="popularity">Popülerlik</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewType === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewType("grid")}
              className="rounded-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grid">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </Button>
            <Button
              variant={viewType === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewType("list")}
              className="rounded-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list">
                <line x1="8" x2="21" y1="6" y2="6" />
                <line x1="8" x2="21" y1="12" y2="12" />
                <line x1="8" x2="21" y1="18" y2="18" />
                <line x1="3" x2="3.01" y1="6" y2="6" />
                <line x1="3" x2="3.01" y1="12" y2="12" />
                <line x1="3" x2="3.01" y1="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtreler (Soldaki Sidebar) */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filtreler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Arama */}
              <div>
                <label htmlFor="search" className="text-sm font-medium block mb-2">
                  Öğretmen Ara
                </label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="İsim ile ara..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Konu Filtresi */}
              <div>
                <label htmlFor="subject" className="text-sm font-medium block mb-2">
                  Ders Konusu
                </label>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Konu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Konular</SelectItem>
                    {displaySubjects.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.icon ? `${subject.icon} ` : ""}{subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fiyat Aralığı */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="price-range" className="text-sm font-medium">
                    Fiyat Aralığı
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {priceRange[0]}₺ - {priceRange[1]}₺
                  </span>
                </div>
                <Slider
                  id="price-range"
                  defaultValue={[minPrice, maxPrice]}
                  min={minPrice}
                  max={maxPrice}
                  step={10}
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  className="mb-4"
                />
              </div>

              {/* Puan Filtresi */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  Minimum Puan
                </label>
                <div className="flex flex-wrap gap-2">
                  {[null, 3, 3.5, 4, 4.5].map((rating) => (
                    <Button
                      key={rating === null ? "all" : rating}
                      variant={ratingFilter === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRatingFilter(rating)}
                    >
                      {rating === null ? "Tümü" : (
                        <div className="flex items-center">
                          {rating}+ <Star className="h-3 w-3 ml-1 fill-current" />
                        </div>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Deneyim Filtresi */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  Minimum Deneyim
                </label>
                <div className="flex flex-wrap gap-2">
                  {[null, 1, 3, 5, 10].map((years) => (
                    <Button
                      key={years === null ? "all" : years}
                      variant={experienceFilter === years ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExperienceFilter(years)}
                    >
                      {years === null ? "Tümü" : `${years}+ yıl`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Filtreleri Sıfırla */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSearchQuery("");
                  setSubjectFilter("all");
                  setPriceRange([minPrice, maxPrice]);
                  setRatingFilter(null);
                  setExperienceFilter(null);
                }}
              >
                Filtreleri Sıfırla
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Öğretmen Listesi */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="teachers">
            <TabsList className="mb-6">
              <TabsTrigger value="teachers">
                <BookOpen className="h-4 w-4 mr-2" />
                Öğretmenler
              </TabsTrigger>
              <TabsTrigger value="favorite">
                <Bookmark className="h-4 w-4 mr-2" />
                Favoriler ({favoriteTeachers.length})
              </TabsTrigger>
              <TabsTrigger value="recent">
                <Clock className="h-4 w-4 mr-2" />
                Son Görüntülenenler
              </TabsTrigger>
            </TabsList>

            <TabsContent value="teachers">
              {isLoadingTeachers ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">Öğretmenler yükleniyor...</span>
                </div>
              ) : displayTeachers.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">Sonuç bulunamadı</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Arama kriterlerinize uygun öğretmen bulunamadı. Lütfen filtrelerinizi değiştirin.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      {displayTeachers.length} öğretmen bulundu
                    </p>
                  </div>
                  <div className={
                    viewType === "grid" 
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" 
                      : "space-y-4"
                  }>
                    {displayTeachers.map((teacher: Teacher) => (
                      <TeacherProfileCard
                        key={teacher.id}
                        teacher={teacher}
                        viewType={viewType}
                        isFavorite={favoriteTeachers.includes(teacher.userId)}
                        onToggleFavorite={() => toggleFavorite(teacher.userId)}
                        onClick={() => handleTeacherClick(teacher.userId)}
                      />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="favorite">
              {favoriteTeachers.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <Bookmark className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">Favori öğretmeniniz yok</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Öğretmenleri favorilere ekleyerek daha sonra kolayca erişebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className={
                  viewType === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" 
                    : "space-y-4"
                }>
                  {displayTeachers
                    .filter((teacher: Teacher) => favoriteTeachers.includes(teacher.userId))
                    .map((teacher: Teacher) => (
                      <TeacherProfileCard
                        key={teacher.id}
                        teacher={teacher}
                        viewType={viewType}
                        isFavorite={true}
                        onToggleFavorite={() => toggleFavorite(teacher.userId)}
                        onClick={() => handleTeacherClick(teacher.userId)}
                      />
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent">
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">Son görüntülenen öğretmenler</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Henüz bir öğretmen profili görüntülemediniz.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}