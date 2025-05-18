import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  Download, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";

type Transaction = {
  id: string;
  date: string;
  type: "deposit" | "withdrawal" | "commission";
  amount: number;
  status: "pending" | "completed" | "failed";
  studentName?: string;
  description?: string;
};

type EarningsCardProps = {
  totalEarnings: number;
  pendingEarnings: number;
  withdrawnEarnings: number;
  recentTransactions: Transaction[];
  loadingTransactions?: boolean;
};

export function EarningsCardDemo({
  totalEarnings,
  pendingEarnings,
  withdrawnEarnings,
  recentTransactions,
  loadingTransactions = false,
}: EarningsCardProps) {
  const [period, setPeriod] = useState<string>("month");
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);

  const toggleTransaction = (id: string) => {
    if (expandedTransaction === id) {
      setExpandedTransaction(null);
    } else {
      setExpandedTransaction(id);
    }
  };

  // Gruplandırılmış işlemler
  const groupedTransactions = recentTransactions.reduce<Record<string, Transaction[]>>(
    (groups, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    },
    {}
  );

  // İşlem türüne göre stil
  const getTransactionStyle = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return "text-green-600";
      case "withdrawal":
        return "text-blue-600";
      case "commission":
        return "text-amber-600";
      default:
        return "";
    }
  };

  // İşlem durumuna göre rozet
  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Tamamlandı</span>;
      case "pending":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Beklemede</span>;
      case "failed":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Başarısız</span>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Kazançlar</CardTitle>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Dönem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Bu Hafta</SelectItem>
              <SelectItem value="month">Bu Ay</SelectItem>
              <SelectItem value="year">Bu Yıl</SelectItem>
              <SelectItem value="all">Tüm Zamanlar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          {period === "week" ? "Bu haftaki" : 
           period === "month" ? "Bu aydaki" : 
           period === "year" ? "Bu yıldaki" : "Tüm"} kazançlarınız
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Toplam Kazanç</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{totalEarnings.toLocaleString('tr-TR')}₺</p>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Bekleyen</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{pendingEarnings.toLocaleString('tr-TR')}₺</p>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Çekilen</span>
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{withdrawnEarnings.toLocaleString('tr-TR')}₺</p>
          </div>
        </div>
        
        <Tabs defaultValue="transactions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">İşlemler</TabsTrigger>
            <TabsTrigger value="withdraw">Para Çekme</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions" className="space-y-4">
            <div className="rounded-md border">
              <div className="p-4 bg-muted/50 font-medium flex items-center justify-between">
                <span>Son İşlemler</span>
                <Button variant="ghost" size="sm" className="h-8 gap-1">
                  <Download className="h-4 w-4" />
                  Rapor İndir
                </Button>
              </div>
              
              {loadingTransactions ? (
                <div className="flex items-center justify-center p-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">Henüz işlem yok</p>
                </div>
              ) : (
                <div className="divide-y">
                  {Object.entries(groupedTransactions).map(([date, transactions]) => (
                    <div key={date}>
                      <div className="px-4 py-2 bg-muted/30 text-sm font-medium">
                        {date}
                      </div>
                      
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="px-4 py-3">
                          <div 
                            className="flex items-center justify-between cursor-pointer" 
                            onClick={() => toggleTransaction(transaction.id)}
                          >
                            <div className="flex items-center">
                              <div className={`p-2 rounded-full mr-3 ${
                                transaction.type === "deposit" ? "bg-green-100" :
                                transaction.type === "withdrawal" ? "bg-blue-100" :
                                "bg-amber-100"
                              }`}>
                                {transaction.type === "deposit" ? (
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                ) : transaction.type === "withdrawal" ? (
                                  <CreditCard className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <DollarSign className="h-4 w-4 text-amber-600" />
                                )}
                              </div>
                              
                              <div>
                                <p className="font-medium">
                                  {transaction.type === "deposit" ? "Ders Ödemesi" :
                                   transaction.type === "withdrawal" ? "Para Çekme" :
                                   "Platform Komisyonu"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(transaction.date).toLocaleTimeString("tr-TR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={`font-medium ${getTransactionStyle(transaction.type)}`}>
                                {transaction.type === "deposit" ? "+" : "-"}
                                {transaction.amount.toLocaleString('tr-TR')}₺
                              </span>
                              {expandedTransaction === transaction.id ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          
                          {expandedTransaction === transaction.id && (
                            <div className="mt-3 pl-12 text-sm space-y-2">
                              <div className="flex justify-between text-muted-foreground">
                                <span>Durum:</span>
                                {getStatusBadge(transaction.status)}
                              </div>
                              
                              {transaction.studentName && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Öğrenci:</span>
                                  <span>{transaction.studentName}</span>
                                </div>
                              )}
                              
                              {transaction.description && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Açıklama:</span>
                                  <span>{transaction.description}</span>
                                </div>
                              )}
                              
                              <div className="flex justify-between text-muted-foreground">
                                <span>İşlem Numarası:</span>
                                <span>#{transaction.id}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-center">
              <Link href="/earnings">
                <Button variant="outline" className="w-full">
                  Tüm İşlemleri Görüntüle
                </Button>
              </Link>
            </div>
          </TabsContent>
          
          <TabsContent value="withdraw">
            <div className="space-y-4 py-2">
              <div className="bg-primary/10 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Çekilebilir Bakiye</p>
                  <p className="text-2xl font-bold">{pendingEarnings.toLocaleString('tr-TR')}₺</p>
                </div>
                <Button>Para Çek</Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Banka Hesabı</p>
                <div className="flex items-center p-3 border rounded-md">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-full mr-3">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Akbank</p>
                    <p className="text-sm text-muted-foreground">**** **** **** 1234</p>
                  </div>
                  <Button variant="ghost" size="sm">Değiştir</Button>
                </div>
                
                <div className="pt-4">
                  <p className="text-sm font-medium mb-2">Para Çekme Politikası</p>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                    <li>Minimum para çekme tutarı 100₺'dir</li>
                    <li>Para çekme işlemi 1-3 iş günü içerisinde tamamlanır</li>
                    <li>Para çekme işlemlerinde komisyon alınmaz</li>
                    <li>Sadece kendi adınıza kayıtlı banka hesaplarına para çekebilirsiniz</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}