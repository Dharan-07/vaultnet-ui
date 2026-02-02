import { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, 
  LogIn, 
  Search, 
  Upload, 
  ShoppingCart, 
  Wallet, 
  ThumbsUp, 
  Shield, 
  Download,
  Eye,
  Settings,
  HelpCircle,
  ChevronRight,
  CheckCircle2
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
      title: "Creating Your Account",
      description: "Get started with VaultNet by creating your free account.",
      steps: [
        "Click the 'Get Started' button on the welcome page",
        "Navigate to the Sign Up page",
        "Enter your email address and create a secure password",
        "Verify your email address through the confirmation link",
        "Complete your profile with your display name and preferences"
      ]
    },
    {
      icon: LogIn,
      title: "Signing In",
      description: "Access your VaultNet account securely.",
      steps: [
        "Click 'Sign In' from the navigation menu",
        "Enter your registered email and password",
        "Use 'Remember Me' for faster future logins",
        "If you forgot your password, use the reset option",
        "After successful login, you'll be redirected to the home page"
      ]
    },
    {
      icon: Wallet,
      title: "Connecting Your Wallet",
      description: "Link your cryptocurrency wallet for transactions.",
      steps: [
        "Ensure you have MetaMask or a compatible wallet installed",
        "Click 'Connect Wallet' in the navigation bar",
        "Select your preferred wallet provider",
        "Approve the connection request in your wallet",
        "Your wallet address will appear once connected"
      ]
    },
    {
      icon: Search,
      title: "Browsing Models & Datasets",
      description: "Discover AI models and datasets on the platform.",
      steps: [
        "Navigate to 'Explore' or 'Marketplace' from the menu",
        "Use the search bar to find specific models or datasets",
        "Filter results by category, framework, or trust score",
        "Click on any card to view detailed information",
        "Check the trust score badge for quality assurance"
      ]
    },
    {
      icon: Eye,
      title: "Viewing Model Details",
      description: "Get comprehensive information about any model.",
      steps: [
        "Click on a model card to open its details page",
        "Review the model description, framework, and specifications",
        "Check the trust score and verification status",
        "View community votes and ratings",
        "See the model's IPFS hash for verification"
      ]
    },
    {
      icon: Upload,
      title: "Uploading Your Models",
      description: "Share your AI models with the community.",
      steps: [
        "Navigate to 'Upload' from the dashboard",
        "Select your model file (supported formats: .h5, .pt, .onnx, etc.)",
        "Fill in the model name, description, and category",
        "Set your pricing (free or paid in cryptocurrency)",
        "Submit for automatic trust score scanning",
        "Your model will be stored on IPFS for decentralized access"
      ]
    },
    {
      icon: Upload,
      title: "Uploading Datasets",
      description: "Contribute datasets to the VaultNet ecosystem.",
      steps: [
        "Go to 'Datasets' and click 'Upload Dataset'",
        "Choose your dataset file (CSV, JSON, or compressed formats)",
        "Provide a descriptive name and detailed description",
        "Select the appropriate category and add relevant tags",
        "Your dataset will be securely stored and cataloged"
      ]
    },
    {
      icon: ShoppingCart,
      title: "Purchasing Models",
      description: "Acquire premium models from the marketplace.",
      steps: [
        "Ensure your wallet is connected with sufficient funds",
        "Browse to the model you want to purchase",
        "Click the 'Purchase' or 'Buy' button",
        "Confirm the transaction in your wallet",
        "Wait for blockchain confirmation",
        "Access your purchased model from your dashboard"
      ]
    },
    {
      icon: Download,
      title: "Downloading Content",
      description: "Download models and datasets you have access to.",
      steps: [
        "Navigate to the model or dataset details page",
        "Click the 'Download' button",
        "For purchased content, download directly",
        "For free content, download is immediately available",
        "Files are retrieved from IPFS ensuring integrity"
      ]
    },
    {
      icon: ThumbsUp,
      title: "Voting & Community Engagement",
      description: "Help improve the platform through community voting.",
      steps: [
        "Sign in to your account to vote",
        "Navigate to any model's detail page",
        "Use the upvote/downvote buttons to rate quality",
        "Your vote contributes to the model's overall score",
        "Votes are recorded on the blockchain for transparency"
      ]
    },
    {
      icon: Shield,
      title: "Understanding Trust Scores",
      description: "Learn how VaultNet ensures model quality and safety.",
      steps: [
        "Trust scores range from 0-100",
        "Scores are calculated based on multiple factors",
        "Higher scores indicate better security and authenticity",
        "Factors include: structure integrity, vulnerability scans, community votes",
        "Look for the shield badge indicating verification status"
      ]
    },
    {
      icon: Settings,
      title: "Managing Your Profile",
      description: "Customize your VaultNet experience.",
      steps: [
        "Access your profile from the user menu",
        "Update your display name and avatar",
        "View your uploaded models and datasets",
        "Track your purchase history",
        "Manage wallet connections and preferences"
      ]
    }
  ];

  const faqs = [
    {
      question: "What file formats are supported for model uploads?",
      answer: "VaultNet supports various model formats including .h5 (Keras), .pt/.pth (PyTorch), .onnx (ONNX), .pkl (Pickle), .safetensors, and more. We recommend using standard formats for better compatibility."
    },
    {
      question: "How is the Trust Score calculated?",
      answer: "The Trust Score is calculated using multiple factors: model structure integrity, security vulnerability scans, community votes, creator reputation, and verification status. Each factor contributes to the overall score out of 100."
    },
    {
      question: "What cryptocurrencies are accepted for purchases?",
      answer: "Currently, VaultNet primarily supports Ethereum (ETH) for transactions. Connect your MetaMask or compatible wallet to make purchases on the platform."
    },
    {
      question: "How does IPFS storage work?",
      answer: "When you upload a model, it's stored on IPFS (InterPlanetary File System), a decentralized storage network. This ensures your content is tamper-proof, always available, and verifiable through its unique content hash (CID)."
    },
    {
      question: "Can I update my uploaded model after publishing?",
      answer: "Yes, you can upload new versions of your model. Each version gets a unique IPFS hash, maintaining version history and allowing users to access previous versions if needed."
    },
    {
      question: "How do I report a malicious or problematic model?",
      answer: "If you encounter a model that violates our guidelines or appears malicious, use the report feature on the model's detail page. Our team reviews all reports and takes appropriate action."
    },
    {
      question: "Is my data secure on VaultNet?",
      answer: "Yes, VaultNet uses blockchain technology for transaction verification, IPFS for decentralized storage, and cryptographic signing for authenticity. Your uploads are encrypted and your private keys remain in your control."
    },
    {
      question: "What happens if I lose access to my wallet?",
      answer: "Your wallet is independent of VaultNet. If you lose access, use your wallet's recovery phrase. Your account and free downloads remain accessible via email login, but purchased content may require wallet verification."
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
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">User Guide</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How to Use <span className="text-primary">VaultNet</span>
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Complete guide to help you navigate and make the most of our decentralized AI platform
          </p>
        </div>

        {/* Instructions Grid */}
        <ScrollArea className="h-[70vh] pr-4">
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
          <div className="mt-16 mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              Frequently Asked Questions
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

          {/* Quick Tips */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Quick Tips for Success
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-foreground/70 text-sm">Always verify the trust score before downloading any model</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-foreground/70 text-sm">Keep your wallet recovery phrase in a secure location</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-foreground/70 text-sm">Write detailed descriptions for your uploads to increase visibility</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-foreground/70 text-sm">Engage with the community by voting on quality models</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-foreground/70 text-sm">Use specific tags and categories for better discoverability</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-foreground/70 text-sm">Check for updates and new features regularly</p>
              </div>
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
