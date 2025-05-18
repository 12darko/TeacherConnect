import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import FindTeachers from "@/pages/FindTeachers";
import TeacherProfile from "@/pages/TeacherProfile";
import StudentDashboard from "@/pages/StudentDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import ClassRoom from "@/pages/ClassRoom";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/not-found";
import { useAuth } from "./hooks/useAuth";

// Protected route component that redirects to login if not authenticated
function ProtectedRoute({ component: Component, requiredRole, ...rest }: any) {
  const { user, isLoading, isAuthenticated, isAdmin, isTeacher, isStudent } = useAuth();
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  if (requiredRole === 'admin' && !isAdmin) {
    return <Redirect to="/" />;
  }
  
  if (requiredRole === 'teacher' && !isTeacher) {
    return <Redirect to="/" />;
  }

  if (requiredRole === 'student' && !isStudent) {
    return <Redirect to="/" />;
  }
  
  return <Component {...rest} />;
}

// Auth route component that redirects to appropriate dashboard if already authenticated
function AuthRoute({ component: Component, ...rest }: any) {
  const { user, isLoading, isAuthenticated, isTeacher, isAdmin } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Skeleton className="h-64 w-96 rounded-lg" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    if (isAdmin) {
      return <Redirect to="/admin-dashboard" />;
    }
    if (isTeacher) {
      return <Redirect to="/teacher-dashboard" />;
    }
    return <Redirect to="/student-dashboard" />;
  }
  
  return <Component {...rest} />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/find-teachers" component={FindTeachers} />
        <Route path="/teacher/:id" component={TeacherProfile} />
        
        {/* Protected routes that require authentication */}
        <Route path="/student-dashboard">
          <ProtectedRoute component={StudentDashboard} requiredRole="student" />
        </Route>
        
        <Route path="/teacher-dashboard">
          <ProtectedRoute component={TeacherDashboard} requiredRole="teacher" />
        </Route>
        
        <Route path="/classroom/:id">
          {(params) => <ProtectedRoute component={ClassRoom} params={params} />}
        </Route>
        
        {/* Auth routes redirect if already logged in */}
        <Route path="/login">
          <AuthRoute component={() => <Auth mode="login" />} />
        </Route>
        
        <Route path="/register">
          <AuthRoute component={() => <Auth mode="register" />} />
        </Route>
        
        <Route path="/auth">
          <AuthRoute component={() => <Auth />} />
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
