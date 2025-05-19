import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Mail, 
  Phone, 
  MapPin 
} from "lucide-react";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  // Fetch contact page data
  const { data: contactData, isLoading } = useQuery({
    queryKey: ['/api/contact-page'],
    queryFn: async () => {
      const response = await fetch('/api/contact-page');
      if (!response.ok) {
        throw new Error('Failed to fetch contact page data');
      }
      return response.json();
    }
  });

  // Mutation for sending contact form
  const sendMessageMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/contact-message', data);
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mesajınız Gönderildi",
        description: "Size en kısa sürede dönüş yapacağız.",
      });
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata Oluştu",
        description: error.message || "Mesajınız gönderilemedi. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive"
      });
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageMutation.mutate(formData);
  };

  return (
    <>
      <Helmet>
        <title>İletişim | EduConnect</title>
        <meta name="description" content="EduConnect ile iletişime geçin. Herhangi bir sorunuz, öneriniz veya geri bildiriminiz için bize ulaşın." />
      </Helmet>
      
      <div className="container max-w-6xl mx-auto py-16 px-4">
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-12 w-1/3 bg-neutral-200 animate-pulse rounded"></div>
            <div className="h-6 w-2/3 bg-neutral-200 animate-pulse rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-neutral-200 animate-pulse rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-neutral-200 animate-pulse rounded mt-8"></div>
          </div>
        ) : (
          <div>
            <h1 className="text-4xl font-bold mb-4 text-center">
              {contactData?.title || "İletişim"}
            </h1>
            <p className="text-xl text-center text-neutral-600 mb-12 max-w-3xl mx-auto">
              {contactData?.subtitle || "Bize ulaşın! Herhangi bir sorunuz, öneriniz veya geri bildiriminiz varsa, aşağıdaki iletişim bilgilerini kullanarak bizimle iletişime geçebilirsiniz."}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <Card className="bg-white hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">E-posta</CardTitle>
                </CardHeader>
                <CardContent>
                  <a href={`mailto:${contactData?.email}`} className="text-primary hover:underline">
                    {contactData?.email || "info@educonnect.com"}
                  </a>
                </CardContent>
              </Card>
              
              <Card className="bg-white hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Telefon</CardTitle>
                </CardHeader>
                <CardContent>
                  <a href={`tel:${contactData?.phone?.replace(/\s/g, '')}`} className="text-primary hover:underline">
                    {contactData?.phone || "+90 212 555 1234"}
                  </a>
                </CardContent>
              </Card>
              
              <Card className="bg-white hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Adres</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-700">
                    {contactData?.address || "Levent Mah, Büyükdere Cad. No:123, 34330 Beşiktaş/İstanbul"}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Map */}
              <div className="w-full h-[400px] bg-neutral-100 rounded-xl overflow-hidden">
                {contactData?.map_embed_url ? (
                  <iframe
                    src={contactData.map_embed_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="EduConnect Office Location"
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500">
                    Harita yüklenemedi
                  </div>
                )}
              </div>
              
              {/* Contact Form */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>{contactData?.form_title || "Mesaj Gönder"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Input
                        name="name"
                        placeholder="Adınız"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        name="email"
                        type="email"
                        placeholder="E-posta Adresiniz"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        name="subject"
                        placeholder="Konu"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Textarea
                        name="message"
                        placeholder="Mesajınız"
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? "Gönderiliyor..." : "Gönder"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}