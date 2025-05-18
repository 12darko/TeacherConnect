import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import TeacherCard from "@/components/TeacherCard";
import { SearchIcon, FilterIcon } from "lucide-react";

export default function FindTeachers() {
  const [, params] = useLocation();
  const urlParams = new URLSearchParams(params);
  const initialSubjectId = urlParams.get("subject");

  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubjectId || "");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
  });

  // Fetch teachers
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['/api/teachers', selectedSubject],
    queryFn: async ({ queryKey }) => {
      const subjectId = queryKey[1];
      const url = subjectId 
        ? `/api/teachers?subjectId=${subjectId}` 
        : '/api/teachers';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch teachers');
      return res.json();
    }
  });

  // Filter teachers based on search and filters
  const filteredTeachers = teachers.filter((teacher: any) => {
    // Filter by search term
    const nameMatch = teacher.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const bioMatch = teacher.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    const searchMatch = nameMatch || bioMatch;

    // Filter by price range
    const priceMatch = teacher.hourlyRate >= priceRange[0] && teacher.hourlyRate <= priceRange[1];

    // Filter by rating
    const ratingMatch = teacher.averageRating >= minRating;

    return searchMatch && priceMatch && ratingMatch;
  });

  // Update selectedSubject when initialSubjectId changes
  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubject(initialSubjectId);
    }
  }, [initialSubjectId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-semibold mb-2">Find Teachers</h1>
        <p className="text-neutral-medium">Connect with expert teachers for personalized 1-on-1 lessons</p>
      </div>

      {/* Search and filter bar */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-medium h-5 w-5" />
            <Input
              placeholder="Search by name or keywords"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Subjects</SelectItem>
              {subjects.map((subject: any) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="md:w-auto w-full"
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Price Range ($/hour)</h3>
                  <div className="px-2">
                    <Slider
                      value={[priceRange[0], priceRange[1]]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(value) => setPriceRange([value[0], value[1]])}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-neutral-medium">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Minimum Rating</h3>
                  <div className="px-2">
                    <Slider
                      value={[minRating]}
                      min={0}
                      max={5}
                      step={0.5}
                      onValueChange={(value) => setMinRating(value[0])}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-neutral-medium">
                      <span>Any</span>
                      <span>{minRating} stars</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Teachers list */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-neutral-medium">Loading teachers...</p>
        </div>
      ) : filteredTeachers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTeachers.map((teacher: any) => (
            <TeacherCard
              key={teacher.id}
              id={teacher.userId}
              name={teacher.name}
              profileImage={teacher.profileImage}
              subject={subjects.find((s: any) => teacher.subjectIds.includes(s.id))?.name || "Multiple Subjects"}
              rating={teacher.averageRating}
              reviewCount={teacher.totalReviews}
              bio={teacher.bio || "Experienced teacher available for lessons."}
              hourlyRate={teacher.hourlyRate}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-neutral-lightest rounded-lg">
          <span className="material-icons text-neutral-medium text-5xl mb-4">search_off</span>
          <h3 className="text-xl font-medium mb-2">No teachers found</h3>
          <p className="text-neutral-medium mb-4">Try adjusting your search or filters to find more teachers.</p>
          <Button onClick={() => {
            setSearchTerm("");
            setSelectedSubject("");
            setPriceRange([0, 100]);
            setMinRating(0);
          }}>
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
