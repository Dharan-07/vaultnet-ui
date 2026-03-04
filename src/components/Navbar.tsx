import { Link } from 'react-router-dom';
import { LogOut, User, LayoutDashboard, PanelLeft, Upload, Search, Database, Box } from 'lucide-react';
import { Button } from './ui/button';
import { WalletButton } from './WalletButton';
import Logo from '@/assets/vn_logo.png';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const navItems = [
  { title: 'Models', url: '/marketplace', icon: Box },
  { title: 'Datasets', url: '/datasets', icon: Database },
  { title: 'Upload', url: '/upload', icon: Upload },
  { title: 'Find Users', url: '/search-users', icon: Search },
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
];

export const Navbar = () => {
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <nav className="border-b-3 border-foreground bg-card sticky top-0 z-50 shadow-[0_4px_0px_hsl(var(--foreground))]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={Logo} alt="VaultNet" className="h-8 w-8" />
            <span className="font-bold text-xl font-mono uppercase tracking-tight group-hover:text-primary transition-colors duration-150">
              VaultNet
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <PanelLeft className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                    <DropdownMenuLabel className="font-mono uppercase">Navigation</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {navItems.map((item) => (
                      <Link to={item.url} key={item.title}>
                        <DropdownMenuItem className="gap-2 cursor-pointer font-medium">
                          <item.icon className="w-4 h-4" />
                          {item.title}
                        </DropdownMenuItem>
                      </Link>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <WalletButton />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                    <DropdownMenuLabel className="font-mono uppercase">My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-sm">
                      <div className="font-bold">{user?.name}</div>
                      <div className="text-xs text-muted-foreground">{user?.email}</div>
                    </div>
                    <DropdownMenuSeparator />
                    <Link to="/profile">
                      <DropdownMenuItem className="gap-2 cursor-pointer font-medium">
                        <User className="w-4 h-4" />
                        Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/dashboard">
                      <DropdownMenuItem className="gap-2 cursor-pointer font-medium">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive font-medium">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/signin">
                  <Button variant="outline">Sign In</Button>
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
