import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isStudent = !!user && user.role === 'student';
  const isTeacher = !!user && user.role === 'teacher';
  const isAdmin = !!user && user.role === 'admin';
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      return await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Could not log in with those credentials.",
        variant: "destructive"
      });
    }
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      return await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "Your account has been created!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create your account.",
        variant: "destructive"
      });
    }
  });
  
  // Logout function
  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Could not sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isStudent,
    isTeacher,
    isAdmin,
    error,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    loginIsLoading: loginMutation.isPending,
    registerIsLoading: registerMutation.isPending
  };
}