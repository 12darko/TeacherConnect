import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { FcGoogle } from "react-icons/fc";
import { SiFacebook, SiApple } from "react-icons/si";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Registration form schema
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["student", "teacher"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface AuthProps {
  mode?: "login" | "register";
}

export default function Auth({ mode = "login" }: AuthProps) {
  const [, setLocation] = useLocation();
  const { isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>(mode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "student"
    }
  });

  // Handle login submission
  async function onLoginSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/auth/login', data);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "You have been logged in successfully!",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        
        if (result.user.role === 'student') {
          setLocation('/student-dashboard');
        } else if (result.user.role === 'teacher') {
          setLocation('/teacher-dashboard');
        } else if (result.user.role === 'admin') {
          setLocation('/admin-dashboard');
        } else {
          setLocation('/');
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Login failed. Please check your credentials.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle registration submission
  async function onRegisterSubmit(data: RegisterFormValues) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/auth/register', data);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Registration successful",
          description: "Your account has been created. You can now login!",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        setActiveTab("login");
        loginForm.setValue("email", data.email);
      } else {
        toast({
          title: "Registration failed",
          description: result.message || "There was a problem creating your account.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Registration failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle social login
  async function handleSocialLogin(provider: string) {
    try {
      if (provider === 'replit') {
        window.location.href = '/api/login'; // Use Replit Auth
      } else {
        window.location.href = `/api/auth/${provider}`;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to sign in with ${provider}. Please try again.`,
        variant: "destructive"
      });
    }
  }

  // If the user is already authenticated, redirect them
  if (isAuthenticated) {
    return null; // Redirection will be handled by the AuthRoute component
  }

  return (
    <div className="container max-w-md mx-auto py-10 px-4 sm:px-6">
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-heading font-semibold text-center">
            Welcome to EduConnect
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to access our platform for online teaching and learning
          </CardDescription>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <CardContent className="pt-4">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
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
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mb-3 flex items-center justify-center gap-2"
                onClick={() => handleSocialLogin('replit')}
              >
                <div className="h-5 w-5 flex items-center justify-center font-bold text-blue-600">R</div>
                <span>Login with Replit</span>
              </Button>
              
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center"
                  onClick={() => handleSocialLogin('google')}
                >
                  <FcGoogle className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center"
                  onClick={() => handleSocialLogin('facebook')}
                >
                  <SiFacebook className="h-5 w-5 text-blue-600" />
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center"
                  onClick={() => handleSocialLogin('apple')}
                >
                  <SiApple className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4">
            <CardContent className="pt-4">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
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
                            <Input placeholder="Last name" {...field} />
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
                          <Input placeholder="your.email@example.com" {...field} />
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
                          <Input type="password" placeholder="••••••••" {...field} />
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
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>I want to register as a:</FormLabel>
                        <FormControl>
                          <div className="flex space-x-4">
                            <Button
                              type="button"
                              variant={field.value === "student" ? "default" : "outline"}
                              onClick={() => field.onChange("student")}
                              className="flex-1"
                            >
                              Student
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === "teacher" ? "default" : "outline"}
                              onClick={() => field.onChange("teacher")}
                              className="flex-1"
                            >
                              Teacher
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or register with</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center"
                  onClick={() => handleSocialLogin('google')}
                >
                  <FcGoogle className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center"
                  onClick={() => handleSocialLogin('facebook')}
                >
                  <SiFacebook className="h-5 w-5 text-blue-600" />
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center"
                  onClick={() => handleSocialLogin('apple')}
                >
                  <SiApple className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            Return to home page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
