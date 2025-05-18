import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";

export interface PricingPlanProps {
  title: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  onSelect: () => void;
  buttonText?: string;
  cycle?: "monthly" | "yearly";
}

export function PricingPlan({
  title,
  price,
  description,
  features,
  popular = false,
  onSelect,
  buttonText = "Select Plan",
  cycle = "monthly"
}: PricingPlanProps) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
  
  return (
    <Card className={`border-2 ${popular ? 'border-primary' : 'border-border'} flex flex-col h-full`}>
      {popular && (
        <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
          <div className="bg-primary text-white text-xs px-3 py-1 rounded-full">
            Most Popular
          </div>
        </div>
      )}
      <CardHeader className="pb-8 pt-6">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="pt-1.5 text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-6">
          <span className="text-4xl font-bold">{formattedPrice}</span>
          <span className="text-muted-foreground ml-1">
            {cycle === "monthly" ? "/month" : "/year"}
          </span>
        </div>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <div className="mr-2 mt-1 rounded-full bg-primary/10 p-1">
                <CheckIcon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-4">
        <Button 
          onClick={onSelect}
          className={`w-full ${popular ? '' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          variant={popular ? "default" : "outline"}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}