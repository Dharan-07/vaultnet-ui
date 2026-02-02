import { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, 
  Wallet, 
  Upload, 
  ShoppingCart, 
  Shield, 
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface InstructionStep {
  icon: React.ElementType;
  title: string;
  description: string;
  steps: string[];
}

const InstructionsSection = () => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const instructions: InstructionStep[] = [
    {
      icon: UserPlus,
      title: "Getting Started",
      description: "Create your account and set up your profile.",
      steps: [
        "Click 'Get Started' or 'Sign Up' to create your account",
        "Enter your email and create a secure password",
        "Verify your email through the confirmation link",
        "Complete your profile with your display name"
      ]
    },
    {
      icon: Wallet,
      title: "Connect Your Wallet",
      description: "Link your cryptocurrency wallet for transactions.",
      steps: [
        "Install MetaMask or a compatible wallet extension",
        "Click 'Connect Wallet' in the navigation bar",
        "Approve the connection request in your wallet",
        "Your wallet address will appear once connected"
      ]
    },
    {
      icon: Upload,
      title: "Upload Models & Datasets",
      description: "Share your AI models and datasets with the community.",
      steps: [
        "Navigate to 'Upload' from the dashboard",
        "Select your file (.h5, .pt, .onnx, .csv, .json, etc.)",
        "Add name, description, category, and pricing",
        "Submit for automatic trust score scanning and IPFS storage"
      ]
    },
    {
      icon: ShoppingCart,
      title: "Purchase & Download",
      description: "Acquire and download models from the marketplace.",
      steps: [
        "Browse models in 'Explore' or 'Marketplace'",
        "Check the trust score before purchasing",
        "Click 'Purchase' and confirm the transaction in your wallet",
        "Download your content from your dashboard"
      ]
    },
    {
      icon: Shield,
      title: "Understanding Trust Scores",
      description: "Learn how VaultNet ensures quality and safety.",
      steps: [
        "Trust scores range from 0-100 based on multiple factors",
        "Factors include: structure integrity, vulnerability scans, community votes",
        "Higher scores indicate better security and authenticity",
        "Look for the shield badge indicating verification status"
      ]
    }
  ];

  const faqs = [
    {
      question: "What file formats are supported?",
      answer: "Models: .h5, .pt, .pth, .onnx, .pkl, .safetensors. Datasets: .csv, .json, compressed formats."
    },
    {
      question: "What cryptocurrency is accepted?",
      answer: "VaultNet primarily supports Ethereum (ETH). Connect MetaMask or a compatible wallet to transact."
    },
    {
      question: "How does IPFS storage work?",
      answer: "Uploads are stored on IPFS, a decentralized network ensuring content is tamper-proof and always available via its unique hash (CID)."
    },
    {
      question: "Is my data secure?",
      answer: "Yes. VaultNet uses blockchain verification, IPFS storage, and cryptographic signing. Your private keys remain in your control."
    }
  ];

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    
    itemRefs.current.forEach((ref, index) => {
      if (ref) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setVisibleItems((prev) => new Set([...prev, index]));
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
        );
        observer.observe(ref);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <section id="instructions-section" className="min-h-screen relative py-20 px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background z-0" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">User Guide</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How to Use <span className="text-primary">VaultNet</span>
          </h2>
          <p className="text-lg text-foreground/60 max-w-xl mx-auto">
            Quick guide to get started with our decentralized AI platform
          </p>
        </div>

        {/* Instructions Grid */}
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 mb-12">
            {instructions.map((instruction, idx) => {
              const Icon = instruction.icon;
              return (
                <div
                  key={idx}
                  ref={(el) => (itemRefs.current[idx] = el)}
                  className={`group rounded-2xl backdrop-blur-md bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-700 hover:shadow-lg hover:shadow-primary/10 overflow-hidden ${
                    visibleItems.has(idx)
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 -translate-x-8'
                  }`}
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <Accordion type="single" collapsible>
                    <AccordionItem value={`item-${idx}`} className="border-none">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                              {instruction.title}
                            </h3>
                            <p className="text-sm text-foreground/60">
                              {instruction.description}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <div className="pl-16 space-y-3">
                          {instruction.steps.map((step, stepIdx) => (
                            <div key={stepIdx} className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-bold text-primary">{stepIdx + 1}</span>
                              </div>
                              <p className="text-foreground/70 leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-12 mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              FAQ
            </h3>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-xl backdrop-blur-md bg-card/30 border border-border/50 hover:border-primary/30 transition-all duration-300"
                >
                  <Accordion type="single" collapsible>
                    <AccordionItem value={`faq-${idx}`} className="border-none">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline text-left">
                        <div className="flex items-center gap-3">
                          <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-foreground">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <p className="text-foreground/70 pl-7 leading-relaxed">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              ))}
            </div>
          </div>

          {/* Footer spacing */}
          <div className="h-8" />
        </ScrollArea>
      </div>
    </section>
  );
};

export default InstructionsSection;
