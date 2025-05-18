import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PricingPlan } from "@/components/ui/pricing-plan";
import { PaymentForm } from "@/components/ui/payment-form";
import { useAuth } from "@/hooks/useAuth";

// Plans data structure
interface Plan {
  id: string;
  title: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "basic",
    title: "Basic",
    description: "Perfect for students who need occasional help",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      "Access to 10 sessions per month",
      "Unlimited messaging with teachers",
      "Take up to 5 exams per month",
      "Standard support"
    ]
  },
  {
    id: "pro",
    title: "Professional",
    description: "Ideal for regular learners and intensive study",
    monthlyPrice: 79,
    yearlyPrice: 790,
    features: [
      "Access to 30 sessions per month",
      "Unlimited messaging with teachers",
      "Unlimited exams",
      "Priority support",
      "Study materials library access"
    ],
    popular: true
  },
  {
    id: "unlimited",
    title: "Unlimited",
    description: "For serious students who need constant access",
    monthlyPrice: 149,
    yearlyPrice: 1490,
    features: [
      "Unlimited sessions",
      "Unlimited messaging with teachers",
      "Unlimited exams",
      "Premium support 24/7",
      "Complete study materials library",
      "Personalized learning plan",
      "Progress analytics"
    ]
  }
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      window.location.href = "/api/login";
      return;
    }
    
    setIsPaymentModalOpen(true);
  };
  
  const getPlanPrice = (plan: Plan) => {
    return billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  };
  
  const handlePaymentComplete = (success: boolean) => {
    if (success) {
      console.log("Payment successful!");
      // In a real app, you would update the user's subscription status
      setTimeout(() => {
        setIsPaymentModalOpen(false);
      }, 3000);
    }
  };
  
  const discount = 20; // 20% yearly discount
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-neutral-600 max-w-2xl mx-auto">
          Select the perfect plan for your learning needs. Get unlimited access to our platform's features and expert teachers.
        </p>
      </div>
      
      <div className="flex justify-center mb-8">
        <Tabs
          defaultValue="monthly"
          value={billingCycle}
          onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}
          className="w-fit"
        >
          <TabsList className="grid w-64 grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly 
              <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600">
                Save {discount}%
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <PricingPlan
            key={plan.id}
            title={plan.title}
            price={getPlanPrice(plan)}
            description={plan.description}
            features={plan.features}
            popular={plan.popular}
            cycle={billingCycle}
            buttonText={isAuthenticated ? "Select Plan" : "Sign In & Select"}
            onSelect={() => handleSelectPlan(plan)}
          />
        ))}
      </div>
      
      <div className="mt-16 text-center p-8 rounded-lg bg-neutral-50">
        <h2 className="text-2xl font-bold mb-4">Looking for team or school pricing?</h2>
        <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
          We offer special rates for educational institutions and teams of teachers and students.
          Get in touch with us to learn more about our custom plans.
        </p>
        <Button size="lg" variant="outline">Contact for Custom Plans</Button>
      </div>
      
      <div className="mt-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I change my plan later?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Yes, you can upgrade, downgrade, or cancel your plan at any time. Changes to your plan will be reflected in your next billing cycle.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How do session credits work?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Each session credit allows you to book a 1-hour session with a teacher of your choice. Session credits reset at the beginning of each billing cycle.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                We accept all major credit cards, including Visa, Mastercard, American Express, and Discover. We also support PayPal payments.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is there a refund policy?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Yes, we offer a 7-day money-back guarantee for all new subscriptions. If you're not satisfied with our service, you can request a full refund within the first week.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Payment Dialog */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
            <DialogDescription>
              {selectedPlan && (
                <>Subscribe to the {selectedPlan.title} plan</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <PaymentForm 
              amount={getPlanPrice(selectedPlan)}
              description={`${selectedPlan.title} ${billingCycle} plan subscription`}
              onPaymentComplete={handlePaymentComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}