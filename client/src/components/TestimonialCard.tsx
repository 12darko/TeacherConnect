import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarIcon } from "lucide-react";

export type TestimonialCardProps = {
  id: number;
  studentName: string;
  studentImage?: string;
  rating: number;
  comment?: string;
  date: Date;
};

export function TestimonialCard({
  studentName,
  studentImage,
  rating,
  comment,
  date
}: TestimonialCardProps) {
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[1][0]}`
      : parts[0].substring(0, 2);
  };
  
  // Format date
  const formattedDate = new Date(date).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <Card className="h-full transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar>
          <AvatarImage src={studentImage} alt={studentName} />
          <AvatarFallback>{getInitials(studentName)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="font-medium leading-none mb-1">{studentName}</div>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={i < rating 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "fill-gray-200 text-gray-200"}
                size={14}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground pb-4">
        {comment || "Harika bir öğretmen! Çok şey öğrendim."}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-3">
        {formattedDate}
      </CardFooter>
    </Card>
  );
}