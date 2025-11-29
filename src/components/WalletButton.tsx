import { useState, useEffect } from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { connectWallet as web3ConnectWallet, getBalance } from '@/lib/web3';
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
    // Fetch balance if wallet is connected
    const fetchBalance = async () => {
      if (user?.walletAddress) {
        try {
          const bal = await getBalance();
          setBalance(bal);
        } catch (error) {
          console.error('Error fetching balance:', error);
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
        className="gap-2"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">{formatAddress(user.walletAddress)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-sm">
          <div className="text-muted-foreground">Address</div>
          <div className="font-mono text-xs">{user.walletAddress}</div>
        </div>
        <div className="px-2 py-1.5 text-sm">
          <div className="text-muted-foreground">Balance</div>
          <div className="font-semibold">{formatBalance(balance)} ETH</div>
        </div>
        <div className="px-2 py-1.5 text-sm">
          <div className="text-muted-foreground">Network</div>
          <div className="font-medium">Sepolia</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="gap-2 cursor-pointer">
          <LogOut className="w-4 h-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
