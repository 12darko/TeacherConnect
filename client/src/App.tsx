import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

// Pages
import Home from "@/pages/Home";
import StudentDashboard from "@/pages/StudentDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import FindTeachers from "@/pages/FindTeachers";
import TeacherProfile from "@/pages/TeacherProfile";
import CreateExam from "@/pages/CreateExam";
import TakeExam from "@/pages/TakeExam";
import ClassRoom from "@/pages/ClassRoom";
import NotFound from "@/pages/not-found";

// Navigation
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Navbar />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/student-dashboard" component={StudentDashboard} />
          <Route path="/teacher-dashboard" component={TeacherDashboard} />
          <Route path="/find-teachers" component={FindTeachers} />
          <Route path="/teacher/:id" component={TeacherProfile} />
          <Route path="/create-exam" component={CreateExam} />
          <Route path="/exam/:id" component={TakeExam} />
          <Route path="/classroom/:id" component={ClassRoom} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <Toaster />
    </QueryClientProvider>
  );
}