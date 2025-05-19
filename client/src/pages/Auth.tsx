import { useState, useEffect } from "react";
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
import { Facebook, Apple, UserCircle, Lock, Mail, School, User, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Oturum açıksa ilgili sayfaya yönlendir
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Kullanıcı zaten oturum açmış, yönlendiriliyor...", user);
      if (user.role === "student") {
        navigate("/student-dashboard");
      } else if (user.role === "teacher") {
        navigate("/teacher-dashboard");
      } else if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/");
      }
    }
  }, [isAuthenticated, user, navigate]);
  const { toast } = useToast();

  // Use zod validation for forms
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

  // API mutations
  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      try {
        console.log("Sending login request:", data);
        
        // İstek gövdesi doğru formatta olduğundan emin oluyoruz
        const requestBody = {
          email: data.email.trim(), // Boşlukları temizliyoruz
          password: data.password
        };
        
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody),
          credentials: "include"
        });
        
        // JSON yanıtını analiz etmeye çalışıyoruz
        let errorMessage = "An error occurred during login";
        let responseData;
        
        try {
          const responseText = await response.text();
          if (responseText) {
            try {
              responseData = JSON.parse(responseText);
              if (responseData.message) {
                errorMessage = responseData.message;
              }
            } catch (parseError) {
              // JSON ayrıştırma hatası - metin yanıtını olduğu gibi kullanacağız
              errorMessage = responseText;
            }
          }
        } catch (readError) {
          console.error("Failed to read response:", readError);
        }
        
        // Yanıt başarılı değilse hata atıyoruz
        if (!response.ok) {
          console.error("Login error - status:", response.status, "message:", errorMessage);
          throw new Error(errorMessage);
        }
        
        console.log("Login response:", responseData);
        return responseData;
      } catch (error) {
        console.error("Login failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Login successful",
        description: "Welcome! Redirecting you to the dashboard.",
      });
      
      // Redirect based on user role - Immediate navigation
      const role = data.user?.role;
      console.log("Redirecting user with role:", role);
      
      if (role === "student") {
        navigate("/student-dashboard");
      } else if (role === "teacher") {
        navigate("/teacher-dashboard");
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/"); // Redirect to home page if no role is found
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password. Please check your login details.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof registerSchema>) => {
      try {
        console.log("Sending registration request:", data);
        // Düzeltilmiş API yolu ve istek formatı
        const requestBody = {
          email: data.email.trim(),
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role
        };
        
        console.log("Sending registration request with body:", { ...requestBody, password: "***" });
        
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody),
          credentials: "include"
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "An error occurred during registration");
        }
        
        const responseData = await response.json();
        console.log("Registration response:", responseData);
        return responseData;
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Registration successful",
        description: "Your account has been created. You can now log in.",
      });
      setTab("login");
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Please check your registration details.",
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

  // Different login options
  
  const handleGoogleAuth = () => {
    // Google OAuth API request will be sent
    // Will connect to the real API when the endpoint is ready on the backend
    alert("Google login is currently being prepared.");
  };
  
  const handleFacebookAuth = () => {
    // Facebook OAuth API request will be sent
    alert("Facebook login is currently being prepared.");
  };
  
  const handleAppleAuth = () => {
    // Apple OAuth API request will be sent
    alert("Apple login is currently being prepared.");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {tab === "login" ? "Sign in to EduConnect" : "Register for EduConnect"}
          </CardTitle>
          <CardDescription className="text-center">
            {tab === "login" 
              ? "Continue your learning journey by signing into your account" 
              : role === "student" 
                ? "Create a student account to start taking lessons" 
                : "Create a teacher account to start giving lessons"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(value) => setTab(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
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
                        <FormLabel>Password</FormLabel>
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
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
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
                  <span>Student</span>
                </Button>
                <Button
                  type="button"
                  variant={role === "teacher" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-20 space-y-2"
                  onClick={() => setRole("teacher")}
                >
                  <UserCog className="h-6 w-6" />
                  <span>Teacher</span>
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
                          <FormLabel>First Name</FormLabel>
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
                          <FormLabel>Last Name</FormLabel>
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
                        <FormLabel>Password</FormLabel>
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
                        <FormLabel>Confirm Password</FormLabel>
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
                    {registerMutation.isPending ? "Registering..." : "Register"}
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
                Or continue with
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center space-x-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={handleGoogleAuth} 
              size="icon"
              className="rounded-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700 h-12 w-12"
            >
              <svg className="h-6 w-6" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span className="sr-only">Sign {tab === "login" ? "in" : "up"} with Google</span>
            </Button>
            
            <Button 
              variant="outline" 
              type="button" 
              onClick={handleFacebookAuth} 
              size="icon"
              className="rounded-full bg-white hover:bg-gray-50 border-gray-300 text-blue-600 h-12 w-12"
            >
              <Facebook className="h-6 w-6" />
              <span className="sr-only">Sign {tab === "login" ? "in" : "up"} with Facebook</span>
            </Button>
            
            <Button 
              variant="outline" 
              type="button" 
              onClick={handleAppleAuth} 
              size="icon"
              className="rounded-full bg-white hover:bg-gray-50 border-gray-300 text-gray-900 h-12 w-12"
            >
              <Apple className="h-6 w-6" />
              <span className="sr-only">Apple ile {tab === "login" ? "Giriş Yap" : "Kayıt Ol"}</span>
            </Button>
            

          </div>
        </CardFooter>
      </Card>
    </div>
  );
}