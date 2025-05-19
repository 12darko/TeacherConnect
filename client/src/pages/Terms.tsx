import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import ReactMarkdown from "react-markdown";

export default function Terms() {
  // Fetch terms of service data
  const { data: termsData, isLoading } = useQuery({
    queryKey: ['/api/terms'],
    queryFn: async () => {
      const response = await fetch('/api/terms');
      if (!response.ok) {
        throw new Error('Failed to fetch terms of service');
      }
      return response.json();
    }
  });

  return (
    <>
      <Helmet>
        <title>Kullanım Koşulları | EduConnect</title>
        <meta name="description" content="EduConnect kullanım koşulları. Platformumuzu kullanmadan önce lütfen kullanım koşullarımızı okuyun." />
      </Helmet>
      
      <div className="container max-w-4xl mx-auto py-16 px-4">
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-12 w-1/3 bg-neutral-200 animate-pulse rounded"></div>
            <div className="h-6 w-2/3 bg-neutral-200 animate-pulse rounded mb-6"></div>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-neutral-200 animate-pulse rounded mb-4"></div>
            ))}
          </div>
        ) : (
          <div>
            <h1 className="text-4xl font-bold mb-8 text-center">
              {termsData?.title || "Kullanım Koşulları"}
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>
                {termsData?.content || ""}
              </ReactMarkdown>
              
              <div className="mt-12 text-sm text-neutral-600">
                <p>Son güncelleme: {new Date(termsData?.updatedAt || new Date()).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}