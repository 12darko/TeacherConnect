import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BellIcon, ChevronDownIcon, HomeIcon, NotebookIcon, SearchIcon, CalendarIcon, LogOutIcon, UserIcon, SettingsIcon } from "lucide-react";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location === path;
  };

  // Handle sign in/out actions
  const handleSignIn = () => {
    window.location.href = "/auth";
  };

  const handleSignOut = () => {
    window.location.href = "/api/logout";
  };

  const userInitials = user?.firstName 
    ? `${user.firstName.charAt(0)}${user.lastName ? user.lastName.charAt(0) : ''}` 
    : user?.email?.charAt(0) || 'U';

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and site name */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="material-icons text-primary text-3xl">school</span>
              <span className="ml-2 text-xl font-heading font-semibold text-neutral-dark">EduConnect</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <Link href="/" className={`
                ${isActive('/') ? 'border-b-2 border-primary text-primary' : 'border-b-2 border-transparent hover:border-primary hover:text-primary text-neutral-medium'}
                px-1 pb-2 inline-flex items-center text-sm font-medium
              `}>
                <HomeIcon className="h-4 w-4 mr-1" />
                Home
              </Link>
              
              <Link href="/find-teachers" className={`
                ${isActive('/find-teachers') ? 'border-b-2 border-primary text-primary' : 'border-b-2 border-transparent hover:border-primary hover:text-primary text-neutral-medium'}
                px-1 pb-2 inline-flex items-center text-sm font-medium
              `}>
                <SearchIcon className="h-4 w-4 mr-1" />
                Find Teachers
              </Link>
              
              {isAuthenticated && user?.role === 'student' && (
                <Link href="/student-dashboard" className={`
                  ${isActive('/student-dashboard') ? 'border-b-2 border-primary text-primary' : 'border-b-2 border-transparent hover:border-primary hover:text-primary text-neutral-medium'}
                  px-1 pb-2 inline-flex items-center text-sm font-medium
                `}>
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  My Classes
                </Link>
              )}

              {isAuthenticated && user?.role === 'teacher' && (
                <Link href="/teacher-dashboard" className={`
                  ${isActive('/teacher-dashboard') ? 'border-b-2 border-primary text-primary' : 'border-b-2 border-transparent hover:border-primary hover:text-primary text-neutral-medium'}
                  px-1 pb-2 inline-flex items-center text-sm font-medium
                `}>
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  My Classes
                </Link>
              )}

              {isAuthenticated && user && (
                <Link href={user.role === 'student' ? '/student-dashboard?tab=assignments' : '/teacher-dashboard?tab=exams'} className={`
                  ${(isActive('/student-dashboard?tab=assignments') || isActive('/teacher-dashboard?tab=exams')) ? 'border-b-2 border-primary text-primary' : 'border-b-2 border-transparent hover:border-primary hover:text-primary text-neutral-medium'}
                  px-1 pb-2 inline-flex items-center text-sm font-medium
                `}>
                  <NotebookIcon className="h-4 w-4 mr-1" />
                  Assignments
                </Link>
              )}
            </nav>
          </div>

          {/* User Menu and Mobile menu button */}
          <div className="flex items-center">
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-neutral-lightest animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <>
                <Button variant="ghost" size="icon" className="mr-2">
                  <BellIcon className="h-5 w-5 text-neutral-medium hover:text-primary" />
                </Button>

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white mr-2">
                        {userInitials}
                      </div>
                      <span className="hidden md:block text-sm font-medium text-neutral-dark">
                        {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}
                      </span>
                      <ChevronDownIcon className="h-4 w-4 ml-1 text-neutral-medium" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href={user.role === 'teacher' ? '/teacher-profile' : '/student-profile'} className="flex items-center w-full">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center w-full">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <button onClick={handleSignOut} className="flex items-center w-full text-left">
                        <LogOutIcon className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={handleSignIn}>
                  Sign in
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">
                {mobileMenuOpen ? 'Close menu' : 'Open menu'}
              </span>
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
                  <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/" className={`
              ${isActive('/') ? 'bg-primary text-white' : 'text-neutral-dark hover:bg-neutral-lightest'}
              block pl-3 pr-4 py-2 text-base font-medium
            `}>
              Home
            </Link>
            <Link href="/find-teachers" className={`
              ${isActive('/find-teachers') ? 'bg-primary text-white' : 'text-neutral-dark hover:bg-neutral-lightest'}
              block pl-3 pr-4 py-2 text-base font-medium
            `}>
              Find Teachers
            </Link>
            
            {isAuthenticated && user?.role === 'student' && (
              <Link href="/student-dashboard" className={`
                ${isActive('/student-dashboard') ? 'bg-primary text-white' : 'text-neutral-dark hover:bg-neutral-lightest'}
                block pl-3 pr-4 py-2 text-base font-medium
              `}>
                My Classes
              </Link>
            )}

            {isAuthenticated && user?.role === 'teacher' && (
              <Link href="/teacher-dashboard" className={`
                ${isActive('/teacher-dashboard') ? 'bg-primary text-white' : 'text-neutral-dark hover:bg-neutral-lightest'}
                block pl-3 pr-4 py-2 text-base font-medium
              `}>
                My Classes
              </Link>
            )}

            {isAuthenticated && user && (
              <Link href={user.role === 'student' ? '/student-dashboard?tab=assignments' : '/teacher-dashboard?tab=exams'} className={`
                ${(isActive('/student-dashboard?tab=assignments') || isActive('/teacher-dashboard?tab=exams')) ? 'bg-primary text-white' : 'text-neutral-dark hover:bg-neutral-lightest'}
                block pl-3 pr-4 py-2 text-base font-medium
              `}>
                Assignments
              </Link>
            )}

            {!isAuthenticated && (
              <Button
                onClick={handleSignIn}
                className="w-full text-left justify-start text-neutral-dark hover:bg-neutral-lightest block pl-3 pr-4 py-2 text-base font-medium"
                variant="ghost"
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}