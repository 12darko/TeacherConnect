import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AuthProps {
  mode?: "login" | "register";
}

export default function Auth({ mode = "login" }: AuthProps) {
  const [, setLocation] = useLocation();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSignIn = () => {
    login();
  };

  return (
    <div className="container max-w-md mx-auto py-10 px-4 sm:px-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-heading font-semibold text-center">
            Welcome to EduConnect
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to access our platform for online teaching and learning
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 pt-4">
          <p className="text-center text-muted-foreground">
            EduConnect uses Replit for secure authentication. Click the button below to sign in or create an account.
          </p>
          
          <Button 
            onClick={handleSignIn}
            className="w-full max-w-xs"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in with Replit"}
          </Button>
          
          <div className="text-sm text-center text-muted-foreground mt-4">
            <p>New users will be registered automatically.</p>
            <p className="mt-2">Teachers and administrators will need<br />to request role elevation after registration.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            Return to home page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
