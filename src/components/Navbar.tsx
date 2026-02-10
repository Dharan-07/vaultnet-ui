import { Link } from 'react-router-dom';
import { Search, Upload, LayoutDashboard, LogOut, User } from 'lucide-react';
import { Button } from './ui/button';
import { WalletButton } from './WalletButton';
import Logo from '@/assets/vn_logo.svg';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const Navbar = () => {
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <nav className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 border-border/50 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Title only, logo removed */}
          <Link to="/" className="flex items-center group">
            <span className="font-bold text-xl group-hover:text-primary transition-all duration-300 ease-smooth">
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
            {isAuthenticated && (
              <>
                <Link to="/marketplace">
                  <Button variant="ghost" className="gap-2">
                    Models
                  </Button>
                </Link>
                <Link to="/datasets">
                  <Button variant="ghost" className="gap-2">
                    Datasets
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
              </>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <WalletButton />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-sm">
                      <div className="font-medium">{user?.name}</div>
                      <div className="text-xs text-muted-foreground">{user?.email}</div>
                    </div>
                    <DropdownMenuSeparator />
                    <Link to="/profile">
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/dashboard">
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
