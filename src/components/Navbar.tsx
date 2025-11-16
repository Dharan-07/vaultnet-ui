import { Link } from 'react-router-dom';
import { Search, Upload, Package, LayoutDashboard, Wallet } from 'lucide-react';
import { Button } from './ui/button';
import { WalletButton } from './WalletButton';

export const Navbar = () => {
  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl group-hover:text-primary transition-colors">
              VaultNet
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/">
              <Button variant="ghost" className="gap-2">
                <Search className="w-4 h-4" />
                Explore
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="ghost" className="gap-2">
                <Package className="w-4 h-4" />
                Models
              </Button>
            </Link>
            <Link to="/upload">
              <Button variant="ghost" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>

          {/* Wallet Button */}
          <WalletButton />
        </div>
      </div>
    </nav>
  );
};
