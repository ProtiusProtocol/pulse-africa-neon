import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>(() => {
    // Check URL immediately during initialization
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    if (urlParams.get('reset') === 'true' || hash.includes('type=recovery')) {
      return 'reset';
    }
    return 'login';
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [isRecoverySession, setIsRecoverySession] = useState(() => {
    // Check URL immediately during initialization
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    return urlParams.get('reset') === 'true' || hash.includes('type=recovery');
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Check for recovery indicators using window.location directly (more reliable than React Router)
    const checkForRecovery = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get('type');
      const resetParam = urlParams.get('reset');
      
      return type === 'recovery' || resetParam === 'true' || hash.includes('type=recovery');
    };

    // If already in recovery mode (detected during init), don't redirect
    if (isRecoverySession || mode === 'reset') {
      console.log('Recovery mode active, skipping redirect logic');
      setInitialCheckDone(true);
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event (recovery):', event);
        // Never redirect in recovery mode
      });
      return () => subscription.unsubscribe();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      
      // Check for recovery
      if (checkForRecovery()) {
        setIsRecoverySession(true);
        setMode('reset');
        setInitialCheckDone(true);
        return;
      }
      
      if ((event as string) === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true);
        setMode('reset');
        setInitialCheckDone(true);
        return;
      }
      
      setInitialCheckDone(true);
      
      // Only redirect if logged in and not recovery
      if (session?.user && !checkForRecovery()) {
        navigate("/admin");
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (checkForRecovery()) {
        setIsRecoverySession(true);
        setMode('reset');
        setInitialCheckDone(true);
        return;
      }
      
      setInitialCheckDone(true);
      
      if (session?.user) {
        navigate("/admin");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isRecoverySession, mode]);

  const validateForm = () => {
    if (mode === 'forgot') {
      const emailResult = z.string().email("Please enter a valid email address").safeParse(email);
      if (!emailResult.success) {
        setErrors({ email: emailResult.error.errors[0].message });
        return false;
      }
      setErrors({});
      return true;
    }
    
    if (mode === 'reset') {
      const passwordResult = z.string().min(6, "Password must be at least 6 characters").safeParse(password);
      if (!passwordResult.success) {
        setErrors({ password: passwordResult.error.errors[0].message });
        return false;
      }
      if (password !== confirmPassword) {
        setErrors({ confirmPassword: "Passwords do not match" });
        return false;
      }
      setErrors({});
      return true;
    }
    
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleResetPassword = async () => {
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Password updated", description: "Your password has been reset successfully." });
    setIsRecoverySession(false);
    setMode('login');
    setPassword("");
    setConfirmPassword("");
    navigate("/admin");
  };

  const handleForgotPassword = async () => {
    // Add query param to indicate this is a password reset flow
    const redirectUrl = `${window.location.origin}/auth?reset=true`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ 
      title: "Check your email", 
      description: "We've sent you a password reset link." 
    });
    setMode('login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === 'reset') {
        await handleResetPassword();
      } else if (mode === 'forgot') {
        await handleForgotPassword();
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({ title: "Login failed", description: "Invalid email or password", variant: "destructive" });
          } else {
            toast({ title: "Login failed", description: error.message, variant: "destructive" });
          }
          return;
        }

        toast({ title: "Welcome back", description: "Successfully logged in" });
      } else {
        const redirectUrl = `${window.location.origin}/`;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({ title: "Signup failed", description: "This email is already registered. Try logging in instead.", variant: "destructive" });
          } else {
            toast({ title: "Signup failed", description: error.message, variant: "destructive" });
          }
          return;
        }

        toast({ 
          title: "Account created", 
          description: "You can now log in. Note: Admin access requires role assignment." 
        });
        setMode('login');
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "An unexpected error occurred", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'reset': return "Set New Password";
      case 'forgot': return "Reset Password";
      case 'signup': return "Create Account";
      default: return "Admin Login";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'reset': return "Enter your new password";
      case 'forgot': return "Enter your email to receive a reset link";
      case 'signup': return "Sign up for an account";
      default: return "Sign in to access the admin dashboard";
    }
  };

  const getButtonText = () => {
    if (loading) {
      switch (mode) {
        case 'reset': return "Updating...";
        case 'forgot': return "Sending...";
        case 'signup': return "Creating account...";
        default: return "Signing in...";
      }
    }
    switch (mode) {
      case 'reset': return "Update Password";
      case 'forgot': return "Send Reset Link";
      case 'signup': return "Sign Up";
      default: return "Sign In";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
          <CardTitle className="text-2xl text-glow-primary">
            {getTitle()}
          </CardTitle>
          <CardDescription>
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="pl-10 bg-input border-border"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            )}

            {(mode !== 'forgot') && (
              <div className="space-y-2">
                <Label htmlFor="password">{mode === 'reset' ? 'New Password' : 'Password'}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-input border-border"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            )}

            {mode === 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-input border-border"
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" variant="neon" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {getButtonText()}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  {getButtonText()}
                </>
              )}
            </Button>
          </form>

          {mode !== 'reset' && (
            <div className="mt-6 text-center space-y-2">
              {mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  disabled={loading}
                >
                  Back to login
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  disabled={loading}
                >
                  {mode === 'login' 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"}
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}