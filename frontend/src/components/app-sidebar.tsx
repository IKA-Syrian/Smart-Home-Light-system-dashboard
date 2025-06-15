import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useRooms } from "@/hooks/useApi";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Home, 
  Settings, 
  LogOut, 
  LayoutGrid,
  Clock
} from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { pathname } = useLocation();
  const logout = useAuthStore((state) => state.logoutAction);
  const { data: rooms = [] } = useRooms();

  const isLinkActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.includes(path);
  };

  return (
    <Sidebar>
      <SidebarHeader className="py-4 border-b">
        <div className="flex justify-center">
          <Logo />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-4">
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={cn(
                  "w-full justify-start gap-3 px-3",
                  isLinkActive('/dashboard') ? "bg-accent text-accent-foreground" : "",
                )}>
                  <Link to="/dashboard">
                    <Home className="h-[1.2rem] w-[1.2rem]" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={cn(
                  "w-full justify-start gap-3 px-3",
                  isLinkActive('/scenes') ? "bg-accent text-accent-foreground" : "",
                )}>
                  <Link to="/scenes">
                    <Clock className="h-[1.2rem] w-[1.2rem]" />
                    <span>Scenes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={cn(
                  "w-full justify-start gap-3 px-3",
                  isLinkActive('/settings') ? "bg-accent text-accent-foreground" : "",
                )}>
                  <Link to="/settings">
                    <Settings className="h-[1.2rem] w-[1.2rem]" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Rooms</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {rooms.map((room) => (
                <SidebarMenuItem key={room.room_id}>
                  <SidebarMenuButton asChild className={cn(
                    "w-full justify-start gap-3 px-3",
                    isLinkActive(`/rooms/${room.room_id}`) ? "bg-accent text-accent-foreground" : "",
                  )}>
                    <Link to={`/rooms/${room.room_id}`}>
                      <LayoutGrid className="h-[1.2rem] w-[1.2rem]" />
                      <span>{room.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={logout}
            aria-label="Logout"
          >
            <LogOut className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
