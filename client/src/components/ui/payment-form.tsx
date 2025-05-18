import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CreditCard, CheckCircle, AlertCircle, LockIcon } from "lucide-react";

const paymentFormSchema = z.object({
  cardNumber: z.string()
    .min(16, "Card number must be 16 digits")
    .max(19, "Card number cannot exceed 19 characters")
    .regex(/^[\d\s-]+$/, "Card number can only contain digits, spaces, or hyphens"),
  cardholderName: z.string()
    .min(3, "Cardholder name must be at least 3 characters")
    .max(100, "Cardholder name is too long"),
  expiryMonth: z.string()
    .min(1, "Month is required"),
  expiryYear: z.string()
    .min(1, "Year is required"),
  cvv: z.string()
    .min(3, "CVV must be at least 3 digits")
    .max(4, "CVV cannot exceed 4 digits")
    .regex(/^\d+$/, "CVV can only contain digits"),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  amount: number;
  description: string;
  onPaymentComplete: (success: boolean, paymentId?: string) => void;
}

export function PaymentForm({ amount, description, onPaymentComplete }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<"success" | "error" | null>(null);
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardNumber: "",
      cardholderName: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: ""
    }
  });
  
  const onSubmit = (data: PaymentFormValues) => {
    setIsProcessing(true);
    
    // Mock payment processing
    setTimeout(() => {
      // Simulate 90% success rate
      const success = Math.random() > 0.1;
      
      if (success) {
        setPaymentResult("success");
        onPaymentComplete(true, "pmt_" + Math.random().toString(36).substring(2, 15));
      } else {
        setPaymentResult("error");
        onPaymentComplete(false);
      }
      
      setIsProcessing(false);
    }, 2000);
  };
  
  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");
    
    // Add a space after every 4 digits
    let formatted = "";
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += " ";
      }
      formatted += digits[i];
    }
    
    return formatted.substring(0, 19); // Limit to 19 characters (16 digits + 3 spaces)
  };
  
  // Generate years for select options (current year + 10 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear + i);
  
  if (paymentResult === "success") {
    return (
      <Card>
        <CardContent className="pt-6 pb-6 text-center">
          <div className="mx-auto mb-4 bg-green-100 text-green-600 rounded-full p-3 w-16 h-16 flex items-center justify-center">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
          <p className="text-muted-foreground mb-4">Your payment has been processed successfully.</p>
          <p className="bg-muted p-3 rounded-md inline-block">${amount.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground mt-4">
            A receipt has been sent to your email address.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (paymentResult === "error") {
    return (
      <Card>
        <CardContent className="pt-6 pb-6 text-center">
          <div className="mx-auto mb-4 bg-red-100 text-red-600 rounded-full p-3 w-16 h-16 flex items-center justify-center">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Payment Failed</h3>
          <p className="text-muted-foreground mb-6">
            We couldn't process your payment. Please try again or use a different payment method.
          </p>
          <Button onClick={() => setPaymentResult(null)}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>
          Complete your payment for {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="bg-muted p-4 rounded-md flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Amount to Pay</p>
              <p className="text-2xl font-bold">${amount.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LockIcon className="h-4 w-4" /> Secure Payment
            </div>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="1234 5678 9012 3456" 
                        className="pl-10" 
                        {...field}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cardholderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cardholder Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="expiryMonth"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Month</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = (i + 1).toString().padStart(2, '0');
                          return (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="expiryYear"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Year</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="YYYY" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cvv"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>CVV</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123" 
                        maxLength={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            <div className="text-sm text-muted-foreground">
              <p className="flex items-center">
                <LockIcon className="h-4 w-4 mr-2" />
                Your payment information is encrypted and secure.
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}