import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleCheck, AlertCircle, BookOpen, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

type ExamResultCardProps = {
  examId?: number;
  examTitle?: string;
  score?: number;
  maxScore?: number;
  passThreshold?: number;
  completedAt?: Date;
};

export function ExamResultCard({
  examId,
  examTitle = "Matematik Sınavı",
  score = 85,
  maxScore = 100,
  passThreshold = 70,
  completedAt = new Date()
}: ExamResultCardProps) {
  const [, setLocation] = useLocation();
  const isPassed = score >= passThreshold;
  const percentage = Math.round((score / maxScore) * 100);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Son Sınav Sonucu</CardTitle>
        <BookOpen className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm truncate" title={examTitle}>
              {examTitle}
            </h3>
            <span 
              className={`flex items-center text-sm font-medium ${
                isPassed ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {isPassed ? (
                <CircleCheck className="mr-1 h-4 w-4" />
              ) : (
                <AlertCircle className="mr-1 h-4 w-4" />
              )}
              {isPassed ? 'Başarılı' : 'Başarısız'}
            </span>
          </div>
          
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold">%{percentage}</span>
              <span className="text-sm text-muted-foreground ml-1">
                ({score}/{maxScore})
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(completedAt)}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="ghost" 
          className="w-full justify-between text-primary hover:text-primary hover:bg-primary/10"
          onClick={() => setLocation(examId ? `/exam/${examId}/result` : '/exams')}
        >
          Detayları Gör
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}