import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "wouter";

type AISuggestionCardProps = {
  suggestion?: string;
  type?: "study" | "teacher" | "exam";
  loading?: boolean;
};

export function AISuggestionCard({
  suggestion,
  type = "study",
  loading = false
}: AISuggestionCardProps) {
  const navigate = useNavigate();
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  
  useEffect(() => {
    if (suggestion) {
      setAiSuggestion(suggestion);
      return;
    }
    
    // Demo suggestions if none provided
    const suggestions = {
      study: [
        "Matematik konularında zorlanıyorsun. Bugün Türev konusuna odaklanmanı öneriyorum.",
        "Fizik notların yükseldi, momentum konusuna yoğunlaşarak bu ivmeyi sürdürebilirsin.",
        "İngilizce kelime hazneni geliştirmek için bugün 30 dakika pratik yapmanı tavsiye ederim."
      ],
      teacher: [
        "Matematik derslerin için Ayşe Yılmaz öğretmenle çalışmayı deneyebilirsin, öğretim stili sana uygun olabilir.",
        "Fizik konusunda zorluk yaşıyorsun. Mehmet Kaya'nın interaktif ders yaklaşımı sana yardımcı olabilir.",
        "İngilizce pratik için Sarah Johnson'ın konuşma odaklı dersleri senin için ideal olabilir."
      ],
      exam: [
        "Trigonometri sınavın yaklaşıyor, benzer soru tiplerini çözmek için örnek testlere göz atmanı öneririm.",
        "Kimya sınavında performansını artırmak için formülleri görsel kartlarla çalışmayı deneyebilirsin.",
        "Edebiyat sınavı için eser özetlerini kendi cümlelerinle yeniden yazarak çalışmanı tavsiye ederim."
      ]
    };
    
    const randomIndex = Math.floor(Math.random() * suggestions[type].length);
    setAiSuggestion(suggestions[type][randomIndex]);
  }, [suggestion, type]);
  
  const getActionText = () => {
    switch (type) {
      case "study": return "AI Tutor'a Git";
      case "teacher": return "Öğretmeni Gör";
      case "exam": return "Sınava Hazırlan";
      default: return "Detayları Gör";
    }
  };
  
  const getActionRoute = () => {
    switch (type) {
      case "study": return "/ai-tutor";
      case "teacher": return "/find-teachers";
      case "exam": return "/exams";
      default: return "/ai-tutor";
    }
  };
  
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">AI Önerisi</CardTitle>
        <Brain className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-16 flex items-center">
            <div className="animate-pulse w-full h-4 bg-primary/20 rounded"></div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {aiSuggestion || "Yapay zeka analizleri yükleniyor..."}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="ghost" 
          className="w-full justify-between text-primary hover:text-primary hover:bg-primary/10"
          onClick={() => navigate(getActionRoute())}
        >
          {getActionText()}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}