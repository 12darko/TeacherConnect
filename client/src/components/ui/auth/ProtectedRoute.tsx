import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
};

/**
 * Koruma altına alınmış sayfa bileşeni
 * Sadece giriş yapmış ve yetkilendirilmiş kullanıcılar erişebilir
 */
export function ProtectedRoute({ 
  children, 
  allowedRoles = ["student", "teacher", "admin"], 
  redirectTo = "/auth"
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  // Yükleniyor ekranı
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Yetkilendirme kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Giriş yapılmamışsa yönlendir
  if (!isAuthenticated) {
    return <Redirect to={redirectTo} />;
  }

  // Rol kontrolü
  const hasRequiredRole = allowedRoles.includes(user?.role || "");
  
  if (!hasRequiredRole) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <h2 className="mb-2 text-2xl font-bold">Erişim Reddedildi</h2>
        <p className="mb-6 text-muted-foreground">Bu sayfayı görüntülemek için gerekli yetkiye sahip değilsiniz.</p>
        <Redirect to="/" />
      </div>
    );
  }

  // Yetkilendirme başarılı, içeriği göster
  return <>{children}</>;
}