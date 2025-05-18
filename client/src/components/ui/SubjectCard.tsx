import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface SubjectCardProps {
  id: number;
  name: string;
  icon: string;
  teacherCount?: number;
  description?: string;
}

export function SubjectCard({ id, name, icon, teacherCount = 12, description }: SubjectCardProps) {
  return (
    <Card className="h-full transition duration-300 hover:shadow-md overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 text-2xl bg-primary/10 rounded-full">
            {icon}
          </div>
          <CardTitle>{name}</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        <CardDescription className="mb-2">
          {description || `${name} dersini veren öğretmenleri keşfedin ve öğrenmeye hemen başlayın.`}
        </CardDescription>
        
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{teacherCount}</span> öğretmen bu dersi veriyor
        </p>
      </CardContent>
      
      <CardFooter>
        <Link href={`/find-teachers?subject=${id}`}>
          <Button className="w-full bg-primary text-white hover:bg-primary/90">
            Öğretmenleri Gör
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}