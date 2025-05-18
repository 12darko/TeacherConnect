import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { HomeIcon, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center max-w-md px-4">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Sayfa Bulunamadı</h2>
        <p className="text-muted-foreground mb-6">
          Aradığınız sayfa bulunamadı veya taşınmış olabilir.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/">
            <Button className="w-full sm:w-auto flex items-center gap-2">
              <HomeIcon className="h-4 w-4" />
              Ana Sayfaya Dön
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto flex items-center gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Geri Git
          </Button>
        </div>
      </div>
    </div>
  );
}