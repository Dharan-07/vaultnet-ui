import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import authBackground from '@/assets/auth-background.jpg';
import Logo from '@/assets/vn_logo.png';

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-sm">
    {met ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground" />
    )}
    <span className={met ? 'text-green-500' : 'text-muted-foreground'}>{text}</span>
  </div>
);

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!allRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);

    const result = await signUp(formData.name, formData.email, formData.password);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if (result.requiresEmailVerification) {
      setEmailSent(true);
      toast({
        title: "Verification email sent",
        description: "Please check your inbox to verify your email address.",
      });
    } else {
      toast({
        title: "Account created successfully",
        description: "Welcome to VaultNet!",
      });
      navigate('/marketplace');
    }

    setIsLoading(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-background/95">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-3 md:px-4 py-8 md:py-12">
          <Card className="w-full max-w-md border-primary/20 shadow-2xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-14 w-14 md:h-16 md:w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-7 w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a verification link to <strong>{formData.email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Click the link in the email to verify your account and get started with VaultNet.
              </p>
              <Alert>
                <AlertDescription className="text-xs md:text-sm">
                  Didn't receive the email? Check your spam folder or try signing up again.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button variant="outline" className="w-full" onClick={() => setEmailSent(false)}>
                Use a different email
              </Button>
              <Link to="/signin" className="text-sm text-primary hover:underline">
                Already verified? Sign in
              </Link>
            </CardFooter>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

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

            {/* Right Panel - Sign Up Form */}
            <div className="w-full md:w-1/2 flex flex-col p-4 md:p-6 overflow-y-auto max-h-[80vh] md:max-h-none">
              <CardHeader className="space-y-1 p-0 mb-4">
                <div className="flex justify-center mb-2">
                  <img src={Logo} alt="VaultNet" className="h-10 w-10 md:h-12 md:w-12" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-bold text-center">Create Account</CardTitle>
                <CardDescription className="text-center text-xs md:text-sm">
                  Join the AI marketplace
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && (
                    <Alert variant="destructive" className="text-xs">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="text-foreground text-sm h-9"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="text-foreground text-sm h-9"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="text-foreground pr-10 text-sm h-9"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="mt-2 space-y-0.5 p-2 bg-muted/50 rounded-md text-xs">
                        <PasswordRequirement met={passwordRequirements.minLength} text="At least 8 characters" />
                        <PasswordRequirement met={passwordRequirements.hasUppercase} text="One uppercase" />
                        <PasswordRequirement met={passwordRequirements.hasLowercase} text="One lowercase" />
                        <PasswordRequirement met={passwordRequirements.hasNumber} text="One number" />
                        <PasswordRequirement met={passwordRequirements.hasSpecial} text="One special char" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="text-foreground pr-10 text-sm h-9"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full h-9 text-sm font-medium" disabled={isLoading || !allRequirementsMet}>
                    {isLoading ? 'Creating account...' : 'Sign Up'}
                  </Button>

                  <div className="text-xs text-center text-muted-foreground mt-3 pt-2 border-t">
                    Already have an account?{' '}
                    <Link to="/signin" className="text-primary hover:underline font-semibold">
                      Sign in
                    </Link>
                  </div>
                </form>
              </CardContent>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
