import { useState, useEffect } from 'react';
import { User, Wallet, Mail, Calendar, Shield, ExternalLink, Copy, Check, Download, Package, ShoppingBag, Loader2 } from 'lucide-react';
import logger from '@/lib/logger';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletAddress, getBalance, connectWallet } from '@/lib/web3';
import { useOnChainModels } from '@/hooks/useOnChainModels';
import { supabase } from '@/integrations/supabase/client';
import { downloadFromIPFS } from '@/lib/ipfs';
import { Link } from 'react-router-dom';

interface PurchasedModel {
  id: string;
  model_id: number;
  model_cid: string;
  model_name: string;
  model_price: string;
  purchased_at: string;
}

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
  const [purchasedModels, setPurchasedModels] = useState<PurchasedModel[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Fetch purchased models
  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user?.id) {
        setLoadingPurchases(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .rpc('get_my_model_purchases');
        
        if (error) throw error;
        setPurchasedModels(data || []);
      } catch (error) {
        logger.error('Error fetching purchases:', error);
      } finally {
        setLoadingPurchases(false);
      }
    };
    
    fetchPurchases();
  }, [user?.id]);

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

  const handleDownload = async (cid: string, name: string, modelId: string) => {
    setDownloadingModel(modelId);
    try {
      await downloadFromIPFS(cid, `${name}.zip`);
      toast({
        title: 'Download Started',
        description: `Downloading ${name}...`,
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download model from IPFS',
        variant: 'destructive',
      });
    } finally {
      setDownloadingModel(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-5xl mx-auto">
          <div className={`mb-8 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your account, wallet, and models
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                  { value: purchasedModels.length, label: 'Models Purchased' },
                  { value: totalValue.toFixed(3), label: 'Total Value (ETH)' },
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
          </div>

          {/* Models Tabs */}
          <Card className={`mb-8 transition-all duration-1000 delay-250 hover:shadow-lg ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                My Models
              </CardTitle>
              <CardDescription>View and manage your uploaded and purchased models</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="uploaded" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="uploaded" className="gap-2">
                    <Package className="w-4 h-4" />
                    Uploaded ({myModels.length})
                  </TabsTrigger>
                  <TabsTrigger value="purchased" className="gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Purchased ({purchasedModels.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="uploaded">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2">Loading your models...</span>
                    </div>
                  ) : myModels.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Models Uploaded</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't uploaded any models yet
                      </p>
                      <Link to="/upload">
                        <Button>Upload Your First Model</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myModels.map((model) => (
                        <div
                          key={model.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/80 transition-all duration-300"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">Model #{model.id}</h4>
                              <Badge variant="secondary" className="text-xs">On-Chain</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground font-mono">
                              CID: {model.cid.slice(0, 20)}...
                            </p>
                            <p className="text-sm text-primary font-medium">{model.price} ETH</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(model.cid, `Model_${model.id}`, `upload-${model.id}`)}
                              disabled={downloadingModel === `upload-${model.id}`}
                              className="gap-1"
                            >
                              {downloadingModel === `upload-${model.id}` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                              Download
                            </Button>
                            <Link to={`/model/${model.id}`}>
                              <Button size="sm" variant="secondary">View</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="purchased">
                  {loadingPurchases ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2">Loading purchases...</span>
                    </div>
                  ) : purchasedModels.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Purchases Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't purchased any models yet
                      </p>
                      <Link to="/marketplace">
                        <Button>Browse Marketplace</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {purchasedModels.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/80 transition-all duration-300"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{purchase.model_name}</h4>
                              <Badge variant="outline" className="text-xs">Purchased</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground font-mono">
                              CID: {purchase.model_cid.slice(0, 20)}...
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-primary font-medium">{purchase.model_price} ETH</span>
                              <span className="text-muted-foreground">{formatDate(purchase.purchased_at)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(purchase.model_cid, purchase.model_name, purchase.id)}
                              disabled={downloadingModel === purchase.id}
                              className="gap-1"
                            >
                              {downloadingModel === purchase.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                              Download
                            </Button>
                            <Link to={`/model/${purchase.model_id}`}>
                              <Button size="sm" variant="secondary">View</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Wallet Card */}
          <Card className={`mb-8 transition-all duration-1000 delay-300 hover:shadow-lg hover:-translate-y-1 ${
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
          <Card className={`transition-all duration-1000 delay-400 hover:shadow-lg hover:-translate-y-1 ${
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

      <Footer />
    </div>
  );
};

export default Profile;