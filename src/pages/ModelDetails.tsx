import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, ShoppingCart, ExternalLink, Copy, Check, Loader2, LinkIcon } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getModelById } from '@/data/mockData';
import { buyModelAccess, getWalletAddress, getModel, ModelData } from '@/lib/web3';
import { downloadFromIPFS, getIPFSUrl, fetchMetadataFromIPFS } from '@/lib/ipfs';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { VotingButtons } from '@/components/VotingButtons';

interface DisplayModel {
  id: number;
  name: string;
  description: string;
  uploader: string;
  price: string;
  cid: string;
  versionCount: number;
  downloads: number;
  category: string;
  uploadDate: string;
  tags: string[];
  onChain: boolean;
}

const ModelDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [isBuying, setIsBuying] = useState(false);
  const [copiedCid, setCopiedCid] = useState(false);
  const [hasModelAccess, setHasModelAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<DisplayModel | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredTag, setHoveredTag] = useState<number | null>(null);

  useEffect(() => {
    const fetchModel = async () => {
      setLoading(true);
      const modelId = Number(id);
      
      // First try to get from on-chain
      try {
        const onChainModel = await getModel(modelId);
        if (onChainModel) {
          // Try to fetch metadata from IPFS
          const metadata = await fetchMetadataFromIPFS(onChainModel.cid).catch(() => null);
          
          setModel({
            id: onChainModel.id,
            name: metadata?.name || `Model #${onChainModel.id}`,
            description: metadata?.description || "On-chain AI model stored on IPFS",
            uploader: onChainModel.uploader,
            price: onChainModel.price,
            cid: onChainModel.cid,
            versionCount: onChainModel.version,
            downloads: 0,
            category: metadata?.category || "AI/ML",
            uploadDate: metadata?.uploadDate || new Date().toISOString(),
            tags: metadata?.tags || ["on-chain", "verified", "ipfs"],
            onChain: true,
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log("Model not found on-chain, checking mock data");
      }
      
      // Fall back to mock data
      const mockModel = getModelById(modelId);
      if (mockModel) {
        setModel({ ...mockModel, onChain: false });
      }
      setLoading(false);
    };

    fetchModel();
    setIsLoaded(true);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3">Loading model...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Model Not Found</h1>
            <p className="text-muted-foreground">The model you're looking for doesn't exist.</p>
            <Link to="/marketplace">
              <Button>Browse Models</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const mockVersions = [
    { version: `v${model.versionCount}.0.0`, cid: model.cid, date: model.uploadDate, changes: 'Latest stable release' },
    ...(model.versionCount > 1 ? [{ version: `v${model.versionCount - 1}.0.0`, cid: 'QmPreviousCID...', date: '2024-01-10', changes: 'Previous version' }] : []),
  ];

  const handleBuyAccess = async () => {
    const walletAddress = getWalletAddress();
    if (!walletAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to purchase model access',
        variant: 'destructive',
      });
      return;
    }

    setIsBuying(true);
    try {
      const result = await buyModelAccess(model.id);
      if (result.success) {
        setHasModelAccess(true);
        toast({
          title: 'Purchase Successful!',
          description: `You now have access to ${model.name}. Transaction: ${result.txHash?.slice(0, 10)}...`,
        });
      } else {
        toast({
          title: 'Purchase Failed',
          description: result.error || 'Failed to purchase model access',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsBuying(false);
    }
  };

  const handleDownload = async () => {
    if (!hasModelAccess && model.onChain) {
      toast({
        title: 'Access Required',
        description: 'Please purchase access to download this model',
        variant: 'destructive',
      });
      return;
    }

    try {
      await downloadFromIPFS(model.cid, `${model.name}.zip`);
      toast({
        title: 'Download Started',
        description: 'Your model download has begun',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download model from IPFS',
        variant: 'destructive',
      });
    }
  };

  const copyCid = () => {
    navigator.clipboard.writeText(model.cid);
    setCopiedCid(true);
    setTimeout(() => setCopiedCid(false), 2000);
    toast({
      title: 'CID Copied',
      description: 'IPFS CID copied to clipboard',
    });
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-background/95">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className={`mb-8 transition-all duration-1000 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-4xl font-bold">{model.name}</h1>
                <Badge className="hover:shadow-md transition-all duration-300">{model.category}</Badge>
                {model.onChain && (
                  <Badge variant="secondary" className="gap-1 animate-pulse">
                    <LinkIcon className="w-3 h-3" />
                    On-Chain
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                by <span className="font-mono hover:text-primary transition-colors cursor-pointer">{formatAddress(model.uploader)}</span>
              </p>
            </div>
            <div className={`text-right transition-all duration-700 delay-100 ${
              isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
            }`}>
              <div className="text-3xl font-bold text-primary">{model.price} ETH</div>
              <p className="text-sm text-muted-foreground">{model.downloads} downloads</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {model.tags.map((tag, idx) => (
              <Badge 
                key={idx} 
                variant="outline"
                className={`cursor-pointer transition-all duration-300 ${
                  hoveredTag === idx ? 'bg-primary/20 border-primary scale-110' : 'hover:bg-primary/10'
                }`}
                onMouseEnter={() => setHoveredTag(idx)}
                onMouseLeave={() => setHoveredTag(null)}
              >
                {tag}
              </Badge>
            ))}
          </div>

          <div className={`flex gap-3 transition-all duration-700 delay-200 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            {model.onChain ? (
              <Button size="lg" onClick={handleBuyAccess} disabled={isBuying || hasModelAccess} className="gap-2 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <ShoppingCart className="w-5 h-5" />
                {hasModelAccess ? 'Access Granted' : isBuying ? 'Processing...' : `Buy Access (${model.price} ETH)`}
              </Button>
            ) : (
              <Button size="lg" disabled className="gap-2">
                <ShoppingCart className="w-5 h-5" />
                Demo Model
              </Button>
            )}
            <Button size="lg" variant="secondary" onClick={handleDownload} className="gap-2 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <Download className="w-5 h-5" />
              Download
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className={`lg:col-span-2 space-y-8 transition-all duration-1000 delay-300 ${
            isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
          }`}>
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{model.description}</p>
              </CardContent>
            </Card>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details" className="transition-all duration-300">Model Details</TabsTrigger>
                <TabsTrigger value="versions" className="transition-all duration-300">Version History</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle>IPFS Information</CardTitle>
                    <CardDescription>Model stored on IPFS via Pinata</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Content ID (CID)</div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-muted rounded font-mono text-sm break-all hover:bg-muted/80 transition-colors cursor-pointer">
                          {model.cid}
                        </code>
                        <Button size="icon" variant="outline" onClick={copyCid} className="transition-all duration-300 hover:shadow-md">
                          {copiedCid ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button size="icon" variant="outline" asChild className="transition-all duration-300 hover:shadow-md">
                          <a href={getIPFSUrl(model.cid)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                        <div className="text-sm text-muted-foreground">Upload Date</div>
                        <div className="font-medium">{new Date(model.uploadDate).toLocaleDateString()}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                        <div className="text-sm text-muted-foreground">Versions</div>
                        <div className="font-medium">{model.versionCount}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="versions" className="mt-6">
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Version History</CardTitle>
                    <CardDescription>All versions of this model</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockVersions.map((version, idx) => (
                        <div 
                          key={idx} 
                          className={`border-l-2 border-primary pl-4 pb-4 last:pb-0 p-3 rounded-r-lg transition-all duration-300 hover:bg-muted/50 cursor-default ${
                            idx === 0 ? 'bg-muted/30' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{version.version}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(version.date).toLocaleDateString()}
                            </span>
                          </div>
                          <code className="text-xs text-muted-foreground font-mono block mb-2">
                            {version.cid}
                          </code>
                          <p className="text-sm">{version.changes}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className={`lg:col-span-1 space-y-6 transition-all duration-1000 delay-400 ${
            isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
          }`}>
            {/* Trust Score Card */}
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <CardTitle>Security & Trust</CardTitle>
              </CardHeader>
              <CardContent>
                <TrustScoreBadge 
                  modelId={model.id} 
                  modelName={model.name} 
                  cid={model.cid} 
                  showDetails 
                />
              </CardContent>
            </Card>

            {/* Voting Card */}
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <CardTitle>Community Rating</CardTitle>
                <CardDescription>Vote to help others discover quality models</CardDescription>
              </CardHeader>
              <CardContent>
                <VotingButtons modelId={model.id} />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <CardTitle>Model Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                  <span className="text-muted-foreground">Downloads</span>
                  <span className="font-semibold">{model.downloads}</span>
                </div>
                <div className="flex justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                  <span className="text-muted-foreground">Versions</span>
                  <span className="font-semibold">{model.versionCount}</span>
                </div>
                <div className="flex justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="secondary">{model.category}</Badge>
                </div>
                <div className="flex justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold text-primary">{model.price} ETH</span>
                </div>
                <div className="flex justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                  <span className="text-muted-foreground">Storage</span>
                  <Badge variant="outline">{model.onChain ? 'On-Chain + IPFS' : 'IPFS'}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <CardTitle>Uploader</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-mono text-sm break-all p-2 rounded bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer">{model.uploader}</div>
                  <Button variant="outline" size="sm" className="w-full transition-all duration-300 hover:shadow-md" asChild>
                    <a 
                      href={`https://sepolia.etherscan.io/address/${model.uploader}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      View on Etherscan
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
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

export default ModelDetails;
