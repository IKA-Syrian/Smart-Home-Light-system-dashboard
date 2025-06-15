
import { useState } from "react";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/services/authService";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Sun, Moon, User, Wifi } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [pendingSave, setPendingSave] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  });

  const handleSaveProfile = async () => {
    setPendingSave(true);
    
    try {
      await authApi.updateProfile(profileData);
      toast({
        title: "Profile updated",
        description: "Your profile changes have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setPendingSave(false);
    }
  };

  const handleSaveNetwork = () => {
    setPendingSave(true);
    
    // Simulate API call for network settings
    setTimeout(() => {
      setPendingSave(false);
      toast({
        title: "Network settings updated",
        description: "Your network changes have been saved.",
      });
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account preferences and system settings.
        </p>
      </div>
      
      <Tabs defaultValue="appearance">
        <TabsList className="mb-4">
          <TabsTrigger value="appearance">
            <Sun className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="network">
            <Wifi className="h-4 w-4 mr-2" />
            Network
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme-mode">Dark Mode</Label>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    <Switch 
                      id="theme-mode" 
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                    <Moon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="animations">UI Animations</Label>
                  <Switch id="animations" defaultChecked />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable or disable UI animations
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={profileData.username}
                  onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                />
              </div>
              
              <Button onClick={handleSaveProfile} disabled={pendingSave}>
                {pendingSave ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Network Settings</CardTitle>
              <CardDescription>
                Configure your network and gateway connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gateway-ip">Gateway IP Address</Label>
                <Input id="gateway-ip" defaultValue="192.168.1.100" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gateway-port">Gateway Port</Label>
                <Input id="gateway-port" defaultValue="8080" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-discover">Auto-Discover Devices</Label>
                  <Switch id="auto-discover" defaultChecked />
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically discover new devices on the network
                </p>
              </div>
              
              <Button onClick={handleSaveNetwork} disabled={pendingSave}>
                {pendingSave ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
