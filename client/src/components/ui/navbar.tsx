import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  Menu,
  AlignJustify,
  X,
  User,
  LogOut,
  BookOpen,
  LayoutDashboard,
  RefreshCw
} from "lucide-react";
import { MenuItem } from "@shared/schema";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  
  // Kullanıcı durumunda değişiklik olduğunda konsola yazdır
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Navbar: Kullanıcı oturum açtı:", user);
    } else if (!isLoading) {
      console.log("Navbar: Kullanıcı oturum açmamış");
    }
  }, [user, isAuthenticated, isLoading]);
  
  // Her sayfaya gittiğimizde kullanıcı bilgisini yeniden yükle
  useEffect(() => {
    if (location !== "/auth") {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  }, [location]);

  // Fetch menu items from API
  const { data: menuItems, isLoading: isMenuLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items", "main"],
    queryFn: async () => {
      const response = await fetch("/api/menu-items?location=main");
      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }
      return response.json();
    }
  });
  
  // Handle scrolling effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Close mobile menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);
  
  const isHomePage = location === "/";
  const useTransparentHeader = !isScrolled && !isMenuOpen && isHomePage;
  
  return (
    <header 
      className={`w-full z-50 transition-all duration-300 ${
        useTransparentHeader 
          ? "bg-transparent py-4 absolute top-0 left-0 right-0" 
          : "bg-white shadow-md py-2 fixed top-0 left-0 right-0"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className={`text-2xl font-bold ${useTransparentHeader ? "text-white" : "text-primary"}`}>
              EduConnect
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {menuItems && menuItems.map((item) => (
              <Link 
                key={item.id} 
                href={item.url} 
                className={`px-4 py-2 rounded-md transition-colors ${
                  useTransparentHeader 
                    ? "text-white hover:bg-white/10" 
                    : "text-neutral-700 hover:bg-neutral-100"
                } ${location === item.url ? "font-medium" : ""}`}
              >
                {item.title}
              </Link>
            ))}
            
            {!menuItems && !isMenuLoading && (
              <>
                <Link href="/find-teachers" className={`px-4 py-2 rounded-md transition-colors ${
                    useTransparentHeader 
                      ? "text-white hover:bg-white/10" 
                      : "text-neutral-700 hover:bg-neutral-100"
                  } ${location === "/find-teachers" ? "font-medium" : ""}`}>
                    Find Teachers
                </Link>
                
                <Link href="/#subjects" className={`px-4 py-2 rounded-md transition-colors ${
                    useTransparentHeader 
                      ? "text-white hover:bg-white/10" 
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}>
                    Subjects
                </Link>
                
                <Link href="/#how-it-works" className={`px-4 py-2 rounded-md transition-colors ${
                    useTransparentHeader 
                      ? "text-white hover:bg-white/10" 
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}>
                    How It Works
                </Link>
              </>
            )}
            
            {isAuthenticated && !isLoading ? (
              <>
                <Link href={user?.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard"} 
                  className={`px-4 py-2 rounded-md transition-colors ${
                    useTransparentHeader 
                      ? "text-white hover:bg-white/10" 
                      : "text-neutral-700 hover:bg-neutral-100"
                  } ${location.includes("dashboard") ? "font-medium" : ""}`}>
                    Dashboard
                </Link>
                
                <div className="relative ml-2 group">
                  <Button 
                    variant={useTransparentHeader ? "outline" : "default"}
                    className={useTransparentHeader ? "border-white text-white hover:bg-white/10" : ""}
                    size="sm"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {user?.firstName || "Account"}
                  </Button>
                  
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white hidden group-hover:block">
                    <div className="px-4 py-2 text-sm text-neutral-500 border-b">
                      Signed in as <span className="font-medium text-neutral-900">{user?.email}</span>
                    </div>
                    <Link href={user?.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard"} 
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
                        <LayoutDashboard className="h-4 w-4 inline-block mr-2" />
                        Dashboard
                    </Link>
                    {user?.role === "teacher" && (
                      <Link href="/create-exam" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
                        <BookOpen className="h-4 w-4 inline-block mr-2" />
                        Create Exam
                      </Link>
                    )}
                    <Link 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = "/api/logout";
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-100"
                    >
                      <LogOut className="h-4 w-4 inline-block mr-2" />
                      Sign Out
                    </Link>
                  </div>
                </div>
              </>
            ) : !isLoading ? (
              <Button
                onClick={() => navigate("/auth")}
                className={useTransparentHeader 
                  ? "bg-white text-primary hover:bg-white/90 border-white" 
                  : "bg-primary text-white hover:bg-primary/90"}
              >
                Sign In
              </Button>
            ) : null}
          </nav>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className={`h-6 w-6 ${
                useTransparentHeader ? "text-white" : "text-neutral-700"
              }`} />
            ) : (
              <AlignJustify className={`h-6 w-6 ${
                useTransparentHeader ? "text-white" : "text-neutral-700"
              }`} />
            )}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pt-4 pb-4 border-t mt-4">
            <div className="space-y-2">
              {menuItems && menuItems.map((item) => (
                <Link 
                  key={item.id} 
                  href={item.url} 
                  className="block px-4 py-2 rounded-md text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  {item.title}
                </Link>
              ))}
              
              {!menuItems && !isMenuLoading && (
                <>
                  <Link href="/find-teachers" className="block px-4 py-2 rounded-md text-neutral-700 hover:bg-neutral-100 transition-colors">
                    Find Teachers
                  </Link>
                  
                  <Link href="/#subjects" className="block px-4 py-2 rounded-md text-neutral-700 hover:bg-neutral-100 transition-colors">
                    Subjects
                  </Link>
                  
                  <Link href="/#how-it-works" className="block px-4 py-2 rounded-md text-neutral-700 hover:bg-neutral-100 transition-colors">
                    How It Works
                  </Link>
                </>
              )}
              
              {isAuthenticated && !isLoading ? (
                <>
                  <Link href={user?.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard"} className="block px-4 py-2 rounded-md text-neutral-700 hover:bg-neutral-100 transition-colors">
                    Dashboard
                  </Link>
                  
                  <div className="border-t my-2"></div>
                  
                  <div className="px-4 py-2 text-sm text-neutral-500">
                    Signed in as <span className="font-medium text-neutral-900">{user?.email}</span>
                  </div>
                  
                  {user?.role === "teacher" && (
                    <Link href="/create-exam">
                      <a className="block px-4 py-2 rounded-md text-neutral-700 hover:bg-neutral-100 transition-colors">
                        <BookOpen className="h-4 w-4 inline-block mr-2" />
                        Create Exam
                      </a>
                    </Link>
                  )}
                  
                  <a 
                    href="/api/logout" 
                    className="block px-4 py-2 rounded-md text-red-600 hover:bg-neutral-100 transition-colors"
                  >
                    <LogOut className="h-4 w-4 inline-block mr-2" />
                    Sign Out
                  </a>
                </>
              ) : !isLoading ? (
                <div className="pt-2">
                  <Button
                    className="w-full"
                    onClick={() => navigate("/auth")}
                  >
                    Sign In
                  </Button>
                </div>
              ) : null}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}