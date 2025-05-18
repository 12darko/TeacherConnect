import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, StarHalf } from "lucide-react";

interface TeacherCardProps {
  id: number;
  name: string;
  profileImage?: string;
  subject: string;
  rating: number;
  reviewCount: number;
  bio: string;
  hourlyRate: number;
}

export default function TeacherCard({
  id,
  name,
  profileImage,
  subject,
  rating,
  reviewCount,
  bio,
  hourlyRate
}: TeacherCardProps) {
  // Generate star rating display
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="text-yellow-400 h-4 w-4" fill="currentColor" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="text-yellow-400 h-4 w-4" fill="currentColor" />);
    }
    
    // Add empty stars to make 5 total
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-star-${i}`} className="text-yellow-400 h-4 w-4" />);
    }
    
    return stars;
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition duration-200">
      <CardContent className="p-4">
        <div className="flex items-start">
          {profileImage ? (
            <img 
              className="h-12 w-12 rounded-full object-cover"
              src={profileImage}
              alt={`${name} profile photo`}
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white">
              {name.substring(0, 2)}
            </div>
          )}
          <div className="ml-3">
            <h3 className="text-lg font-medium text-neutral-dark">{name}</h3>
            <p className="text-sm text-neutral-medium">{subject}</p>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex items-center">
            <div className="flex">
              {renderStars(rating)}
            </div>
            <span className="ml-1 text-sm text-neutral-medium">{rating.toFixed(1)} ({reviewCount} reviews)</span>
          </div>
          <p className="mt-2 text-sm text-neutral-dark line-clamp-2">{bio}</p>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <span className="text-primary font-semibold">${hourlyRate} <span className="text-neutral-medium font-normal">/hour</span></span>
          <Link href={`/teacher/${id}`}>
            <Button size="sm">Book Session</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
