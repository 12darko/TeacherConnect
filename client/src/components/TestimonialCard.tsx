import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface TestimonialCardProps {
  text: string;
  rating: number;
  studentName: string;
  studentSubject: string;
  studentInitials?: string;
  studentImage?: string;
}

export default function TestimonialCard({
  text,
  rating,
  studentName,
  studentSubject,
  studentInitials,
  studentImage
}: TestimonialCardProps) {
  return (
    <Card className="bg-white p-6 rounded-lg shadow-sm">
      <CardContent className="p-0">
        <div className="flex text-yellow-400 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              className="h-4 w-4" 
              fill={i < rating ? "currentColor" : "none"} 
            />
          ))}
        </div>
        <p className="text-neutral-dark italic mb-4">"{text}"</p>
        <div className="flex items-center">
          {studentImage ? (
            <img 
              className="h-10 w-10 rounded-full object-cover"
              src={studentImage}
              alt={`${studentName} profile`}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-primary">
              {studentInitials || studentName.substring(0, 2)}
            </div>
          )}
          <div className="ml-3">
            <h4 className="text-sm font-medium">{studentName}</h4>
            <p className="text-xs text-neutral-medium">{studentSubject} Student</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
