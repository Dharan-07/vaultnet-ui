import { useState, useEffect } from 'react';
import { User, Wallet, Mail, Calendar, Shield, ExternalLink, Copy, Check } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletAddress, getBalance, connectWallet } from '@/lib/web3';
import { useOnChainModels } from '@/hooks/useOnChainModels';

const Profile = () => {
  const { toast } = useToast();
  const { user, disconnectWallet, connectWallet: authConnectWallet } = useAuth();
  const walletAddress = getWalletAddress();
  const { models, loading: isLoading } = useOnChainModels();
  
  const [balance, setBalance] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const address = await connectWallet();
      await authConnectWallet(address);
      const bal = await getBalance();
      setBalance(bal);
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
      setBalance(null);
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied',
        description: 'Wallet address copied to clipboard',
      });
    }
  };

  const myModels = models.filter(
    m => walletAddress && m.uploader.toLowerCase() === walletAddress.toLowerCase()
  );

  const totalValue = myModels.reduce((sum, m) => sum + parseFloat(m.price || '0'), 0);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className={`mb-8 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your account and wallet connection
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className={`md:col-span-2 transition-all duration-1000 delay-100 hover:shadow-lg hover:-translate-y-1 cursor-default ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user?.name || 'Anonymous'}</h3>
                    <p className="text-muted-foreground">{user?.email || 'No email'}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user?.email || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium">VaultNet User</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Account Status</p>
                      <Badge variant="secondary" className="mt-1">Verified</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className={`transition-all duration-1000 delay-200 hover:shadow-lg hover:-translate-y-1 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { value: myModels.length, label: 'Models Uploaded' },
                  { value: totalValue.toFixed(3), label: 'Total Value (ETH)' },
                  { value: models.length, label: 'On-Chain Models' },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="text-center p-4 bg-muted/50 rounded-lg cursor-pointer transition-all duration-300 hover:bg-muted hover:shadow-md hover:scale-105"
                    onMouseEnter={() => setHoveredStat(idx)}
                    onMouseLeave={() => setHoveredStat(null)}
                  >
                    <p className={`transition-all duration-300 ${
                      hoveredStat === idx ? 'text-3xl font-bold text-primary' : 'text-3xl font-bold'
                    }`}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Wallet Card */}
            <Card className={`md:col-span-3 transition-all duration-1000 delay-300 hover:shadow-lg hover:-translate-y-1 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Wallet Connection
                </CardTitle>
                <CardDescription>
                  Connect your Ethereum wallet to upload and purchase models
                </CardDescription>
              </CardHeader>
              <CardContent>
                {walletAddress ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Connected Wallet</p>
                          <p className="font-mono text-sm">{walletAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={copyAddress}>
                          {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <a 
                          href={`https://sepolia.etherscan.io/address/${walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>
                    </div>

                    {balance && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Balance</p>
                        <p className="text-2xl font-bold">{parseFloat(balance).toFixed(4)} ETH</p>
                        <p className="text-xs text-muted-foreground mt-1">Sepolia Testnet</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={async () => {
                        try {
                          const bal = await getBalance();
                          setBalance(bal);
                        } catch (e) {}
                      }}>
                        Refresh Balance
                      </Button>
                      <Button variant="destructive" onClick={handleDisconnectWallet}>
                        Disconnect Wallet
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Wallet Connected</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect your MetaMask wallet to interact with VaultNet
                    </p>
                    <Button onClick={handleConnectWallet} disabled={isConnecting}>
                      {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Network Info */}
            <Card className={`md:col-span-3 transition-all duration-1000 delay-400 hover:shadow-lg hover:-translate-y-1 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <CardHeader>
                <CardTitle>Network Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Network</p>
                    <p className="font-medium">Sepolia Testnet</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Chain ID</p>
                    <p className="font-medium">11155111</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Contract</p>
                    <a 
                      href="https://sepolia.etherscan.io/address/0x90DCb7bAA3c1D67eCF0B40B892D4198BC0c1E024"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-primary hover:underline"
                    >
                      0x90DC...1E024
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;