import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileUp, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletAddress, uploadModel } from '@/lib/web3';
import { uploadFileToIPFS, uploadMetadataToIPFS, ModelMetadata } from '@/lib/ipfs';
import { getCategories } from '@/data/mockData';

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    tags: '',
    version: '1.0.0',
    license: 'MIT',
    file: null as File | null,
  });

  const categories = getCategories();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.description || !formData.category || !formData.price || !formData.file) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields and select a file',
        variant: 'destructive',
      });
      return;
    }

    const walletAddress = getWalletAddress();
    if (!walletAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to upload a model',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload model file to IPFS
      setUploadStep('Uploading model file to IPFS...');
      toast({
        title: 'Step 1/3: Uploading Model File',
        description: 'Uploading your model to IPFS...',
      });
      setUploadProgress(10);

      let fileCid: string;
      try {
        fileCid = await uploadFileToIPFS(formData.file);
        setUploadProgress(30);
        console.log('Model file uploaded to IPFS:', fileCid);
      } catch (ipfsError: any) {
        const errorMsg = ipfsError.message || 'Unknown IPFS error';
        throw new Error(`IPFS Upload Failed: ${errorMsg}. Please check that Pinata API keys are configured correctly.`);
      }

      // Step 2: Create and upload metadata to IPFS
      setUploadStep('Uploading metadata to IPFS...');
      toast({
        title: 'Step 2/3: Uploading Metadata',
        description: 'Storing model metadata on IPFS...',
      });
      setUploadProgress(40);

      const metadata: ModelMetadata = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        version: formData.version,
        author: user?.name || walletAddress,
        license: formData.license,
        fileSize: `${(formData.file.size / 1024 / 1024).toFixed(2)} MB`,
        uploadDate: new Date().toISOString(),
        fileCid: fileCid, // Reference to the actual model file
      };

      let metadataCid: string;
      try {
        metadataCid = await uploadMetadataToIPFS(metadata);
        setUploadProgress(60);
        console.log('Metadata uploaded to IPFS:', metadataCid);
      } catch (metaError: any) {
        const errorMsg = metaError.message || 'Unknown metadata error';
        throw new Error(`Metadata Upload Failed: ${errorMsg}. The model file was uploaded but metadata storage failed.`);
      }

      // Step 3: Store on blockchain
      setUploadStep('Recording on blockchain...');
      toast({
        title: 'Step 3/3: Blockchain Transaction',
        description: 'Please confirm the transaction in your wallet...',
      });
      setUploadProgress(70);

      const result = await uploadModel(metadataCid, formData.price);
      setUploadProgress(90);

      if (result.success) {
        setUploadProgress(100);
        setUploadStep('Upload complete!');
        toast({
          title: 'Upload Successful!',
          description: `Model ID: ${result.modelId} | TX: ${result.txHash?.slice(0, 10)}...`,
        });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        // Parse blockchain-specific errors
        let blockchainError = result.error || 'Transaction failed';
        if (blockchainError.includes('user rejected')) {
          blockchainError = 'Transaction Rejected: You cancelled the transaction in MetaMask.';
        } else if (blockchainError.includes('insufficient funds')) {
          blockchainError = 'Insufficient Funds: Your wallet does not have enough ETH to cover gas fees.';
        } else if (blockchainError.includes('nonce')) {
          blockchainError = 'Transaction Error: Please reset your MetaMask transaction nonce or try again.';
        }
        throw new Error(blockchainError);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'An unexpected error occurred during upload',
        variant: 'destructive',
      });
      setUploadProgress(0);
      setUploadStep('');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Upload Model</h1>
            <p className="text-muted-foreground">
              Share your AI model with the VaultNet community
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Model Information</CardTitle>
              <CardDescription>
                Provide details about your AI model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Model Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Model Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., GPT-Style Language Model"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={isUploading}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your model's capabilities, training data, and use cases..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    disabled={isUploading}
                  />
                </div>

                {/* Category and Version Row */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      disabled={isUploading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      placeholder="1.0.0"
                      value={formData.version}
                      onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                      disabled={isUploading}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., NLP, transformer, text-generation"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    disabled={isUploading}
                  />
                </div>

                {/* Price and License Row */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (ETH) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.05"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      disabled={isUploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license">License</Label>
                    <Select
                      value={formData.license}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, license: value }))}
                      disabled={isUploading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select license" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MIT">MIT</SelectItem>
                        <SelectItem value="Apache-2.0">Apache 2.0</SelectItem>
                        <SelectItem value="GPL-3.0">GPL 3.0</SelectItem>
                        <SelectItem value="BSD-3">BSD 3-Clause</SelectItem>
                        <SelectItem value="Proprietary">Proprietary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="file">Model File *</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <Input
                      id="file"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                    <Label
                      htmlFor="file"
                      className="cursor-pointer text-primary hover:underline"
                    >
                      Click to upload
                    </Label>
                    <span className="text-muted-foreground"> or drag and drop</span>
                    {formData.file && (
                      <p className="mt-2 text-sm font-medium">
                        Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{uploadStep}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {uploadStep || 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-5 h-5" />
                      Upload to IPFS & Blockchain
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">IPFS Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your model file and metadata are stored on IPFS via Pinata, ensuring decentralized and permanent storage with content addressing.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Smart Contract</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The metadata CID and pricing are recorded on the Sepolia blockchain, enabling trustless purchases and ownership verification.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Upload;