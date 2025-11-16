import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Download, Edit, Trash2, History } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getWalletAddress } from '@/lib/web3';
import { mockModels } from '@/data/mockData';

const Dashboard = () => {
  const { toast } = useToast();
  const walletAddress = getWalletAddress();

  // Mock data - in real app, filter by connected wallet
  const myUploadedModels = mockModels.slice(0, 3);
  const myPurchasedModels = mockModels.slice(3, 6);

  const handleUpdateVersion = (modelId: number) => {
    toast({
      title: 'Update Version',
      description: 'This feature will allow you to upload a new version of your model',
    });
  };

  const handleDelete = (modelId: number) => {
    toast({
      title: 'Delete Model',
      description: 'This feature will remove your model from the marketplace',
      variant: 'destructive',
    });
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your models and purchases
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uploaded Models</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myUploadedModels.length}</div>
              <p className="text-xs text-muted-foreground">Total models uploaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchased Models</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myPurchasedModels.length}</div>
              <p className="text-xs text-muted-foreground">Models you have access to</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myUploadedModels.reduce((sum, model) => sum + model.downloads, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all your models</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="uploaded" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="uploaded">My Uploaded Models</TabsTrigger>
            <TabsTrigger value="purchased">My Purchases</TabsTrigger>
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
                            <CardTitle>{model.name}</CardTitle>
                            <Badge variant="secondary">{model.category}</Badge>
                          </div>
                          <CardDescription>{model.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">{model.price} ETH</div>
                          <div className="text-sm text-muted-foreground">{model.downloads} downloads</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Link to={`/model/${model.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleUpdateVersion(model.id)}
                        >
                          <History className="w-4 h-4" />
                          Update Version
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleDelete(model.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
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
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Models Yet</h3>
                  <p className="text-muted-foreground mb-4 text-center">
                    You haven't uploaded any models yet
                  </p>
                  <Link to="/upload">
                    <Button>Upload Your First Model</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Purchased Models */}
          <TabsContent value="purchased" className="mt-6">
            {myPurchasedModels.length > 0 ? (
              <div className="grid gap-6">
                {myPurchasedModels.map(model => (
                  <Card key={model.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle>{model.name}</CardTitle>
                            <Badge variant="secondary">{model.category}</Badge>
                          </div>
                          <CardDescription>
                            by <span className="font-mono">{formatAddress(model.uploader)}</span>
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Access Granted
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{model.description}</p>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <Link to={`/model/${model.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button variant="default" size="sm" className="gap-2">
                          <Download className="w-4 h-4" />
                          Download Model
                        </Button>
                      </div>

                      <div className="p-3 bg-muted/50 rounded">
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
                  <h3 className="text-lg font-semibold mb-2">No Purchases Yet</h3>
                  <p className="text-muted-foreground mb-4 text-center">
                    You haven't purchased any models yet
                  </p>
                  <Link to="/marketplace">
                    <Button>Browse Marketplace</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
