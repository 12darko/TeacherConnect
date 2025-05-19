import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";

export default function About() {
  // Fetch about page data
  const { data: aboutData, isLoading: isAboutLoading } = useQuery({
    queryKey: ['/api/about'],
    queryFn: async () => {
      const response = await fetch('/api/about');
      if (!response.ok) {
        throw new Error('Failed to fetch about page data');
      }
      return response.json();
    }
  });

  // Fetch team members
  const { data: teamMembers, isLoading: isTeamLoading } = useQuery({
    queryKey: ['/api/team-members'],
    queryFn: async () => {
      const response = await fetch('/api/team-members');
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      return response.json();
    }
  });

  const isLoading = isAboutLoading || isTeamLoading;

  return (
    <>
      <Helmet>
        <title>Hakkımızda | EduConnect</title>
        <meta name="description" content="EduConnect hakkında bilgi edinmek için sayfamızı ziyaret edin. Misyonumuz, vizyonumuz ve değerlerimizi keşfedin." />
      </Helmet>
      
      <div className="container max-w-5xl mx-auto py-16 px-4">
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-12 w-1/3 bg-neutral-200 animate-pulse rounded"></div>
            <div className="h-48 bg-neutral-200 animate-pulse rounded mb-6"></div>
            <div className="h-8 w-1/4 bg-neutral-200 animate-pulse rounded"></div>
            <div className="h-24 bg-neutral-200 animate-pulse rounded mb-6"></div>
            <div className="h-8 w-1/4 bg-neutral-200 animate-pulse rounded"></div>
            <div className="h-24 bg-neutral-200 animate-pulse rounded mb-6"></div>
            <div className="h-8 w-1/4 bg-neutral-200 animate-pulse rounded"></div>
            <div className="h-48 bg-neutral-200 animate-pulse rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-neutral-200 animate-pulse rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-4xl font-bold mb-8 text-center">
              {aboutData?.title || "Hakkımızda"}
            </h1>
            
            <div className="prose max-w-none mb-12">
              <p className="text-lg mb-8">{aboutData?.content}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-primary/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-primary">Misyonumuz</h3>
                  <p>{aboutData?.mission}</p>
                </div>
                
                <div className="bg-primary/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-primary">Vizyonumuz</h3>
                  <p>{aboutData?.vision}</p>
                </div>
                
                <div className="bg-primary/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-primary">Değerlerimiz</h3>
                  <p>{aboutData?.values}</p>
                </div>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold mb-8 text-center">
              {aboutData?.teamSectionTitle || "Ekibimiz"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers?.map((member) => (
                <Card key={member.id} className="overflow-hidden bg-white hover:shadow-md transition-shadow">
                  <div className="h-48 overflow-hidden bg-primary/5">
                    {member.imageUrl ? (
                      <img 
                        src={member.imageUrl} 
                        alt={member.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <span className="text-4xl text-primary/50">{member.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                    <p className="text-primary mb-3">{member.position}</p>
                    {member.bio && <p className="text-neutral-600 text-sm">{member.bio}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}