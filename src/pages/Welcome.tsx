import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Database, Shield, Cpu, ArrowRight } from 'lucide-react';
import Logo from '@/assets/vn_logo.svg';
import { useState, useEffect, useRef, useMemo } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  pulse: number;
}

interface GridNode {
  id: number;
  x: number;
  y: number;
  connections: number[];
}

const Welcome = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Generate grid nodes for circuit-like pattern
  const gridNodes = useMemo<GridNode[]>(() => {
    const nodes: GridNode[] = [];
    const cols = 8;
    const rows = 6;
    for (let i = 0; i < cols * rows; i++) {
      const x = (i % cols) * (100 / (cols - 1));
      const y = Math.floor(i / cols) * (100 / (rows - 1));
      const connections: number[] = [];
      if (i % cols < cols - 1) connections.push(i + 1);
      if (i < (rows - 1) * cols) connections.push(i + cols);
      if (Math.random() > 0.6 && i % cols < cols - 1 && i < (rows - 1) * cols) {
        connections.push(i + cols + 1);
      }
      nodes.push({ id: i, x, y, connections });
    }
    return nodes;
  }, []);

  useEffect(() => {
    setIsLoaded(true);
    
    // Initialize particles
    const initialParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));
    setParticles(initialParticles);
  }, []);

  // Animate particles
  useEffect(() => {
    const animate = () => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: ((p.x + p.speedX + 100) % 100),
        y: ((p.y + p.speedY + 100) % 100),
        pulse: p.pulse + 0.05,
        opacity: 0.2 + Math.sin(p.pulse) * 0.3,
      })));
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-background/70" />
      
      {/* Animated grid circuit pattern */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {gridNodes.map(node => 
          node.connections.map(connId => {
            const target = gridNodes[connId];
            if (!target) return null;
            return (
              <line
                key={`${node.id}-${connId}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke="url(#lineGradient)"
                strokeWidth="1"
                className="animate-pulse"
                style={{ animationDelay: `${node.id * 0.1}s` }}
              />
            );
          })
        )}
        {gridNodes.map(node => (
          <circle
            key={`node-${node.id}`}
            cx={`${node.x}%`}
            cy={`${node.y}%`}
            r="3"
            fill="hsl(var(--primary))"
            filter="url(#glow)"
            className="animate-pulse"
            style={{ animationDelay: `${node.id * 0.15}s` }}
          />
        ))}
      </svg>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-primary"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size * 3}px hsl(var(--primary))`,
              transition: 'opacity 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Hexagonal pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 animate-pulse" style={{ animationDuration: '4s' }} />
      
      {/* Mouse-following glow orbs */}
      <div 
        className="absolute w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] transition-all duration-700"
        style={{
          left: mousePosition.x - 300,
          top: mousePosition.y - 300,
        }}
      />
      <div 
        className="absolute w-[400px] h-[400px] bg-accent/15 rounded-full blur-[100px] transition-all duration-500"
        style={{
          left: mousePosition.x - 200 + 100,
          top: mousePosition.y - 200 - 50,
        }}
      />

      {/* Scanning line effect */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div 
          className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          style={{
            animation: 'scanLine 3s linear infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes dataFlow {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes glitch {
          0% {
            clip-path: inset(40% 0 61% 0);
            transform: translate(-2px, 2px);
          }
          20% {
            clip-path: inset(92% 0 1% 0);
            transform: translate(2px, -2px);
          }
          40% {
            clip-path: inset(43% 0 1% 0);
            transform: translate(-2px, 2px);
          }
          60% {
            clip-path: inset(25% 0 58% 0);
            transform: translate(2px, -2px);
          }
          80% {
            clip-path: inset(54% 0 7% 0);
            transform: translate(-2px, 2px);
          }
          100% {
            clip-path: inset(58% 0 43% 0);
            transform: translate(2px, -2px);
          }
        }
        @keyframes glitch2 {
          0% {
            clip-path: inset(25% 0 58% 0);
            transform: translate(2px, -2px);
          }
          20% {
            clip-path: inset(54% 0 7% 0);
            transform: translate(-2px, 2px);
          }
          40% {
            clip-path: inset(58% 0 43% 0);
            transform: translate(2px, -2px);
          }
          60% {
            clip-path: inset(40% 0 61% 0);
            transform: translate(-2px, 2px);
          }
          80% {
            clip-path: inset(92% 0 1% 0);
            transform: translate(2px, -2px);
          }
          100% {
            clip-path: inset(43% 0 1% 0);
            transform: translate(-2px, 2px);
          }
        }
        .glitch-text {
          position: relative;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: 'VaultNet';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .glitch-text::before {
          color: hsl(var(--primary));
          animation: glitch 2s infinite linear alternate-reverse;
          text-shadow: 2px 0 hsl(var(--primary));
        }
        .glitch-text::after {
          color: hsl(var(--accent));
          animation: glitch2 2s infinite linear alternate-reverse;
          text-shadow: -2px 0 hsl(var(--accent));
        }
        .glitch-container:hover .glitch-text::before,
        .glitch-container:hover .glitch-text::after {
          animation-duration: 0.3s;
        }
      `}</style>
      
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
        
        {/* Glitch Effect Website Name */}
        <div 
          className={`glitch-container mb-6 transition-all duration-1000 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <h1 className="glitch-text text-5xl md:text-7xl font-bold text-foreground tracking-tight cursor-pointer">
            VaultNet
          </h1>
        </div>
        
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
