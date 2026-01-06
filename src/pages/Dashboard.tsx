import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Download, History, Trash2, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletAddress, getAllModels, ModelData, updateModel } from '@/lib/web3';
import { fetchMetadataFromIPFS, downloadFromIPFS, getIPFSUrl, ModelMetadata } from '@/lib/ipfs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardSkeleton } from '@/components/skeletons/PageSkeletons';

interface EnrichedModel extends ModelData {
  metadata?: ModelMetadata;
}

const Dashboard = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const walletAddress = getWalletAddress();
  
  const [isLoading, setIsLoading] = useState(true);
  const [myUploadedModels, setMyUploadedModels] = useState<EnrichedModel[]>([]);
  const [allModels, setAllModels] = useState<EnrichedModel[]>([]);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [newCid, setNewCid] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const models = await getAllModels();
      
      // Enrich models with IPFS metadata
      const enrichedModels = await Promise.all(
        models.map(async (model) => {
          const metadata = await fetchMetadataFromIPFS(model.cid);
          return { ...model, metadata };
        })
      );
      
      setAllModels(enrichedModels);
      
      // Filter models uploaded by current wallet
      if (walletAddress) {
        const myModels = enrichedModels.filter(
          m => m.uploader.toLowerCase() === walletAddress.toLowerCase()
        );
        setMyUploadedModels(myModels);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch models from blockchain',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [walletAddress]);

  if (pageLoading) {
    return <DashboardSkeleton />;
  }

  const handleUpdateVersion = async () => {
    if (!selectedModelId || !newCid) return;
    
    setIsUpdating(true);
    try {
      const result = await updateModel(selectedModelId, newCid);
      
      if (result.success) {
        toast({
          title: 'Model Updated',
          description: `Transaction: ${result.txHash?.slice(0, 10)}...`,
        });
        setUpdateDialogOpen(false);
        setNewCid('');
        fetchModels(); // Refresh models
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownload = async (model: EnrichedModel) => {
    try {
      const filename = model.metadata?.name 
        ? `${model.metadata.name.replace(/\s+/g, '_')}.zip`
        : `model_${model.id}.zip`;
      
      // If metadata has fileCid, download the actual file
      const cidToDownload = model.metadata?.fileCid || model.cid;
      await downloadFromIPFS(cidToDownload, filename);
      
      toast({
        title: 'Download Started',
        description: `Downloading ${filename}`,
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download model from IPFS',
        variant: 'destructive',
      });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!walletAddress) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>
                Please connect your wallet to view your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your dashboard shows your uploaded models and purchased models. Connect your wallet to get started.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your on-chain models • {formatAddress(walletAddress)}
            </p>
          </div>
          <Button variant="outline" onClick={fetchModels} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Uploaded Models</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myUploadedModels.length}</div>
              <p className="text-xs text-muted-foreground">On-chain models you uploaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total On-Chain</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allModels.length}</div>
              <p className="text-xs text-muted-foreground">Models on the blockchain</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <span className="text-muted-foreground font-mono text-sm">ETH</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myUploadedModels.reduce((sum, m) => sum + parseFloat(m.price || '0'), 0).toFixed(3)}
              </div>
              <p className="text-xs text-muted-foreground">Combined price of your models</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading on-chain models...</span>
          </div>
        ) : (
          <Tabs defaultValue="uploaded" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="uploaded">My Uploaded Models</TabsTrigger>
              <TabsTrigger value="all">All On-Chain Models</TabsTrigger>
            </TabsList>

            {/* Uploaded Models */}
            <TabsContent value="uploaded" className="mt-6">
              {myUploadedModels.length > 0 ? (
                <div className="grid gap-6">
                  {myUploadedModels.map(model => (
                    <Card key={model.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle>{model.metadata?.name || `Model #${model.id}`}</CardTitle>
                              <Badge variant="secondary">{model.metadata?.category || 'Uncategorized'}</Badge>
                              <Badge variant="outline">v{model.version}</Badge>
                            </div>
                            <CardDescription>
                              {model.metadata?.description || 'No description available'}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">{model.price} ETH</div>
                            <div className="text-sm text-muted-foreground">
                              {model.metadata?.fileSize || 'Unknown size'}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/model/${model.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                          <Dialog open={updateDialogOpen && selectedModelId === model.id} onOpenChange={setUpdateDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2"
                                onClick={() => setSelectedModelId(model.id)}
                              >
                                <History className="w-4 h-4" />
                                Update Version
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Model Version</DialogTitle>
                                <DialogDescription>
                                  Upload a new version by providing a new IPFS CID
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Current CID</Label>
                                  <code className="text-xs font-mono block p-2 bg-muted rounded break-all">
                                    {model.cid}
                                  </code>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="newCid">New CID</Label>
                                  <Input
                                    id="newCid"
                                    placeholder="Qm..."
                                    value={newCid}
                                    onChange={(e) => setNewCid(e.target.value)}
                                  />
                                </div>
                                <Button 
                                  onClick={handleUpdateVersion}
                                  disabled={!newCid || isUpdating}
                                  className="w-full"
                                >
                                  {isUpdating ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    'Update on Blockchain'
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => handleDownload(model)}
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                          <a 
                            href={getIPFSUrl(model.cid)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm" className="gap-2">
                              <ExternalLink className="w-4 h-4" />
                              View on IPFS
                            </Button>
                          </a>
                        </div>

                        {model.metadata?.tags && model.metadata.tags.length > 0 && (
                          <div className="mt-4 flex gap-2 flex-wrap">
                            {model.metadata.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 p-3 bg-muted/50 rounded">
                          <div className="text-sm font-medium mb-1">IPFS CID (Metadata)</div>
                          <code className="text-xs font-mono break-all">{model.cid}</code>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Models Yet</h3>
                    <p className="text-muted-foreground mb-4 text-center">
                      You haven't uploaded any models to the blockchain yet
                    </p>
                    <Link to="/upload">
                      <Button>Upload Your First Model</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* All On-Chain Models */}
            <TabsContent value="all" className="mt-6">
              {allModels.length > 0 ? (
                <div className="grid gap-6">
                  {allModels.map(model => (
                    <Card key={model.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle>{model.metadata?.name || `Model #${model.id}`}</CardTitle>
                              <Badge variant="secondary">{model.metadata?.category || 'Uncategorized'}</Badge>
                              {model.uploader.toLowerCase() === walletAddress?.toLowerCase() && (
                                <Badge variant="default">Your Model</Badge>
                              )}
                            </div>
                            <CardDescription>
                              by <span className="font-mono">{formatAddress(model.uploader)}</span>
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">{model.price} ETH</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {model.metadata?.description || 'No description available'}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <Link to={`/model/${model.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>

                        <div className="mt-4 p-3 bg-muted/50 rounded">
                          <div className="text-sm font-medium mb-1">IPFS CID</div>
                          <code className="text-xs font-mono break-all">{model.cid}</code>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Download className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No On-Chain Models</h3>
                    <p className="text-muted-foreground mb-4 text-center">
                      No models have been uploaded to the blockchain yet
                    </p>
                    <Link to="/upload">
                      <Button>Be the First to Upload</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;