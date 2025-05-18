import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { StarIcon } from "lucide-react";

interface TeacherCardProps {
  id: string;
  name: string;
  profileImage?: string;
  subject: string;
  rating?: number;
  reviewCount?: number;
  bio: string;
  hourlyRate: number;
}

export default function TeacherCard({
  id,
  name,
  profileImage,
  subject,
  rating = 0,
  reviewCount = 0,
  bio,
  hourlyRate,
}: TeacherCardProps) {
  // Default profile image
  const defaultImage = "https://ui-avatars.com/api/?name=" + encodeURIComponent(name) + "&background=random";
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-200">
      <div className="relative pb-1/2 h-40">
        <img
          src={profileImage || defaultImage}
          alt={`${name}'s profile`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium">{name}</h3>
            <p className="text-neutral-medium text-sm">{subject}</p>
          </div>
          <div className="flex items-center">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(rating)
                      ? "text-yellow-400 fill-current"
                      : "text-neutral-300"
                  }`}
                />
              ))}
            </div>
            <span className="ml-1 text-xs text-neutral-medium">
              ({reviewCount})
            </span>
          </div>
        </div>
        
        <p className="mt-2 text-sm text-neutral-medium line-clamp-2">
          {bio}
        </p>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-primary font-semibold">${hourlyRate}/hr</div>
          <Link href={`/teacher/${id}`}>
            <Button size="sm">View Profile</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}