import { Github, Twitter, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '@/assets/vn_logo.png';

export const Footer = () => {
  return (
    <footer className="border-t-3 border-foreground bg-card mt-auto shadow-[0_-4px_0px_hsl(var(--foreground))]">
      <div className="w-full px-3 md:px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <div className="space-y-3 md:space-y-4 col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2">
              <img src={Logo} alt="VaultNet" className="h-7 md:h-8 w-7 md:w-8" />
              <span className="font-bold text-lg md:text-xl font-mono uppercase">VaultNet</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Decentralized AI Model & Dataset Repository powered by Web3 and IPFS
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2 md:mb-4 font-mono uppercase text-xs md:text-sm tracking-wider">Product</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link to="/marketplace" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  Explore Models
                </Link>
              </li>
              <li>
                <Link to="/datasets" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  Explore Datasets
                </Link>
              </li>
              <li>
                <Link to="/upload" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  Upload Model
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-2 md:mb-4 font-mono uppercase text-xs md:text-sm tracking-wider">Resources</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  Smart Contract
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-2 md:mb-4 font-mono uppercase text-xs md:text-sm tracking-wider">Community</h3>
            <div className="flex space-x-2 md:space-x-3">
              <a href="#" className="p-1.5 md:p-2 border-2 border-foreground rounded-md bg-background shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all duration-150">
                <Github className="w-4 md:w-5 h-4 md:h-5" />
              </a>
              <a href="#" className="p-1.5 md:p-2 border-2 border-foreground rounded-md bg-background shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all duration-150">
                <Twitter className="w-4 md:w-5 h-4 md:h-5" />
              </a>
              <a href="#" className="p-1.5 md:p-2 border-2 border-foreground rounded-md bg-background shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all duration-150">
                <FileText className="w-4 md:w-5 h-4 md:h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-foreground mt-6 md:mt-8 pt-6 md:pt-8 text-center text-xs md:text-sm text-muted-foreground font-mono">
          <p>© 2024 VAULTNET. BUILT ON ETHEREUM & IPFS.</p>
        </div>
      </div>
    </footer>
  );
};
