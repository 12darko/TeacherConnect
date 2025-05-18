import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarIcon } from "lucide-react";
import { useNavigate } from "wouter";

export type TeacherCardProps = {
  id: number;
  userId: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  hourlyRate: number;
  yearsOfExperience: number;
  averageRating: number;
  totalReviews: number;
  subjectNames?: string[];
};

export function TeacherCard({
  id,
  firstName = "",
  lastName = "",
  profileImageUrl,
  hourlyRate,
  yearsOfExperience,
  averageRating,
  totalReviews,
  subjectNames = []
}: TeacherCardProps) {
  const navigate = useNavigate();
  const fullName = `${firstName} ${lastName}`;
  
  // Initials for avatar fallback
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex items-center">
        <Avatar className="h-20 w-20 mb-2">
          <AvatarImage src={profileImageUrl} alt={fullName} />
          <AvatarFallback>{initials || "ÖĞ"}</AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-lg">{fullName}</h3>
        <div className="flex items-center mt-1">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={i < Math.round(averageRating) 
                ? "fill-yellow-400 text-yellow-400" 
                : "fill-gray-200 text-gray-200"}
              size={16}
            />
          ))}
          <span className="text-sm text-muted-foreground ml-1">
            ({totalReviews} değerlendirme)
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {subjectNames.map((subject, index) => (
            <Badge key={index} variant="secondary">
              {subject}
            </Badge>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Deneyim</p>
            <p className="font-medium">{yearsOfExperience} yıl</p>
          </div>
          <div>
            <p className="text-muted-foreground">Saatlik ücret</p>
            <p className="font-medium">{hourlyRate} ₺</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="mt-auto pt-0">
        <Button 
          onClick={() => navigate(`/teachers/${id}`)} 
          className="w-full"
        >
          Profili Görüntüle
        </Button>
      </CardFooter>
    </Card>
  );
}