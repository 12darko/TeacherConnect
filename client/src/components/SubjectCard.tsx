import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SubjectCardProps = {
  id: number;
  name: string;
  icon: string;
  teacherCount?: number;
  description?: string;
};

export function SubjectCard({ id, name, icon, teacherCount = 0, description }: SubjectCardProps) {
  const [, setLocation] = useLocation();
  
  // Dinamik olarak icon'u al
  let IconComponent;
  try {
    // Eğer Lucide icon ise
    IconComponent = (LucideIcons[icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Book;
  } catch (error) {
    // Eğer string ise (material icon veya emoji)
    IconComponent = null;
  }
  
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="p-2 rounded-full bg-primary/10 text-primary flex items-center justify-center w-12 h-12">
          {IconComponent ? (
            <IconComponent size={24} />
          ) : (
            // Lucide icon değilse material icon veya emoji olarak göster
            <span className="text-2xl">{icon}</span>
          )}
        </div>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <CardDescription>
          {description || 
            (teacherCount > 0 
              ? `${teacherCount} öğretmen bu dersi veriyor`
              : "Bu dersi veren öğretmenleri keşfedin")}
        </CardDescription>
      </CardContent>
      <CardFooter className="mt-auto pt-2">
        <Link href={`/find-teachers?subject=${id}`}>
          <Button
            className="w-full group"
          >
            Öğretmenleri Gör
            <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}