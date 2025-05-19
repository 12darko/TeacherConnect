import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import ReactMarkdown from "react-markdown";

export default function Privacy() {
  // Fetch privacy policy data
  const { data: privacyData, isLoading } = useQuery({
    queryKey: ['/api/privacy'],
    queryFn: async () => {
      const response = await fetch('/api/privacy');
      if (!response.ok) {
        throw new Error('Failed to fetch privacy policy');
      }
      return response.json();
    }
  });

  return (
    <>
      <Helmet>
        <title>Gizlilik Politikası | EduConnect</title>
        <meta name="description" content="EduConnect gizlilik politikası. Verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuz hakkında bilgi edinin." />
      </Helmet>
      
      <div className="container max-w-4xl mx-auto py-16 px-4">
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-12 w-1/3 bg-neutral-200 animate-pulse rounded"></div>
            <div className="h-6 w-2/3 bg-neutral-200 animate-pulse rounded mb-6"></div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-neutral-200 animate-pulse rounded mb-4"></div>
            ))}
          </div>
        ) : (
          <div>
            <h1 className="text-4xl font-bold mb-8 text-center">
              {privacyData?.title || "Gizlilik Politikası"}
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>
                {privacyData?.content || ""}
              </ReactMarkdown>
              
              <div className="mt-12 text-sm text-neutral-600">
                <p>Son güncelleme: {new Date(privacyData?.updatedAt || new Date()).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}