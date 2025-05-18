import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bookmark, CalendarClock, Star, Clock, Users, School } from "lucide-react";

// Öğretmen tipi
type Teacher = {
  id: number;
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  subjectIds: number[];
  subjectNames: string[];
  hourlyRate: number;
  yearsOfExperience: number;
  averageRating: number;
  totalReviews: number;
  totalStudents: number;
  availability: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
};

type TeacherProfileCardProps = {
  teacher: Teacher;
  viewType: "grid" | "list";
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
};

export function TeacherProfileCard({
  teacher,
  viewType,
  isFavorite,
  onToggleFavorite,
  onClick,
}: TeacherProfileCardProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  if (viewType === "list") {
    return (
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex items-center p-4 md:p-6 md:w-64 md:border-r">
            <Avatar className="h-16 w-16 rounded-md">
              {teacher.profileImageUrl ? (
                <AvatarImage src={teacher.profileImageUrl} alt={`${teacher.firstName} ${teacher.lastName}`} />
              ) : (
                <AvatarFallback className="rounded-md bg-primary text-primary-foreground">
                  {getInitials(teacher.firstName, teacher.lastName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="ml-4">
              <h3 className="font-semibold text-lg">
                {teacher.firstName} {teacher.lastName}
              </h3>
              <div className="flex items-center mt-1">
                <Star className="text-yellow-500 fill-yellow-500 h-4 w-4 mr-1" />
                <span className="font-medium">{teacher.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm ml-1">
                  ({teacher.totalReviews} değerlendirme)
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-wrap gap-1 mb-3">
              {teacher.subjectNames.map((subject) => (
                <Badge key={subject} variant="secondary" className="font-normal">
                  {subject}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center">
                <School className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Deneyim</p>
                  <p className="font-medium">{teacher.yearsOfExperience} yıl</p>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Öğrenciler</p>
                  <p className="font-medium">{teacher.totalStudents}</p>
                </div>
              </div>
              <div className="flex items-center">
                <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Müsaitlik</p>
                  <p className="font-medium">{teacher.availability.length} gün</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Saatlik Ücret</p>
                <p className="text-xl font-semibold">{teacher.hourlyRate}₺</p>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleFavorite();
                        }}
                      >
                        <Bookmark
                          className={`h-5 w-5 ${isFavorite ? "fill-current text-primary" : ""}`}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Link href={`/teacher/${teacher.id}`} onClick={onClick}>
                  <Button>Profili Görüntüle</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-4 relative">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite();
                }}
              >
                <Bookmark
                  className={`h-5 w-5 ${isFavorite ? "fill-current text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex items-center">
          <Avatar className="h-12 w-12 rounded-md">
            {teacher.profileImageUrl ? (
              <AvatarImage src={teacher.profileImageUrl} alt={`${teacher.firstName} ${teacher.lastName}`} />
            ) : (
              <AvatarFallback className="rounded-md bg-primary text-primary-foreground">
                {getInitials(teacher.firstName, teacher.lastName)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="ml-3">
            <CardTitle className="text-base">
              {teacher.firstName} {teacher.lastName}
            </CardTitle>
            <div className="flex items-center mt-1">
              <Star className="text-yellow-500 fill-yellow-500 h-4 w-4 mr-1" />
              <span className="font-medium">{teacher.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground text-xs ml-1">
                ({teacher.totalReviews})
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2 flex-1">
        <div className="flex flex-wrap gap-1 mb-4">
          {teacher.subjectNames.map((subject) => (
            <Badge key={subject} variant="secondary" className="font-normal">
              {subject}
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center">
            <School className="h-4 w-4 mr-2 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Deneyim</p>
              <p className="font-medium">{teacher.yearsOfExperience} yıl</p>
            </div>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Öğrenciler</p>
              <p className="font-medium">{teacher.totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Saatlik Ücret</p>
              <p className="text-xl font-semibold">{teacher.hourlyRate}₺</p>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarClock className="h-3 w-3 mr-1" />
              <span>{teacher.availability.length} gün müsait</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href={`/teacher/${teacher.id}`} className="w-full" onClick={onClick}>
          <Button className="w-full">Profili Görüntüle</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}