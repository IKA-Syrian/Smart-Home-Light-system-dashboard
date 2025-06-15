
import { Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuthStore } from "@/store/authStore";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isMobile = useIsMobile();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-y-auto overflow-x-hidden bg-secondary/50">
          {isMobile && (
            <div className="sticky top-0 z-10 bg-background border-b p-2">
              <SidebarTrigger className="w-8 h-8">
                <span className="sr-only">Toggle sidebar</span>
              </SidebarTrigger>
            </div>
          )}
          <div className="p-4 lg:p-6 flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
