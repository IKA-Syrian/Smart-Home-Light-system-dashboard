import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { useLogin } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const loginAction = useAuthStore((state) => state.loginAction);
  const loginMutation = useLogin();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await loginMutation.mutateAsync({
        email,
        password,
      });
      console.log("Login mutation response (from useLogin hook):", response);

      if (response && response.user && response.token) {
        loginAction(response.user, response.token);
        
        toast({
          title: "Login Successful",
          description: "Welcome back to Lumos!",
        });
        
        navigate("/dashboard");
      } else {
        console.error("Login response from mutation missing user or token:", response);
        toast({
          title: "Login Failed",
          description: "Received an unexpected response from the server.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isLoading = loginMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/50">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="shadow-xl">
          <CardHeader className="space-y-1 flex flex-col items-center text-center">
            <Logo className="mb-4" />
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Login to manage your smart home lighting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
            
            <div className="text-sm text-muted-foreground text-center">
              <p>Demo credentials for testing:</p>
              <div className="flex flex-col gap-1 mt-1 text-xs">
                <div>Email: demo@lumos.com</div>
                <div>Password: demo123</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link 
                to="/register" 
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
