import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Database, Cpu } from 'lucide-react';

const Welcome = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
            <Shield className="w-10 h-10 text-primary" />
          </div>
        </div>
        
        {/* Website Name */}
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
          Vault<span className="text-primary">Net</span>
        </h1>
        
        {/* Description */}
        <p className="text-lg md:text-xl text-muted-foreground mb-4 leading-relaxed">
          The Decentralized AI Model Repository
        </p>
        <p className="text-base text-muted-foreground/80 mb-12 max-w-xl mx-auto">
          Discover, share, and monetize AI models securely on the blockchain. 
          Your models, your ownership, your control.
        </p>
        
        {/* Features preview */}
        <div className="flex justify-center gap-8 mb-12">
          <div className="flex flex-col items-center gap-2">
            <Database className="w-6 h-6 text-primary/70" />
            <span className="text-xs text-muted-foreground">Decentralized</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Shield className="w-6 h-6 text-primary/70" />
            <span className="text-xs text-muted-foreground">Secure</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Cpu className="w-6 h-6 text-primary/70" />
            <span className="text-xs text-muted-foreground">AI-Powered</span>
          </div>
        </div>
        
        {/* Get Started Button */}
        <Link to="/home">
          <Button size="lg" className="px-12 py-6 text-lg font-semibold">
            Get Started
          </Button>
        </Link>
      </div>
      
      {/* Footer */}
      <p className="absolute bottom-8 text-sm text-muted-foreground/50">
        © 2024 VaultNet. All rights reserved.
      </p>
    </div>
  );
};

export default Welcome;
