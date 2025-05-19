import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import React, { useEffect, Suspense } from "react";

// Pages
import Home from "@/pages/Home";
import StudentDashboard from "@/pages/StudentDashboard";
import ImprovedStudentDashboard from "@/pages/ImprovedStudentDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import FindTeachers from "@/pages/FindTeachers";
import TeacherProfile from "@/pages/TeacherProfile";
import CreateExam from "@/pages/CreateExam";
import TakeExam from "@/pages/TakeExam";
import ClassRoom from "@/pages/ClassRoom";
import Pricing from "@/pages/Pricing";
import AITutor from "@/pages/AITutor";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/Auth";
import SubjectsPage from "@/pages/SubjectsPage";

// Navigation
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

// Auth
import { ProtectedRoute } from "@/components/ui/auth/ProtectedRoute";

// Analytics
import { initGA } from "@/lib/analytics";
import { useAnalytics } from "@/hooks/useAnalytics";

// Lazy-loaded components
const AboutPage = React.lazy(() => import('@/pages/About'));
const PrivacyPage = React.lazy(() => import('@/pages/Privacy'));
const TermsPage = React.lazy(() => import('@/pages/Terms'));
const ContactPage = React.lazy(() => import('@/pages/Contact'));

function Router() {
  // Sayfa değişimlerini izle
  useAnalytics();
  
  return (
    <Switch>
      {/* Herkese açık sayfalar */}
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/subjects" component={SubjectsPage} />
      <Route path="/about">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
          <AboutPage />
        </Suspense>
      </Route>
      <Route path="/privacy">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
          <PrivacyPage />
        </Suspense>
      </Route>
      <Route path="/terms">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
          <TermsPage />
        </Suspense>
      </Route>
      <Route path="/contact">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
          <ContactPage />
        </Suspense>
      </Route>
      
      {/* Öğrenci sayfaları */}
      <Route path="/student-dashboard">
        <ProtectedRoute allowedRoles={["student", "admin"]}>
          <ImprovedStudentDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/find-teachers">
        <ProtectedRoute allowedRoles={["student", "admin"]}>
          <FindTeachers />
        </ProtectedRoute>
      </Route>
      
      <Route path="/teacher/:id">
        <ProtectedRoute allowedRoles={["student", "teacher", "admin"]}>
          <TeacherProfile />
        </ProtectedRoute>
      </Route>
      
      <Route path="/exam/:id">
        <ProtectedRoute allowedRoles={["student", "admin"]}>
          <TakeExam />
        </ProtectedRoute>
      </Route>
      
      <Route path="/ai-tutor">
        <ProtectedRoute allowedRoles={["student", "admin"]}>
          <AITutor />
        </ProtectedRoute>
      </Route>
      
      {/* Öğretmen sayfaları */}
      <Route path="/teacher-dashboard">
        <ProtectedRoute allowedRoles={["teacher", "admin"]}>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/create-exam">
        <ProtectedRoute allowedRoles={["teacher", "admin"]}>
          <CreateExam />
        </ProtectedRoute>
      </Route>
      
      {/* Ortak sayfalar */}
      <Route path="/classroom/:id">
        <ProtectedRoute allowedRoles={["student", "teacher", "admin"]}>
          <ClassRoom />
        </ProtectedRoute>
      </Route>
      
      {/* Admin sayfaları */}
      <Route path="/admin-dashboard">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* 404 sayfası */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  // Google Analytics başlatma
  useEffect(() => {
    // Gerekli ortam değişkeni varsa Google Analytics'i başlat
    if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Navbar />
      <main>
        <Router />
      </main>
      <Footer />
      <Toaster />
    </QueryClientProvider>
  );
}