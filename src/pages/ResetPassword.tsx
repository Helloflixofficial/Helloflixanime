import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Sparkles } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase automatically parses the URL tokens (both PKCE code and Implicit access_token)
    // so we don't need to manually parse them, which can cause a lock deadlock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log("Auth event:", event);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);
    try {
      // Ensure we actually have a session from the reset link before trying to update
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        toast({ 
          variant: "destructive", 
          title: "Session Missing or Expired", 
          description: "Your password reset link is invalid or has expired. Please request a new one." 
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
      navigate("/auth");
    } catch (error: any) {
      console.error("Update password error:", error);
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update password" });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 space-y-2">
          <Sparkles className="h-8 w-8 text-primary animate-pulse mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">Set New Password</h1>
          <p className="text-muted-foreground text-sm">Enter your new password below</p>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 h-11 bg-background/50 border-border/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 h-11 bg-background/50 border-border/50"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
