import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, UserX, Shield, Star, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  profileImageUrl?: string;
  status: "active" | "suspended" | "pending";
};

export function UserManagementTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });
  
  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      return await apiRequest("PATCH", `/api/auth/role/${userId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Rol güncellendi",
        description: "Kullanıcı rolü başarıyla değiştirildi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Rol güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/suspend`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Kullanıcı askıya alındı",
        description: "Kullanıcı hesabı başarıyla askıya alındı.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Kullanıcı askıya alınırken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  // Handle user actions
  const handleRoleChange = (role: string) => {
    if (selectedUser) {
      updateRoleMutation.mutate({ userId: selectedUser.id, role });
      setIsRoleDialogOpen(false);
    }
  };
  
  const handleSuspendUser = () => {
    if (selectedUser) {
      suspendUserMutation.mutate(selectedUser.id);
      setIsSuspendDialogOpen(false);
    }
  };
  
  // Filter users
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = 
      !searchQuery || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Email, ad veya soyad ile ara..."
            className="w-full p-2 border rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={roleFilter === null ? "default" : "outline"}
            onClick={() => setRoleFilter(null)}
          >
            Tümü
          </Button>
          <Button 
            variant={roleFilter === "student" ? "default" : "outline"}
            onClick={() => setRoleFilter("student")}
          >
            Öğrenciler
          </Button>
          <Button 
            variant={roleFilter === "teacher" ? "default" : "outline"}
            onClick={() => setRoleFilter("teacher")}
          >
            Öğretmenler
          </Button>
          <Button 
            variant={roleFilter === "admin" ? "default" : "outline"}
            onClick={() => setRoleFilter("admin")}
          >
            Adminler
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Kayıt Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Kullanıcılar yükleniyor...</p>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">Kullanıcı bulunamadı.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 mr-2 flex items-center justify-center overflow-hidden">
                        {user.profileImageUrl ? (
                          <img src={user.profileImageUrl} alt={user.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <div>{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      user.role === "admin" ? "destructive" :
                      user.role === "teacher" ? "default" :
                      "secondary"
                    }>
                      {user.role === "admin" ? "Admin" :
                       user.role === "teacher" ? "Öğretmen" :
                       "Öğrenci"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      user.status === "active" ? "success" :
                      user.status === "suspended" ? "destructive" :
                      "outline"
                    }>
                      {user.status === "active" ? "Aktif" :
                       user.status === "suspended" ? "Askıya Alındı" :
                       "Beklemede"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Menüyü Aç</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          // TODO: implement view user details
                        }}>
                          Detayları Görüntüle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          // TODO: implement send email
                        }}>
                          <Mail className="mr-2 h-4 w-4" />
                          Email Gönder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setIsRoleDialogOpen(true);
                          }}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Rol Değiştir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setIsSuspendDialogOpen(true);
                          }}
                          className="text-amber-600"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Askıya Al
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Role Change Dialog */}
      <AlertDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcı Rolünü Değiştir</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.firstName} {selectedUser?.lastName} kullanıcısının rolünü değiştirmek istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-3 gap-2 py-4">
            <Button
              variant={selectedUser?.role === "student" ? "default" : "outline"}
              onClick={() => handleRoleChange("student")}
              className="flex flex-col h-auto py-4"
            >
              <span className="text-xl mb-1">👨‍🎓</span>
              <span>Öğrenci</span>
            </Button>
            <Button
              variant={selectedUser?.role === "teacher" ? "default" : "outline"}
              onClick={() => handleRoleChange("teacher")}
              className="flex flex-col h-auto py-4"
            >
              <span className="text-xl mb-1">👨‍🏫</span>
              <span>Öğretmen</span>
            </Button>
            <Button
              variant={selectedUser?.role === "admin" ? "default" : "outline"}
              onClick={() => handleRoleChange("admin")}
              className="flex flex-col h-auto py-4"
            >
              <span className="text-xl mb-1">👨‍💼</span>
              <span>Admin</span>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Suspend User Dialog */}
      <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcıyı Askıya Al</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.firstName} {selectedUser?.lastName} kullanıcısını askıya almak istediğinizden emin misiniz? Bu işlem kullanıcının hesabını geçici olarak devre dışı bırakacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspendUser} className="bg-destructive text-destructive-foreground">
              Askıya Al
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}