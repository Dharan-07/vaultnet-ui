import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Shield, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import authBackground from '@/assets/auth-background.jpg';
import Logo from '@/assets/vn_logo.png';
import { lovable } from '@/integrations/lovable/index';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const { toast } = useToast();
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (error) {
      setError(error.message || "Failed to sign in with Google");
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      if (result.remainingAttempts !== undefined) {
        setRemainingAttempts(result.remainingAttempts);
      }
    } else {
      toast({
        title: "Sign in successful",
        description: "Welcome back to VaultNet!",
      });
      navigate('/marketplace');
    }

    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsResetLoading(true);
    const result = await resetPassword(resetEmail);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset email sent",
        description: "Check your inbox for password reset instructions.",
      });
      setShowResetDialog(false);
      setResetEmail('');
    }

    setIsResetLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-background/95">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-3 md:px-4 py-8 md:py-12">
        <div className="w-full max-w-[800px]">
          <Card className="w-full border-primary/20 shadow-2xl overflow-hidden flex flex-col md:flex-row gap-0 bg-card">
            {/* Left Panel - Illustration (hidden on mobile) */}
            <div className="hidden md:flex w-1/2 bg-muted items-center justify-center overflow-hidden">
              <img
                src={authBackground}
                alt="Crypto/NFT Illustration"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Panel - Sign In Form */}
            <div className="w-full md:w-1/2 flex flex-col p-4 md:p-6">
              <CardHeader className="space-y-1 p-0 mb-4">
                <div className="flex justify-center mb-2">
                  <img src={Logo} alt="VaultNet" className="h-10 w-10 md:h-12 md:w-12" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-bold text-center">Sign In</CardTitle>
                <CardDescription className="text-center text-xs md:text-sm">
                  Unlock your world.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && (
                    <Alert variant="destructive" className="text-xs">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {error}
                        {remainingAttempts !== null && remainingAttempts > 0 && (
                          <span className="block mt-1 text-xs">
                            {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="text-foreground text-sm h-9"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                      <button
                        type="button"
                        onClick={() => setShowResetDialog(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="text-foreground pr-10 text-sm h-9"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-9 text-sm font-medium" disabled={isLoading || isGoogleLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground text-xs">Or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 h-9 text-sm"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || isGoogleLoading}
                  >
                    <Chrome className="h-4 w-4" />
                    {isGoogleLoading ? 'Signing in...' : 'Google'}
                  </Button>

                  <div className="text-xs text-center text-muted-foreground mt-3 pt-2 border-t">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-primary hover:underline font-semibold">
                      Create one
                    </Link>
                  </div>
                </form>
              </CardContent>
            </div>
          </Card>
        </div>
      </main>
      <Footer />

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="mx-4 max-w-sm md:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="text-foreground"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={isResetLoading}>
              {isResetLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
