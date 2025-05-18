import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target } from "lucide-react";
import { useState, useEffect } from "react";

type ProgressCardProps = {
  title?: string;
  value?: number;
  target?: number;
  icon?: "trophy" | "target";
  description?: string;
};

export function ProgressCard({
  title = "İlerleme Durumu",
  value,
  target = 100,
  icon = "trophy",
  description
}: ProgressCardProps) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Calculate percentage
    const percentage = value ? Math.min(Math.round((value / target) * 100), 100) : 0;
    
    // Animate progress
    let start = 0;
    const animateProgress = () => {
      const step = Math.max(1, Math.floor(percentage / 20));
      start += step;
      
      if (start <= percentage) {
        setProgress(start);
        requestAnimationFrame(animateProgress);
      } else {
        setProgress(percentage);
      }
    };
    
    requestAnimationFrame(animateProgress);
  }, [value, target]);
  
  // Generate demo data if no value provided
  const demoValue = value || Math.floor(Math.random() * 80) + 10;
  const actualValue = value || demoValue;
  const actualProgress = progress || Math.round((demoValue / target) * 100);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon === "trophy" ? (
          <Trophy className="h-4 w-4 text-yellow-500" />
        ) : (
          <Target className="h-4 w-4 text-primary" />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold">{actualValue}/{target}</span>
          <span className="text-sm text-muted-foreground font-medium">
            %{actualProgress}
          </span>
        </div>
        <Progress value={actualProgress} className="h-2" />
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}