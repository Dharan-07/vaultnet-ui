import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, LayoutDashboard, PanelLeft, Upload, Search, Database, Box, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { WalletButton } from './WalletButton';
import Logo from '@/assets/vn_logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
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
  { title: 'Messages', url: '/messages', icon: MessageSquare },
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
];

export const Navbar = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <nav className="border-b-3 border-foreground bg-card sticky top-0 z-50 shadow-[0_4px_0px_hsl(var(--foreground))]">
      <div className="w-full px-3 md:px-4">
        <div className="flex items-center justify-between h-16 gap-2">
          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0">
              <ArrowLeft className="w-4 md:w-5 h-4 md:h-5" />
            </Button>
            <Link to="/" className="flex items-center gap-1 md:gap-2 group min-w-0">
              <img src={Logo} alt="VaultNet" className="h-7 md:h-8 w-7 md:w-8 flex-shrink-0" />
            </Link>
          </div>

          <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <PanelLeft className="w-4 md:w-5 h-4 md:h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 md:w-56 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
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
                      <User className="w-4 md:w-5 h-4 md:h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 md:w-56 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                    <DropdownMenuLabel className="font-mono uppercase text-xs">My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs md:text-sm">
                      <div className="font-bold truncate">{user?.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                    </div>
                    <DropdownMenuSeparator />
                    <Link to="/profile">
                      <DropdownMenuItem className="gap-2 cursor-pointer font-medium text-xs md:text-sm">
                        <User className="w-4 h-4" />
                        Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/dashboard">
                      <DropdownMenuItem className="gap-2 cursor-pointer font-medium text-xs md:text-sm">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive font-medium text-xs md:text-sm">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-1 md:gap-2">
                <Link to="/signin" className="hidden sm:block">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
