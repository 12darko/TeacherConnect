import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

type SessionEvent = {
  id: number;
  date: Date;
  startTime: string;
  endTime: string;
  title: string;
  subject: string;
  teacher: string;
  type: "scheduled" | "completed" | "cancelled";
};

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: SessionEvent[];
};

export function ScheduleCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedEvents, setSelectedEvents] = useState<SessionEvent[]>([]);
  
  const { user } = useAuth();
  const userId = user?.id;
  
  // Fetch session data
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: [`/api/sessions?userId=${userId}`],
    enabled: !!userId,
  });
  
  // Format sessions as calendar events
  const events: SessionEvent[] = sessions.map((session: any) => ({
    id: session.id,
    date: new Date(session.startTime),
    startTime: new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    endTime: new Date(session.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    title: session.title || `${session.subjectName} Dersi`,
    subject: session.subjectName,
    teacher: session.teacherName,
    type: session.status
  }));
  
  // Demo events for preview
  const demoEvents: SessionEvent[] = [
    {
      id: 1,
      date: new Date(),
      startTime: "14:00",
      endTime: "15:30",
      title: "Matematik Dersi",
      subject: "Matematik",
      teacher: "Ayşe Yılmaz",
      type: "scheduled"
    },
    {
      id: 2,
      date: new Date(new Date().setDate(new Date().getDate() + 2)),
      startTime: "10:00",
      endTime: "11:30",
      title: "Fizik Dersi",
      subject: "Fizik",
      teacher: "Mehmet Kaya",
      type: "scheduled"
    },
    {
      id: 3,
      date: new Date(new Date().setDate(new Date().getDate() - 1)),
      startTime: "16:00",
      endTime: "17:00",
      title: "İngilizce Pratik",
      subject: "İngilizce",
      teacher: "Sarah Johnson",
      type: "completed"
    }
  ];
  
  // Use real events if available, otherwise use demo events
  const calendarEvents = events.length > 0 ? events : demoEvents;
  
  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    
    if (date) {
      // Find events for the selected date
      const dayEvents = calendarEvents.filter(event => 
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
      );
      
      setSelectedEvents(dayEvents);
    } else {
      setSelectedEvents([]);
    }
  };
  
  // Custom renderer for calendar days
  const dayRenderer = (day: CalendarDay, index: number) => {
    // Count events for this day
    const dayEvents = calendarEvents.filter(event => 
      event.date.getDate() === day.date.getDate() &&
      event.date.getMonth() === day.date.getMonth() &&
      event.date.getFullYear() === day.date.getFullYear()
    );
    
    // Return default day with event indicator if there are events
    return (
      <div className="relative">
        <div>{day.date.getDate()}</div>
        {dayEvents.length > 0 && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <Badge variant="outline" className="h-1.5 w-1.5 p-0 rounded-full bg-primary" />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Ders Takvimi</CardTitle>
        <CardDescription>Derslerinizi ve etkinliklerinizi planlayın</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="p-4 border-r border-b md:border-b-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border w-full"
              components={{
                Day: dayRenderer
              }}
            />
          </div>
          <div className="p-4">
            <h3 className="font-medium text-lg mb-4">
              {selectedDate ? selectedDate.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }) : 'Seçilen Tarih'}
            </h3>
            
            {selectedEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className={`p-3 rounded-md border ${
                      event.type === 'completed' ? 'bg-green-50 border-green-100' : 
                      event.type === 'cancelled' ? 'bg-red-50 border-red-100' : 
                      'bg-blue-50 border-blue-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{event.title}</h4>
                      <Badge variant={
                        event.type === 'completed' ? 'success' : 
                        event.type === 'cancelled' ? 'destructive' : 
                        'secondary'
                      }>
                        {event.type === 'completed' ? 'Tamamlandı' : 
                         event.type === 'cancelled' ? 'İptal Edildi' : 
                         'Planlandı'}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="mr-2 h-3.5 w-3.5" />
                        <span>{event.startTime} - {event.endTime}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <BookOpen className="mr-2 h-3.5 w-3.5" />
                        <span>{event.subject}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Users className="mr-2 h-3.5 w-3.5" />
                        <span>{event.teacher}</span>
                      </div>
                      
                      {event.type === 'scheduled' && (
                        <Button 
                          size="sm"
                          variant="default"
                          className="w-full mt-2"
                          onClick={() => {
                            if (event.id) {
                              navigate(`/classroom/${event.id}`);
                            }
                          }}
                        >
                          Derse Katıl
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Bu tarih için planlanmış ders bulunmuyor
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate("/find-teachers")}
                >
                  Ders Planla
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate("/find-teachers")}>
          Yeni Ders Planla
        </Button>
        <Button variant="ghost" onClick={() => navigate("/sessions")}>
          Tüm Dersleri Görüntüle
        </Button>
      </CardFooter>
    </Card>
  );
}