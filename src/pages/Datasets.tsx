import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Upload, Search, Database, Filter } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockDatasets, getDatasetCategories, Dataset } from '@/data/mockDatasets';
import { useToast } from '@/hooks/use-toast';

const Datasets = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();
  
  const categories = getDatasetCategories();
  
  const filteredDatasets = mockDatasets.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dataset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dataset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (dataset: Dataset) => {
    toast({
      title: "Download Started",
      description: `Downloading ${dataset.name}...`,
    });
    // In a real app, this would trigger IPFS download
    console.log(`Downloading dataset from IPFS: ${dataset.cid}`);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="gradient-primary text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Database className="w-16 h-16 mx-auto opacity-90" />
            <h1 className="text-4xl md:text-5xl font-bold">Datasets</h1>
            <p className="text-xl text-white/90">
              Discover and download free datasets for your AI projects
            </p>
            <Link to="/upload-dataset">
              <Button size="lg" variant="secondary" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Dataset
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Dataset Grid */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing {filteredDatasets.length} dataset{filteredDatasets.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDatasets.map(dataset => (
              <Card key={dataset.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{dataset.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        by {formatAddress(dataset.uploader)}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{dataset.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {dataset.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {dataset.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Size:</span> {dataset.size}
                    </div>
                    <div>
                      <span className="font-medium">Format:</span> {dataset.format}
                    </div>
                    <div>
                      <span className="font-medium">Downloads:</span> {dataset.downloads.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {dataset.uploadDate}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t">
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => handleDownload(dataset)}
                  >
                    <Download className="w-4 h-4" />
                    Download Free
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {filteredDatasets.length === 0 && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No datasets found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Datasets;
