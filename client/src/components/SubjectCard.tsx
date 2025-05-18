import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
// Icon type için lucide-react'tan LucideIcon kullanıyoruz
import { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

type SubjectCardProps = {
  id: number;
  name: string;
  icon: string;
  teacherCount?: number;
};

export function SubjectCard({ id, name, icon, teacherCount = 0 }: SubjectCardProps) {
  const [, setLocation] = useLocation();
  
  // Dinamik olarak icon'u al
  const IconComponent = LucideIcons[icon as keyof typeof LucideIcons] as LucideIcon || LucideIcons.Book;
  
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          {IconComponent && <IconComponent size={24} />}
        </div>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <CardDescription>
          {teacherCount > 0 
            ? `${teacherCount} öğretmen bu dersi veriyor`
            : "Bu dersi veren öğretmenleri keşfedin"}
        </CardDescription>
      </CardContent>
      <CardFooter className="mt-auto pt-2">
        <Button
          variant="outline"
          onClick={() => setLocation(`/teachers?subjectId=${id}`)}
          className="w-full"
        >
          Öğretmenleri Gör
        </Button>
      </CardFooter>
    </Card>
  );
}