import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Database, Shield, Cpu, ArrowRight, ChevronDown, Users, Globe, Lock, Zap, Code, Coins, FileCheck, Network } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import Spline from '@splinetool/react-spline';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GridNode {
  id: number;
  x: number;
  y: number;
  connections: number[];
}

const Welcome = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  
  const tagline = "The Decentralized AI Model & Dataset Repository";

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
  }, []);

  // Typing effect for tagline
  useEffect(() => {
    if (!isLoaded) return;
    
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= tagline.length) {
        setTypedText(tagline.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);
    
    return () => clearInterval(typingInterval);
  }, [isLoaded]);

  // Cursor blink effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  const features = [
    { icon: Database, label: 'Decentralized', description: 'Fully distributed network' },
    { icon: Shield, label: 'Secure', description: 'Blockchain-backed security' },
    { icon: Cpu, label: 'AI-Powered', description: 'Advanced algorithms' },
  ];

  const aboutSections = [
    {
      icon: Globe,
      title: "What is VaultNet?",
      content: "VaultNet is a revolutionary decentralized platform for AI models and datasets. Built on blockchain technology, it enables researchers, developers, and organizations to securely share, discover, and monetize their AI assets while maintaining complete ownership and control."
    },
    {
      icon: Network,
      title: "Decentralized Infrastructure",
      content: "Our platform leverages distributed storage through IPFS and blockchain-based verification to ensure your models and datasets are always available, tamper-proof, and censorship-resistant. No single point of failure means your assets are safe forever."
    },
    {
      icon: Lock,
      title: "Security & Privacy",
      content: "Every upload is cryptographically signed and verified on the blockchain. Our trust scoring system evaluates model integrity, scanning for vulnerabilities and ensuring authenticity. Your intellectual property remains yours with granular access controls."
    },
    {
      icon: Coins,
      title: "Tokenized Marketplace",
      content: "Monetize your AI creations through our integrated marketplace. Set your own pricing, receive payments in cryptocurrency, and track usage transparently. Smart contracts ensure fair and automatic compensation for creators."
    },
    {
      icon: Users,
      title: "Community Driven",
      content: "Join a thriving community of AI researchers, developers, and enthusiasts. Upvote quality models, leave reviews, and collaborate on datasets. Community governance ensures the platform evolves based on user needs."
    },
    {
      icon: FileCheck,
      title: "Model Verification",
      content: "Our advanced scanning system analyzes every uploaded model for structure integrity, security vulnerabilities, and authenticity. Each model receives a Trust Score that helps users make informed decisions."
    },
    {
      icon: Code,
      title: "Developer Friendly",
      content: "Easy-to-use APIs and SDKs allow seamless integration with your existing workflows. Support for popular frameworks like TensorFlow, PyTorch, and Hugging Face makes uploading and deploying models effortless."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      content: "Optimized content delivery ensures fast downloads regardless of file size. Our distributed network routes requests to the nearest nodes, providing low-latency access to models and datasets worldwide."
    }
  ];

  const scrollToAbout = () => {
    const aboutSection = document.getElementById('about-section');
    aboutSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-[200vh] bg-background relative overflow-x-hidden">
      {/* Hero Section */}
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* Spline 3D Background */}
        <div className="absolute inset-0 z-0">
          <Spline
            scene="https://prod.spline.design/WcdSRk281zM5Rntd/scene.splinecode"
          />
        </div>
        
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80 z-10" />
        
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

        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 animate-pulse z-20" style={{ animationDuration: '4s' }} />

        <div className="relative z-30 text-center px-6 max-w-3xl mx-auto transform transition-all duration-1000 hover:scale-[1.02]">
          {/* Animated Logo/Icon */}
          <div 
            className={`flex justify-center mb-2 transition-all duration-1000 ${
              isLoaded ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
          >
            <img 
              //src={Logo} 
              //alt="VaultNet Logo" 
              //className="w-40 h-40 hover:scale-110 transition-transform duration-300 cursor-pointer" 
            />
          </div>
          
          {/* Website Name */}
          <div 
            className={`mb-6 transition-all duration-1000 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-foreground/90 tracking-tight cursor-pointer drop-shadow-lg hover:text-foreground transition-colors duration-300">
              VaultNet
            </h1>
          </div>
          
          {/* Typing Effect Tagline */}
          <p 
            className={`text-lg md:text-xl text-foreground/70 mb-4 leading-relaxed transition-all duration-1000 delay-200 h-8 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            {typedText}
            <span 
              className={`inline-block w-0.5 h-6 bg-primary ml-1 align-middle ${
                showCursor ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </p>
          <p 
            className={`text-base text-foreground/80 mb-12 max-w-xl mx-auto transition-all duration-1000 delay-300 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            Discover, share, and monetize AI models and datasets securely on the blockchain. 
            Your data, your ownership, your control.
          </p>
          
          {/* Interactive Features preview */}
          <div 
            className={`flex flex-col md:flex-row justify-center items-stretch gap-8 mb-12 transition-all duration-1000 delay-400 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-2 p-6 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-xl cursor-pointer transition-all duration-300 hover:bg-white/20 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 hover:scale-105 group basis-0 flex-1 min-h-[140px]"
                  onMouseEnter={() => setActiveFeature(idx)}
                  onMouseLeave={() => setActiveFeature(null)}
                >
                  <Icon 
                    className={`w-8 h-8 transition-all duration-300 ${
                      activeFeature === idx ? 'text-primary scale-125' : 'text-primary/80 group-hover:text-primary'
                    }`}
                  />
                  <span className="font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                    {feature.label}
                  </span>
                  <span 
                    className={`text-xs text-foreground/60 max-w-xs transition-all duration-300 ${
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
              className={`px-12 py-6 text-lg font-semibold transition-all duration-1000 delay-500 group hover:shadow-lg hover:shadow-primary/50 backdrop-blur-sm bg-primary/90 hover:bg-primary border border-primary/20 hover:border-primary/40 ${
                isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
        
        {/* Scroll Down Indicator */}
        <button 
          onClick={scrollToAbout}
          className={`absolute bottom-12 z-30 flex flex-col items-center gap-2 cursor-pointer transition-all duration-1000 delay-700 hover:scale-110 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-sm text-foreground/50">Learn More</span>
          <ChevronDown className="w-6 h-6 text-primary animate-bounce" />
        </button>
      </div>

      {/* About Us Section */}
      <section id="about-section" className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background relative py-20 px-6">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              About <span className="text-primary">VaultNet</span>
            </h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
              Everything you need to know about the future of decentralized AI
            </p>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {aboutSections.map((section, idx) => {
                const Icon = section.icon;
                return (
                  <div
                    key={idx}
                    className="group p-6 rounded-2xl backdrop-blur-md bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {section.title}
                        </h3>
                        <p className="text-foreground/70 leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Call to Action */}
              <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-center mt-12">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Get Started?
                </h3>
                <p className="text-foreground/70 mb-6 max-w-xl mx-auto">
                  Join thousands of researchers and developers building the future of AI on VaultNet.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/signup">
                    <Button size="lg" className="px-8">
                      Create Account
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/home">
                    <Button size="lg" variant="outline" className="px-8">
                      Explore Models
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Footer within scroll */}
              <div className="text-center pt-8 pb-4">
                <p className="text-sm text-foreground/40">
                  © 2024 VaultNet. All rights reserved.
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>
      </section>
    </div>
  );
};

export default Welcome;