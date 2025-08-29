import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Zap, Users, Trophy, Code, Lightbulb, Terminal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import authBackground from "@/assets/auth-background.jpg";

interface AuthPageProps {
  onAuthSuccess?: () => void;
}

const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      
      toast({
        title: "Welcome back, SLCIAN! 🚀",
        description: "Successfully logged in. Let's continue your SIH journey!",
      });
      
      onAuthSuccess?.();
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Account already exists",
            description: "Please use the Login tab to sign in with your existing account.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        setIsLoading(false);
        return;
      }
      
      toast({
        title: "Welcome to the SLCIAN family! 🎉",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Info Section */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          backgroundImage: `url(${authBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-hero/80"></div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="animate-slide-in-left">
            <h1 className="text-4xl font-bold mb-6 animate-fade-in-up">
              Welcome to <span className="text-accent-light">IIC SLC SIH</span>
            </h1>
            <p className="text-xl mb-8 opacity-90 animate-fade-in-up delay-200">
              Your ultimate preparation platform for Smart India Hackathon
            </p>
          </div>

          <div className="space-y-6 animate-slide-in-left delay-300">
            <div className="flex items-center space-x-4 hover-lift">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Skill Assessment</h3>
                <p className="text-sm opacity-80">Personalized preparation strategy based on your skills</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 hover-lift">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Daily Challenges</h3>
                <p className="text-sm opacity-80">Progressive problem-solving to boost your confidence</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 hover-lift">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">SLCIAN Community</h3>
                <p className="text-sm opacity-80">Compete and collaborate with fellow SLC students</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 hover-lift">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Real-time Leaderboard</h3>
                <p className="text-sm opacity-80">Track your progress against other SLCIANs</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 hover-lift">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Code + Video Reviews</h3>
                <p className="text-sm opacity-80">Comprehensive evaluation of your solutions</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 hover-lift">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Problem Statement Focus</h3>
                <p className="text-sm opacity-80">Tailored challenges based on your chosen SIH theme</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-lg animate-float">
            <p className="text-sm">
              <strong>Start your SIH journey today!</strong> Join 500+ SLCIANs already preparing for success.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Authentication */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-slide-in-right">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Terminal className="w-8 h-8 text-accent animate-pulse" />
              <h2 className="text-3xl font-bold bg-gradient-cyber bg-clip-text text-transparent">SIH SLC</h2>
            </div>
            <p className="text-muted-foreground">Join the elite SLCIAN coding community</p>
          </div>

          <Card className="shadow-glow hover-lift border-primary/20 bg-card/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-primary font-mono">Welcome Back, SLCIAN!</CardTitle>
              <CardDescription className="text-muted-foreground">
                Initialize your SIH preparation protocol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-mono text-accent">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your.email@slc.ac.in"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="font-mono bg-background/50 border-primary/30 focus:border-accent focus:shadow-neon transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="font-mono text-accent">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="font-mono bg-background/50 border-primary/30 focus:border-accent focus:shadow-neon transition-all duration-300"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full font-mono" 
                      variant="neon"
                      disabled={isLoading}
                    >
                      {isLoading ? "Authenticating..." : "Initialize Session"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="font-mono text-accent">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="your.email@slc.ac.in"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="font-mono bg-background/50 border-primary/30 focus:border-accent focus:shadow-neon transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="font-mono text-accent">Password</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="font-mono bg-background/50 border-primary/30 focus:border-accent focus:shadow-neon transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="font-mono text-accent">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="font-mono bg-background/50 border-primary/30 focus:border-accent focus:shadow-neon transition-all duration-300"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full font-mono" 
                      variant="neon"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating Profile..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p className="font-mono">
              By signing up, you agree to participate in the SIH preparation program.
              <br />
              <span className="text-accent font-medium animate-pulse">./hackathon --init 🚀</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;