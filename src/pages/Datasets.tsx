import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Upload, Search, Database, Filter, ExternalLink, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface KaggleDataset {
  ref: string;
  title: string;
  subtitle: string;
  creatorName: string;
  creatorUrl: string;
  totalBytes: number;
  url: string;
  lastUpdated: string;
  downloadCount: number;
  voteCount: number;
  usabilityRating: number;
  tags?: { ref: string; name: string }[];
}

const Datasets = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('hottest');
  const [datasets, setDatasets] = useState<KaggleDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredDatasetId, setHoveredDatasetId] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  const fetchDatasets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('kaggle-datasets', {
        body: null,
        method: 'GET',
      });

      // Build URL with params for GET request
      const params = new URLSearchParams({
        sortBy,
        page: '1',
      });
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kaggle-datasets?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch datasets');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setDatasets(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Error fetching datasets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load datasets');
      toast({
        title: "Error",
        description: "Failed to load datasets from Kaggle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [sortBy]);

  const handleSearch = () => {
    fetchDatasets();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (dataset: KaggleDataset) => {
    const kaggleUrl = `https://www.kaggle.com/datasets/${dataset.ref}`;
    window.open(kaggleUrl, '_blank');
    toast({
      title: "Opening Kaggle",
      description: `Redirecting to download ${dataset.title}...`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-background/95">
      <Navbar />
      
      {/* Hero Section */}
      <section className={`gradient-primary text-white py-16 transition-all duration-1000 ${
        isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
      }`}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Database className="w-16 h-16 mx-auto opacity-90 animate-bounce" />
            <h1 className="text-4xl md:text-5xl font-bold">Datasets</h1>
            <p className="text-xl text-white/90">
              Discover and download free datasets from Kaggle for your AI projects
            </p>
            <Link to="/upload-dataset">
              <Button size="lg" variant="secondary" className="gap-2 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <Upload className="w-4 h-4" />
                Upload Your Dataset
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className={`py-8 border-b transition-all duration-1000 delay-100 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search Kaggle datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 transition-all duration-300 hover:border-primary/50 focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="gap-2 transition-all duration-300 hover:shadow-lg">
                <Search className="w-4 h-4" />
                Search
              </Button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] transition-all duration-300 hover:border-primary/50">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hottest">Hottest</SelectItem>
                  <SelectItem value="votes">Most Votes</SelectItem>
                  <SelectItem value="updated">Recently Updated</SelectItem>
                  <SelectItem value="active">Most Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Dataset Grid */}
      <section className={`py-12 flex-1 transition-all duration-1000 delay-200 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}>
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2">Loading datasets from Kaggle...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load datasets</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchDatasets}>Try Again</Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-muted-foreground">
                  Showing {datasets.length} dataset{datasets.length !== 1 ? 's' : ''} from Kaggle
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {datasets.map((dataset, idx) => (
                  <div
                    key={dataset.ref}
                    className={`transition-all duration-500 ease-out ${
                      isLoaded 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-10 opacity-0'
                    }`}
                    style={{
                      transitionDelay: isLoaded ? `${idx * 50}ms` : '0ms',
                    }}
                    onMouseEnter={() => setHoveredDatasetId(dataset.ref)}
                    onMouseLeave={() => setHoveredDatasetId(null)}
                  >
                    <Card className={`flex flex-col transition-all duration-300 ${
                      hoveredDatasetId === dataset.ref
                        ? 'shadow-lg scale-105 border-primary/50'
                        : 'hover:shadow-lg'
                    }`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{dataset.title}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              by {dataset.creatorName}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {dataset.subtitle || 'No description available'}
                        </p>
                        {dataset.tags && dataset.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {dataset.tags.slice(0, 3).map(tag => (
                              <Badge key={tag.ref} variant="outline" className="text-xs hover:bg-primary/10 transition-colors">
                                {tag.name}
                              </Badge>
                            ))}
                            {dataset.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{dataset.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Size:</span> {formatBytes(dataset.totalBytes)}
                          </div>
                          <div>
                            <span className="font-medium">Downloads:</span> {dataset.downloadCount?.toLocaleString() || 0}
                          </div>
                          <div>
                            <span className="font-medium">Votes:</span> {dataset.voteCount?.toLocaleString() || 0}
                          </div>
                          <div>
                            <span className="font-medium">Rating:</span> {(dataset.usabilityRating * 10).toFixed(1)}/10
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-4 border-t">
                        <Button 
                          className="w-full gap-2 transition-all duration-300 hover:shadow-md" 
                          onClick={() => handleDownload(dataset)}
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on Kaggle
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                ))}
              </div>

              {datasets.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No datasets found</h3>
                  <p className="text-muted-foreground">Try adjusting your search criteria</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Datasets;
