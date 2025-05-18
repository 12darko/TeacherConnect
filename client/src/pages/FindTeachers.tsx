import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TeacherCard } from "@/components/TeacherCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SearchIcon, FilterIcon } from "lucide-react";

export default function FindTeachers() {
  const [, params] = useLocation();
  const urlParams = new URLSearchParams(params);
  const initialSubjectId = urlParams.get("subject");

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubjectId || "");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [minRating, setMinRating] = useState<number>(0);
  const [availableNow, setAvailableNow] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
  });

  // Fetch teachers with optional filters
  const { data: allTeachers = [], isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['/api/teachers'],
  });

  // Apply filters
  const filteredTeachers = allTeachers.filter((teacher: any) => {
    // Search by name
    if (
      searchTerm &&
      !teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Filter by subject
    if (
      selectedSubject &&
      !teacher.subjectIds.includes(parseInt(selectedSubject))
    ) {
      return false;
    }

    // Filter by price range
    if (
      teacher.hourlyRate < priceRange[0] ||
      teacher.hourlyRate > priceRange[1]
    ) {
      return false;
    }

    // Filter by rating
    if (teacher.averageRating < minRating) {
      return false;
    }

    // Filter by availability (this would need real availability data)
    if (availableNow && !teacher.isAvailableNow) {
      return false;
    }

    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-1">Find Teachers</h1>
          <p className="text-neutral-medium">
            Browse {filteredTeachers.length} {selectedSubject ? subjects.find((s: any) => s.id === parseInt(selectedSubject))?.name + " " : ""}
            teachers for online lessons
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Search & Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                  <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-neutral-medium" />
                </div>

                <div>
                  <Label htmlFor="subject-filter">Subject</Label>
                  <Select
                    defaultValue={selectedSubject}
                    onValueChange={setSelectedSubject}
                  >
                    <SelectTrigger id="subject-filter">
                      <SelectValue placeholder="Any subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any subject</SelectItem>
                      {subjects.map((subject: any) => (
                        <SelectItem
                          key={subject.id}
                          value={subject.id.toString()}
                        >
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Price Range ($/hr)</Label>
                    <span className="text-sm text-neutral-medium">
                      ${priceRange[0]} - ${priceRange[1]}
                    </span>
                  </div>
                  <Slider
                    defaultValue={priceRange}
                    min={0}
                    max={200}
                    step={5}
                    onValueChange={(value: number[]) => setPriceRange([value[0], value[1]])}
                    className="py-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Minimum Rating</Label>
                    <span className="text-sm text-neutral-medium">
                      {minRating} {minRating === 1 ? "star" : "stars"}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[minRating]}
                    min={0}
                    max={5}
                    step={1}
                    onValueChange={(value: number[]) => setMinRating(value[0])}
                    className="py-2"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="available-now"
                    checked={availableNow}
                    onCheckedChange={setAvailableNow}
                  />
                  <Label htmlFor="available-now">Available Now</Label>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedSubject("");
                    setPriceRange([0, 200]);
                    setMinRating(0);
                    setAvailableNow(false);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher listings */}
        <div className="lg:col-span-3">
          {/* Mobile filters button */}
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {isLoadingTeachers ? (
            <div className="text-center py-12">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-neutral-medium">Loading teachers...</p>
            </div>
          ) : filteredTeachers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map((teacher: any) => (
                <TeacherCard
                  key={teacher.id}
                  id={teacher.userId}
                  name={teacher.name || `Teacher ${teacher.id}`}
                  profileImage={teacher.profileImageUrl}
                  subject={
                    teacher.subjectIds.length > 0
                      ? subjects.find((s: any) => s.id === teacher.subjectIds[0])?.name || "Multiple Subjects"
                      : "Multiple Subjects"
                  }
                  rating={teacher.averageRating}
                  reviewCount={teacher.totalReviews}
                  bio={teacher.bio || "Experienced teacher ready to help you learn."}
                  hourlyRate={teacher.hourlyRate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-neutral-50 rounded-lg">
              <span className="material-icons text-neutral-medium text-5xl mb-4">search_off</span>
              <h3 className="text-xl font-medium mb-2">No Teachers Found</h3>
              <p className="text-neutral-medium mb-4">
                Try adjusting your filters or search criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSubject("");
                  setPriceRange([0, 200]);
                  setMinRating(0);
                  setAvailableNow(false);
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}