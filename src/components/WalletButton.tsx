import { useState, useEffect } from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { connectWallet as web3ConnectWallet, getBalance, tryReconnectWallet } from '@/lib/web3';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const WalletButton = () => {
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, user, connectWallet, disconnectWallet } = useAuth();

  useEffect(() => {
    const fetchBalance = async () => {
      if (user?.walletAddress) {
        try {
          // Try to silently reconnect before fetching balance
          const reconnected = await tryReconnectWallet();
          if (reconnected) {
            const bal = await getBalance();
            setBalance(bal);
          }
        } catch (error) {
          // Silently fail - user can manually reconnect
          console.debug('Could not auto-reconnect wallet:', error);
        }
      }
    };
    fetchBalance();
  }, [user?.walletAddress]);

  const handleConnect = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Connect via Web3
      const addr = await web3ConnectWallet();

      // Save to Firestore
      await connectWallet(addr);

      const bal = await getBalance();
      setBalance(bal);

      toast({
        title: 'Wallet Connected',
        description: `Connected to ${addr.slice(0, 6)}...${addr.slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setBalance('0');
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect wallet',
        variant: 'destructive',
      });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string) => {
    return parseFloat(bal).toFixed(4);
  };

  if (!user?.walletAddress) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="gap-1 md:gap-2 text-xs md:text-sm"
        size="sm"
      >
        <Wallet className="w-3 md:w-4 h-3 md:h-4" />
        <span className="hidden sm:inline">{isConnecting ? 'Connecting...' : 'Connect'}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1 md:gap-2 text-xs md:text-sm" size="sm">
          <Wallet className="w-3 md:w-4 h-3 md:h-4" />
          <span className="hidden md:inline">{formatAddress(user.walletAddress)}</span>
          <span className="md:hidden">{user.walletAddress.slice(0, 4)}...</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 md:w-56">
        <DropdownMenuLabel className="text-xs md:text-sm">My Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs md:text-sm">
          <div className="text-muted-foreground text-xs">Address</div>
          <div className="font-mono text-xs break-all">{user.walletAddress}</div>
        </div>
        <div className="px-2 py-1.5 text-xs md:text-sm">
          <div className="text-muted-foreground text-xs">Balance</div>
          <div className="font-semibold">{formatBalance(balance)} ETH</div>
        </div>
        <div className="px-2 py-1.5 text-xs md:text-sm">
          <div className="text-muted-foreground text-xs">Network</div>
          <div className="font-medium">Sepolia</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="gap-2 cursor-pointer text-xs md:text-sm">
          <LogOut className="w-3 md:w-4 h-3 md:h-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
