import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Database, Shield, Cpu, ArrowRight } from 'lucide-react';
import Logo from '@/assets/vn_logo.svg';
import welcomeBackground from '@/assets/welcome background.jpg';
import { useState, useEffect } from 'react';

const Welcome = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    { icon: Database, label: 'Decentralized', description: 'Fully distributed network' },
    { icon: Shield, label: 'Secure', description: 'Blockchain-backed security' },
    { icon: Cpu, label: 'AI-Powered', description: 'Advanced algorithms' },
  ];

  return (
    <div 
      className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${welcomeBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Overlay for better text contrast */}
      <div className="absolute inset-0 bg-background/60" />
      {/* Animated background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl transition-all duration-500"
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
        }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl transition-all duration-500"
        style={{
          transform: `translate(${-mousePosition.x * 0.02}px, ${-mousePosition.y * 0.02}px)`,
        }}
      />
      
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Animated Logo/Icon */}
        <div 
          className={`flex justify-center mb-2 transition-all duration-1000 ${
            isLoaded ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
        >
          <img 
            src={Logo} 
            alt="VaultNet Logo" 
            className="w-40 h-40 hover:scale-110 transition-transform duration-300 cursor-pointer" 
          />
        </div>
        
        {/* Animated Website Name */}
        <h1 
          className={`text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight transition-all duration-1000 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          VaultNet
        </h1>
        
        {/* Animated Description */}
        <p 
          className={`text-lg md:text-xl text-muted-foreground mb-4 leading-relaxed transition-all duration-1000 delay-200 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          The Decentralized AI Model & Dataset Repository
        </p>
        <p 
          className={`text-base text-muted-foreground/80 mb-12 max-w-xl mx-auto transition-all duration-1000 delay-300 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          Discover, share, and monetize AI models and datasets securely on the blockchain. 
          Your data, your ownership, your control.
        </p>
        
        {/* Interactive Features preview */}
        <div 
          className={`flex flex-col md:flex-row justify-center gap-8 mb-12 transition-all duration-1000 delay-400 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center gap-2 p-6 rounded-lg border border-primary/10 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg hover:-translate-y-2 group"
                onMouseEnter={() => setActiveFeature(idx)}
                onMouseLeave={() => setActiveFeature(null)}
              >
                <Icon 
                  className={`w-8 h-8 transition-all duration-300 ${
                    activeFeature === idx ? 'text-primary scale-125' : 'text-primary/70 group-hover:text-primary'
                  }`}
                />
                <span className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  {feature.label}
                </span>
                <span 
                  className={`text-xs text-muted-foreground/60 max-w-xs transition-all duration-300 ${
                    activeFeature === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 hidden'
                  }`}
                >
                  {feature.description}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Animated Get Started Button */}
        <Link to="/home">
          <Button 
            size="lg" 
            className={`px-12 py-6 text-lg font-semibold transition-all duration-1000 delay-500 group hover:shadow-lg hover:shadow-primary/50 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
      
      {/* Animated Footer */}
      <p 
        className={`absolute bottom-8 text-sm text-muted-foreground/50 transition-all duration-1000 delay-700 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        © 2024 VaultNet. All rights reserved.
      </p>
    </div>
  );
};

export default Welcome;
