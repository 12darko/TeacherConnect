import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

type CountdownProps = {
  targetDate?: Date;
  title?: string;
  description?: string;
};

export function CountdownTimer({
  targetDate,
  title = "Sonraki Dersiniz",
  description = "Ders başlayana kadar kalan süre"
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const [hasTarget, setHasTarget] = useState<boolean>(false);
  
  useEffect(() => {
    // If no target date provided, use demo data (1 hour from now)
    const target = targetDate || new Date(new Date().getTime() + 60 * 60 * 1000);
    setHasTarget(true);
    
    const interval = setInterval(() => {
      const now = new Date();
      const difference = target.getTime() - now.getTime();
      
      if (difference <= 0) {
        clearInterval(interval);
        setHasTarget(false);
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [targetDate]);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {hasTarget ? (
          <>
            <div className="text-2xl font-bold">
              {timeLeft.hours.toString().padStart(2, '0')}:
              {timeLeft.minutes.toString().padStart(2, '0')}:
              {timeLeft.seconds.toString().padStart(2, '0')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
            {timeLeft.days > 0 && (
              <div className="mt-2 text-xs font-semibold text-primary">
                +{timeLeft.days} gün
              </div>
            )}
          </>
        ) : (
          <div className="text-xl font-bold text-muted-foreground">
            Yaklaşan ders yok
          </div>
        )}
      </CardContent>
    </Card>
  );
}