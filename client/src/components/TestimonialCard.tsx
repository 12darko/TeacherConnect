import { StarIcon } from "lucide-react";

interface TestimonialCardProps {
  text: string;
  rating: number;
  studentName: string;
  studentSubject: string;
  studentInitials: string;
}

export default function TestimonialCard({
  text,
  rating,
  studentName,
  studentSubject,
  studentInitials,
}: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-3">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "text-yellow-400 fill-current" : "text-neutral-300"
            }`}
          />
        ))}
      </div>
      
      <p className="text-neutral-800 mb-4">{text}</p>
      
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-medium mr-3">
          {studentInitials}
        </div>
        <div>
          <h4 className="font-medium text-neutral-900">{studentName}</h4>
          <p className="text-sm text-neutral-medium">{studentSubject} Student</p>
        </div>
      </div>
    </div>
  );
}