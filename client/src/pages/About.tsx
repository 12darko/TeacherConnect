import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function About() {
  // Fetch about us data
  const { data: aboutData, isLoading: isLoadingAbout } = useQuery({
    queryKey: ['/api/about'],
    queryFn: async () => {
      const response = await fetch('/api/about');
      if (!response.ok) {
        throw new Error('Failed to fetch about us data');
      }
      return response.json();
    }
  });

  // Fetch team members data
  const { data: teamMembers = [], isLoading: isLoadingTeam } = useQuery({
    queryKey: ['/api/team-members'],
    queryFn: async () => {
      const response = await fetch('/api/team-members');
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      return response.json();
    }
  });

  const isLoading = isLoadingAbout || isLoadingTeam;

  return (
    <>
      <Helmet>
        <title>Hakkımızda | EduConnect</title>
        <meta name="description" content="EduConnect hakkında bilgi edinin. Misyonumuz, vizyonumuz ve değerlerimizi keşfedin." />
      </Helmet>
      
      <div className="container max-w-5xl mx-auto py-16 px-4">
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-12 w-1/3 bg-neutral-200 animate-pulse rounded"></div>
            <div className="h-64 bg-neutral-200 animate-pulse rounded"></div>
            <div className="h-12 w-1/3 bg-neutral-200 animate-pulse rounded"></div>
            <div className="h-64 bg-neutral-200 animate-pulse rounded"></div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Main About Section */}
            <section>
              <h1 className="text-4xl font-bold mb-6 text-center">
                {aboutData?.title || "Hakkımızda"}
              </h1>
              <div className="prose prose-lg max-w-none">
                <p className="text-xl text-center text-neutral-700 mb-12">
                  {aboutData?.content}
                </p>
              </div>
            </section>

            {/* Mission, Vision, Values Section */}
            <section className="grid md:grid-cols-3 gap-8">
              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-bold mb-4 text-primary">Misyonumuz</h3>
                  <p className="text-neutral-700">{aboutData?.mission}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-bold mb-4 text-primary">Vizyonumuz</h3>
                  <p className="text-neutral-700">{aboutData?.vision}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-bold mb-4 text-primary">Değerlerimiz</h3>
                  <p className="text-neutral-700">{aboutData?.values}</p>
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* Team Section */}
            <section>
              <h2 className="text-3xl font-bold mb-10 text-center">
                {aboutData?.team_section_title || "Takımımız"}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex flex-col items-center text-center">
                    <Avatar className="h-32 w-32 mb-4">
                      <AvatarImage src={member.image_url} alt={member.name} />
                      <AvatarFallback className="bg-primary text-white text-2xl">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className="text-primary font-medium mb-2">{member.position}</p>
                    <p className="text-neutral-600 text-sm">{member.bio}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
}