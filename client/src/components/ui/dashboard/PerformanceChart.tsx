import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface PerformanceData {
  date: string;
  score: number;
}

export function PerformanceChart() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  
  // Fetch student stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/student-stats'],
  });
  
  useEffect(() => {
    if (stats?.examScores && Array.isArray(stats.examScores)) {
      // Format data for chart
      const formattedData = stats.examScores.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
        score: item.score
      }));
      setPerformanceData(formattedData);
    } else {
      // Fallback demo data if no stats available
      const lastWeek = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
          score: Math.floor(Math.random() * 30) + 70 // Random score between 70-100
        };
      });
      setPerformanceData(lastWeek);
    }
  }, [stats]);
  
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Haftalık Performans</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={performanceData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Skor']}
                labelFormatter={(label) => `Tarih: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}