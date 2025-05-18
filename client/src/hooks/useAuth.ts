import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

/**
 * Hook to check authentication status and get current user
 */
export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    // Kullanıcının rolüne göre yetkilendirme
    isStudent: user?.role === "student",
    isTeacher: user?.role === "teacher",
    isAdmin: user?.role === "admin",
  };
}