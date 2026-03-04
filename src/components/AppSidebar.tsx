import { Upload, Search, LayoutDashboard, Database, Box } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import Logo from '@/assets/vn_logo.png';
import { Link } from 'react-router-dom';

const navItems = [
  { title: 'Models', url: '/marketplace', icon: Box },
  { title: 'Datasets', url: '/datasets', icon: Database },
  { title: 'Upload', url: '/upload', icon: Upload },
  { title: 'Find Users', url: '/search-users', icon: Search },
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <Sidebar collapsible="icon" className="border-r-3 border-foreground">
      <SidebarHeader className="border-b-3 border-foreground p-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={Logo} alt="VaultNet" className="h-8 w-8" />
          {!collapsed && (
            <span className="font-bold text-lg font-mono uppercase tracking-tight">
              VaultNet
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono uppercase text-xs tracking-widest">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-bold"
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
