import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDays, addHours, format, setHours, setMinutes } from "date-fns";
import { tr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, CreditCard } from "lucide-react";

// Form şeması
const sessionFormSchema = z.object({
  teacherId: z.string().min(1, "Öğretmen seçilmelidir"),
  subjectId: z.string().min(1, "Konu seçilmelidir"),
  date: z.date({
    required_error: "Ders tarihi seçilmelidir",
  }).refine(date => date > new Date(), {
    message: "Ders tarihi bugünden sonra olmalıdır"
  }),
  time: z.string().min(1, "Ders saati seçilmelidir"),
  duration: z.string().min(1, "Ders süresi seçilmelidir"),
  notes: z.string().optional(),
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

type BookSessionFormProps = {
  teacherId?: string;
  teacherName?: string;
  onSuccess?: () => void;
  subjects?: Array<{ id: string; name: string }>;
  availableTimes?: Array<{ day: string; slots: string[] }>;
};

export function BookSessionForm({
  teacherId,
  teacherName,
  onSuccess,
  subjects = [],
  availableTimes = [],
}: BookSessionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Varsayılan kullanılabilir saatler (gerçek uygulamada API'dan gelmeli)
  const defaultAvailableTimes = [
    { day: "Pazartesi", slots: ["09:00", "10:00", "14:00", "15:00", "16:00"] },
    { day: "Salı", slots: ["09:00", "10:00", "11:00", "14:00", "15:00"] },
    { day: "Çarşamba", slots: ["10:00", "11:00", "12:00", "15:00", "16:00"] },
    { day: "Perşembe", slots: ["09:00", "10:00", "11:00", "14:00", "15:00"] },
    { day: "Cuma", slots: ["09:00", "10:00", "14:00", "15:00", "16:00"] },
  ];
  
  const actualAvailableTimes = availableTimes.length > 0 ? availableTimes : defaultAvailableTimes;
  
  // Varsayılan konular (gerçek uygulamada API'dan gelmeli)
  const defaultSubjects = [
    { id: "1", name: "Matematik" },
    { id: "2", name: "Fizik" },
    { id: "3", name: "Kimya" },
    { id: "4", name: "Biyoloji" },
    { id: "5", name: "Tarih" },
  ];
  
  const actualSubjects = subjects.length > 0 ? subjects : defaultSubjects;
  
  // Bir tarih için uygun saatleri döndür
  const getAvailableTimesForDate = (date: Date) => {
    const dayName = format(date, "EEEE", { locale: tr });
    const dayData = actualAvailableTimes.find(item => item.day === dayName);
    return dayData ? dayData.slots : [];
  };
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  
  // Form yapılandırması
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      teacherId: teacherId || "",
      subjectId: "",
      notes: "",
    },
  });
  
  // Tarih seçildiğinde kullanılabilir saatleri güncelle
  const onDateSelect = (date: Date | undefined) => {
    form.setValue("date", date as Date);
    form.setValue("time", ""); // Zaman seçimini sıfırla
    setSelectedDate(date);
    
    if (date) {
      const availableTimes = getAvailableTimesForDate(date);
      setAvailableTimeSlots(availableTimes);
    } else {
      setAvailableTimeSlots([]);
    }
  };
  
  // Form gönderildiğinde
  const onSubmit = async (data: SessionFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Tarih ve saati birleştir
      const [hours, minutes] = data.time.split(':').map(Number);
      const startTime = new Date(data.date);
      startTime.setHours(hours, minutes, 0, 0);
      
      // Süreyi dakika olarak hesapla
      const durationMinutes = parseInt(data.duration, 10);
      
      // Bitiş zamanını hesapla
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);
      
      // Ders verilerini oluştur
      const sessionData = {
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: data.notes || "",
        status: "pending"
      };
      
      // API isteği gönder (gerçek uygulamada eklenmeli)
      // Bu demo için sahte başarılı yanıt dönüyoruz
      console.log("Ders talebi gönderildi:", sessionData);
      
      toast({
        title: "Ders talebi gönderildi",
        description: "Öğretmenin onayı bekleniyor.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Formu sıfırla
      form.reset({
        teacherId: teacherId || "",
        subjectId: "",
        date: undefined,
        time: "",
        duration: "",
        notes: "",
      });
      setSelectedDate(undefined);
      setAvailableTimeSlots([]);
      
    } catch (error) {
      console.error("Ders rezervasyonu yapılırken hata oluştu:", error);
      toast({
        title: "Ders rezervasyonu yapılamadı",
        description: "Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Öğretmen alanı - eğer öğretmen ID'si geçilmemişse göster */}
        {!teacherId && (
          <FormField
            control={form.control}
            name="teacherId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Öğretmen</FormLabel>
                <Select 
                  value={field.value} 
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Öğretmen seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Ayşe Yılmaz</SelectItem>
                    <SelectItem value="2">Mehmet Koç</SelectItem>
                    <SelectItem value="3">Zeynep Demir</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Kimden ders almak istiyorsunuz?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* Konu alanı */}
        <FormField
          control={form.control}
          name="subjectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ders Konusu</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Konu seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {actualSubjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Hangi konuda ders almak istiyorsunuz?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Tarih seçimi */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Ders Tarihi</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isSubmitting}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: tr })
                      ) : (
                        <span>Tarih seçin</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={onDateSelect}
                    disabled={(date) => 
                      date < new Date() || // Bugünden önce
                      date > addDays(new Date(), 30) // 30 günden sonra
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Dersi hangi tarihte almak istiyorsunuz?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Saat seçimi */}
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ders Saati</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
                disabled={isSubmitting || !selectedDate || availableTimeSlots.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedDate 
                        ? "Önce tarih seçin" 
                        : availableTimeSlots.length === 0 
                          ? "Bu tarihte uygun saat yok" 
                          : "Saat seçin"
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableTimeSlots.map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                <Clock className="inline-block w-4 h-4 mr-1" /> 
                Dersin başlangıç saatini seçin
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Süre seçimi */}
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ders Süresi</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Süre seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="30">30 dakika</SelectItem>
                  <SelectItem value="60">1 saat</SelectItem>
                  <SelectItem value="90">1.5 saat</SelectItem>
                  <SelectItem value="120">2 saat</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Dersin ne kadar sürmesini istiyorsunuz?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Notlar */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar (İsteğe Bağlı)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Öğretmeninize iletmek istediğiniz notlar..."
                  className="resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Özel istekleriniz veya odaklanmak istediğiniz konular
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Ücret bilgisi */}
        <div className="p-4 bg-muted/30 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Ders Ücreti:</span>
            <span className="font-bold text-xl">₺250</span>
          </div>
          <p className="text-sm text-muted-foreground flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Ödeme ders onaylandıktan sonra alınacaktır
          </p>
        </div>
        
        {/* Gönder butonu */}
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Gönderiliyor..." : "Ders Talebi Gönder"}
        </Button>
      </form>
    </Form>
  );
}