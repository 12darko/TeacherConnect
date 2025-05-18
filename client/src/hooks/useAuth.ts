import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  const isStudent = !!user && user.role === 'student';
  const isTeacher = !!user && user.role === 'teacher';
  const isAdmin = !!user && user.role === 'admin';

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isStudent,
    isTeacher,
    isAdmin,
    error
  };
}