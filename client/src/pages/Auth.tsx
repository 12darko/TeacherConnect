import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { loginSchema, registerSchema } from "@shared/schema";
import { Google, Facebook, Apple, UserCircle, Lock, Mail, School, User, UserCog } from "lucide-react";

export default function Auth() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Form için zod validation kullan
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "student",
    },
  });

  // API mutasyonları
  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      return await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      toast({
        title: "Giriş başarılı",
        description: "Hoş geldiniz! Panele yönlendiriliyorsunuz.",
      });
      
      // Kullanıcı rolüne göre yönlendirme
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Giriş başarısız",
        description: error.message || "Giriş bilgilerinizi kontrol edin.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof registerSchema>) => {
      return await apiRequest("POST", "/api/auth/register", data);
    },
    onSuccess: () => {
      toast({
        title: "Kayıt başarılı",
        description: "Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.",
      });
      setTab("login");
    },
    onError: (error: any) => {
      toast({
        title: "Kayıt başarısız",
        description: error.message || "Kayıt bilgilerinizi kontrol edin.",
        variant: "destructive",
      });
    },
  });

  const handleLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const handleRegisterSubmit = async (data: z.infer<typeof registerSchema>) => {
    // Role değerini formdan al
    registerMutation.mutate({
      ...data,
      role,
    });
  };

  // Replit OAuth ile giriş
  const handleReplitAuth = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {tab === "login" ? "EduConnect'e Giriş Yap" : "EduConnect'e Kaydol"}
          </CardTitle>
          <CardDescription className="text-center">
            {tab === "login" 
              ? "Hesabınıza giriş yaparak öğrenmeye devam edin" 
              : role === "student" 
                ? "Öğrenci hesabı oluşturarak derslere başlayın" 
                : "Öğretmen hesabı oluşturarak ders vermeye başlayın"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(value) => setTab(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Giriş</TabsTrigger>
              <TabsTrigger value="register">Kayıt</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="email@example.com" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şifre</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="password" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register">
              {/* Rol Seçimi */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button
                  type="button"
                  variant={role === "student" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-20 space-y-2"
                  onClick={() => setRole("student")}
                >
                  <School className="h-6 w-6" />
                  <span>Öğrenci</span>
                </Button>
                <Button
                  type="button"
                  variant={role === "teacher" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-20 space-y-2"
                  onClick={() => setRole("teacher")}
                >
                  <UserCog className="h-6 w-6" />
                  <span>Öğretmen</span>
                </Button>
              </div>
              
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Soyad</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="email@example.com" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şifre</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="password" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şifre Tekrar</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="password" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Kayıt yapılıyor..." : "Kayıt Ol"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="relative my-2 w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Veya şununla devam et
              </span>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 gap-2">
            <Button variant="outline" type="button" onClick={handleReplitAuth} className="w-full">
              <UserCircle className="mr-2 h-4 w-4" />
              Replit ile {tab === "login" ? "Giriş Yap" : "Kayıt Ol"}
            </Button>
            
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" type="button" className="w-full">
                <Google className="h-4 w-4" />
              </Button>
              <Button variant="outline" type="button" className="w-full">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" type="button" className="w-full">
                <Apple className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}