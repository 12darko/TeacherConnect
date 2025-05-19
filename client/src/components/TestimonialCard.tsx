import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarIcon } from "lucide-react";

export type TestimonialCardProps = {
  id: number;
  studentName?: string; // Maps to name in database
  studentImage?: string; // Maps to avatarUrl in database
  name?: string; // Direct database field
  avatarUrl?: string; // Direct database field
  role?: string;
  rating: number;
  comment?: string;
  date: Date | string;
};

export function TestimonialCard({
  studentName,
  studentImage,
  name,
  avatarUrl,
  role,
  rating,
  comment,
  date
}: TestimonialCardProps) {
  // Veritabanı isimlerine uygun şekilde değişkenleri ayarla
  const displayName = name || studentName || "Anonymous Student";
  const displayImage = avatarUrl || studentImage;
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "AN"; // Anonymous
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
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 flex flex-col h-full relative overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-10 -translate-y-10 -z-10"></div>
      
      <div className="flex items-start space-x-4 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center">
            {displayImage ? (
              <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-medium">{getInitials(displayName)}</span>
            )}
          </div>
          <div className="absolute -right-1 -bottom-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center">
            <StarIcon size={12} className="fill-white" />
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="font-bold text-lg">{displayName}</div>
          {role && <div className="text-sm text-neutral-500">{role}</div>}
          <div className="flex items-center mt-1">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={i < rating 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "fill-gray-200 text-gray-200"}
                size={16}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        <p className="text-neutral-700 leading-relaxed italic">
          "{comment || "Harika bir öğretmen! Çok şey öğrendim."}"
        </p>
      </div>
      
      <div className="text-xs text-neutral-500 mt-4 pt-3 border-t border-neutral-100">
        {formattedDate}
      </div>
    </div>
  );
}