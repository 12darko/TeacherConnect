import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarIcon } from "lucide-react";

export type TestimonialCardProps = {
  id: number;
  studentName: string; // Maps to name in database
  studentImage?: string; // Maps to avatarUrl in database
  role?: string;
  rating: number;
  comment?: string;
  date: Date;
};

export function TestimonialCard({
  studentName,
  studentImage,
  role,
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
  
  // Format date safely
  let formattedDate = "";
  try {
    if (date) {
      formattedDate = new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      formattedDate = "Date not specified";
    }
  } catch (error) {
    formattedDate = "Invalid date";
  }
  
  return (
    <Card className="h-full transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar>
          <AvatarImage src={studentImage} alt={studentName} />
          <AvatarFallback>{getInitials(studentName)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="font-medium leading-none mb-1">{studentName}</div>
          {role && <div className="text-xs text-muted-foreground mb-1">{role}</div>}
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
        {comment || "Great teacher! I learned a lot."}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-3">
        {formattedDate}
      </CardFooter>
    </Card>
  );
}