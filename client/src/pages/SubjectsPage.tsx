import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, ArrowRight } from "lucide-react";

type Subject = {
  id: number;
  name: string;
  icon: string;
  description?: string;
  teacherCount?: number;
};

export default function SubjectsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch subjects from API
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['/api/subjects'],
  });
  
  // Filter subjects based on search query
  const filteredSubjects = subjects.filter((subject: Subject) => 
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Demo subjects if API doesn't return data
  const demoSubjects: Subject[] = [
    {
      id: 1,
      name: "Matematik",
      icon: "📐",
      description: "Temel matematik, geometri, cebir ve daha fazlası",
      teacherCount: 28
    },
    {
      id: 2,
      name: "İngilizce",
      icon: "🗣️",
      description: "İngilizce konuşma, yazma, okuma ve dinleme becerileri",
      teacherCount: 25
    },
    {
      id: 3,
      name: "Fizik",
      icon: "⚛️",
      description: "Mekanik, elektrik, ısı ve modern fizik konuları",
      teacherCount: 15
    },
    {
      id: 4,
      name: "Kimya",
      icon: "🧪",
      description: "Organik, inorganik kimya ve laboratuvar çalışmaları",
      teacherCount: 12
    },
    {
      id: 5,
      name: "Türkçe",
      icon: "📝",
      description: "Gramer, okuma-yazma, anlama ve kompozisyon",
      teacherCount: 22
    },
    {
      id: 6,
      name: "Biyoloji",
      icon: "🧬",
      description: "Hücre yapısı, genetik, evrim ve ekoloji",
      teacherCount: 14
    },
    {
      id: 7,
      name: "Tarih",
      icon: "📜",
      description: "Türkiye tarihi, dünya tarihi ve sanat tarihi",
      teacherCount: 10
    },
    {
      id: 8,
      name: "Coğrafya",
      icon: "🌍",
      description: "Fiziki coğrafya, ülkeler ve ekonomik coğrafya",
      teacherCount: 8
    },
    {
      id: 9,
      name: "Programlama",
      icon: "💻",
      description: "Python, JavaScript, Java, C++ ve web geliştirme",
      teacherCount: 18
    },
    {
      id: 10,
      name: "Müzik",
      icon: "🎵",
      description: "Teori, enstrüman öğrenimi ve beste yapma",
      teacherCount: 9
    },
    {
      id: 11,
      name: "Sanat",
      icon: "🎨",
      description: "Çizim, resim, heykel ve sanat tarihi",
      teacherCount: 7
    },
    {
      id: 12,
      name: "Felsefe",
      icon: "🧠",
      description: "Mantık, etik, metafizik ve politik felsefe",
      teacherCount: 5
    },
  ];
  
  // Use demo subjects if API doesn't return data
  const displaySubjects = filteredSubjects.length > 0 ? filteredSubjects : 
    demoSubjects.filter(subject => subject.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-1">Ders Konuları</h1>
          <p className="text-muted-foreground">
            Öğrenmek istediğiniz konuları keşfedin ve uzman öğretmenler bulun
          </p>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative max-w-lg mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ders konusu ara..."
            className="pl-10 py-6"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Subject Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="h-64 bg-neutral-100 animate-pulse"></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displaySubjects.map((subject: Subject) => (
            <Card key={subject.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full text-2xl">
                    {subject.icon}
                  </div>
                  <CardTitle className="text-xl">{subject.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="h-12 line-clamp-2">
                  {subject.description || "Bu dersin öğretmenlerini keşfedin ve öğrenmeye hemen başlayın."}
                </CardDescription>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-medium">{subject.teacherCount || "10+"}</span> öğretmen bu dersi veriyor
                </p>
              </CardContent>
              <CardFooter>
                <Link href={`/find-teachers?subject=${subject.id}`}>
                  <Button className="w-full group">
                    Öğretmenleri Gör
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}