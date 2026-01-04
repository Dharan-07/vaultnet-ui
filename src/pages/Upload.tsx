import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileUp, Loader2, CheckCircle, Shield, Scan } from 'lucide-react';
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

// Scanning Animation Component
const ScanningOverlay = ({ fileName, fileSize }: { fileName: string; fileSize: string }) => {
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState('Initializing scan...');
  const [binaryData, setBinaryData] = useState('');
  
  const scanPhases = [
    'Initializing scan...',
    'Analyzing file structure...',
    'Checking file integrity...',
    'Scanning for malware...',
    'Verifying model format...',
    'Computing file hash...',
    'Scan complete!'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  // Animate binary data
  useEffect(() => {
    const binaryInterval = setInterval(() => {
      setBinaryData(Array.from({ length: 40 }, () => Math.random() > 0.5 ? '1' : '0').join(''));
    }, 100);
    return () => clearInterval(binaryInterval);
  }, []);

  useEffect(() => {
    const phaseIndex = Math.min(
      Math.floor((scanProgress / 100) * scanPhases.length),
      scanPhases.length - 1
    );
    setScanPhase(scanPhases[phaseIndex]);
  }, [scanProgress]);

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-md rounded-lg flex flex-col items-center justify-center z-10 overflow-hidden animate-fade-in">
      {/* Scanning grid lines */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0 animate-pulse"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      </div>
      
      {/* Scanning line animation */}
      <div 
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-150 ease-out"
        style={{
          top: `${scanProgress}%`,
          boxShadow: '0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary))',
        }}
      />
      
      {/* Corner brackets with staggered animation */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary animate-pulse transition-all duration-300" style={{ animationDelay: '0ms' }} />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary animate-pulse transition-all duration-300" style={{ animationDelay: '100ms' }} />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary animate-pulse transition-all duration-300" style={{ animationDelay: '200ms' }} />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary animate-pulse transition-all duration-300" style={{ animationDelay: '300ms' }} />
      
      {/* Central content */}
      <div className="relative z-10 text-center space-y-6 p-8 animate-scale-in">
        {/* Animated scan icon */}
        <div className="relative inline-block">
          <Scan className="w-16 h-16 text-primary transition-transform duration-500 hover:scale-110" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          <div 
            className="absolute inset-0 rounded-full border-2 border-primary/50"
            style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}
          />
          <div 
            className="absolute inset-0 rounded-full border border-primary/30"
            style={{ animation: 'spin 3s linear infinite' }}
          />
        </div>
        
        {/* File info */}
        <div className="space-y-1 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <p className="text-lg font-semibold text-foreground transition-all duration-300">{fileName}</p>
          <p className="text-sm text-muted-foreground">{fileSize}</p>
        </div>
        
        {/* Scan phase with smooth transition */}
        <div className="flex items-center justify-center gap-2 text-primary transition-all duration-500 ease-out">
          <Shield className="w-4 h-4 transition-transform duration-300" style={{ animation: scanProgress === 100 ? 'bounce 0.5s ease-out' : 'none' }} />
          <span className="text-sm font-medium transition-all duration-300">{scanPhase}</span>
        </div>
        
        {/* Progress bar with smooth animation */}
        <div className="w-64 mx-auto space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${scanProgress}%`,
                boxShadow: '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.5)',
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground transition-all duration-200">{scanProgress}% complete</p>
        </div>
        
        {/* Binary data effect with continuous animation */}
        <div className="text-xs font-mono text-primary/40 max-w-xs mx-auto truncate transition-opacity duration-200">
          {binaryData}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

// Upload Progress Overlay Component
const UploadingOverlay = ({ step, progress }: { step: string; progress: number }) => {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        {/* Animated Upload Icon */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          <div 
            className="absolute inset-2 rounded-full border-4 border-primary/30 border-t-primary transition-all duration-300"
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <UploadIcon className="w-10 h-10 text-primary transition-transform duration-500" style={{ animation: 'float 2s ease-in-out infinite' }} />
          </div>
        </div>

        {/* Step text */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-foreground mb-2 transition-all duration-300">
            Uploading{dots}
          </h3>
          <p className="text-sm text-muted-foreground transition-all duration-500 ease-out">
            {step}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-3">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full transition-all duration-500 ease-out relative"
              style={{ 
                width: `${progress}%`,
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-medium text-foreground transition-all duration-200">{progress}%</span>
          </div>
        </div>

        {/* Step indicators */}
        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3].map((stepNum) => (
            <div 
              key={stepNum}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                progress >= (stepNum * 33) 
                  ? 'bg-primary scale-110' 
                  : 'bg-muted'
              }`}
              style={{ 
                boxShadow: progress >= (stepNum * 33) ? '0 0 8px hsl(var(--primary))' : 'none',
                transitionDelay: `${stepNum * 100}ms`
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
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

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const categories = getCategories();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      // Trigger scanning animation
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 3500);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      // Trigger scanning animation
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 3500);
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-background/95">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className={`mb-8 transition-all duration-1000 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h1 className="text-4xl font-bold mb-2">Upload Model</h1>
            <p className="text-muted-foreground">
              Share your AI model with the VaultNet community
            </p>
          </div>

          <Card className={`transition-all duration-1000 delay-100 hover:shadow-lg ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
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
                  <div 
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer ${
                      isDragActive 
                        ? 'border-primary bg-primary/10 scale-105' 
                        : formData.file
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'border-muted-foreground/50 hover:border-primary hover:bg-primary/5'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {/* Scanning overlay */}
                    {isScanning && formData.file && (
                      <ScanningOverlay 
                        fileName={formData.file.name}
                        fileSize={`${(formData.file.size / 1024 / 1024).toFixed(2)} MB`}
                      />
                    )}
                    
                    {formData.file && !isScanning ? (
                      <>
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 animate-bounce" />
                        <p className="mt-2 text-sm font-medium text-green-600">
                          Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        <p className="text-xs text-green-500/70 mt-1 flex items-center justify-center gap-1">
                          <Shield className="w-3 h-3" /> File scanned and verified
                        </p>
                        <Label htmlFor="file" className="cursor-pointer text-primary hover:underline text-sm mt-2 block">
                          Click to change file
                        </Label>
                      </>
                    ) : !isScanning && (
                      <>
                        <FileUp className={`w-12 h-12 mx-auto mb-4 transition-colors ${
                          isDragActive ? 'text-primary' : 'text-muted-foreground'
                        }`} />
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
                      </>
                    )}
                  </div>
                </div>

                {/* Upload Progress Overlay */}
                {isUploading && (
                  <UploadingOverlay step={uploadStep} progress={uploadProgress} />
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {uploadStep || 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
                      Upload to IPFS & Blockchain
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className={`grid md:grid-cols-2 gap-6 mt-8 transition-all duration-1000 delay-200 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
              <CardHeader>
                <CardTitle className="text-lg">IPFS Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your model file and metadata are stored on IPFS via Pinata, ensuring decentralized and permanent storage with content addressing.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
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