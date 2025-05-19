import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

/**
 * Hook to check authentication status and get current user
 */
export function useAuth() {
  const { 
    data: user, 
    isLoading, 
    error,
    isError
  } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user");
        
        // 401 veya diğer hatalarda null döndürüyoruz
        if (!response.ok) {
          if (response.status === 401) {
            console.log("User not authenticated");
            return null;
          }
          throw new Error("Failed to fetch user data");
        }
        
        return response.json();
      } catch (error) {
        console.error("Auth error:", error);
        return null;
      }
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "An error occurred during login");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
      // Login sonrası tüm verileri yeniden yüklüyoruz
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "An error occurred during registration");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
      // Kayıt sonrası tüm verileri yeniden yüklüyoruz
      queryClient.invalidateQueries();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Doğru logout endpoint'ini kullanıyoruz
      const response = await fetch("/api/logout", {
        method: "GET", // API GET metodu kullanıyor
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "An error occurred during logout");
      }
      
      // Başarılı logout için boş obje döndürüyoruz
      return {};
    },
    onSuccess: () => {
      // Kullanıcı bilgisini null yapıyoruz
      queryClient.setQueryData(["/api/auth/user"], null);
      
      // Çıkış sonrası tüm verileri yeniden yüklüyoruz
      queryClient.invalidateQueries();
      
      // Ana sayfaya yönlendirme
      window.location.href = "/";
    },
  });

  // isAuthenticated değerini daha güvenli bir şekilde hesaplıyoruz
  const isAuthenticated = !isLoading && !isError && user !== null && user !== undefined;

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    // Kullanıcının rolüne göre yetkilendirme
    isStudent: isAuthenticated && user?.role === "student",
    isTeacher: isAuthenticated && user?.role === "teacher",
    isAdmin: isAuthenticated && user?.role === "admin",
    // Auth mutations
    loginMutation,
    registerMutation,
    logoutMutation,
  };
}