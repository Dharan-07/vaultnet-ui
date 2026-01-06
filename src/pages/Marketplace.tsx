import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Loader2, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SearchBar } from '@/components/SearchBar';
import { ModelCard } from '@/components/ModelCard';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useOnChainModels, OnChainModel } from '@/hooks/useOnChainModels';
import { mockModels, filterModels, getCategories } from '@/data/mockData';
import { MarketplaceSkeleton } from '@/components/skeletons/PageSkeletons';

const Marketplace = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1]);
  const [sortBy, setSortBy] = useState<string>('downloads');
  const [showOnChainOnly, setShowOnChainOnly] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  
  const { models: onChainModels, loading, error, refetch } = useOnChainModels();
  
  const categories = getCategories();

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
      setIsLoaded(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (pageLoading) {
    return <MarketplaceSkeleton />;
  }

  // Combine mock models with on-chain models
  const allModels: OnChainModel[] = [
    ...onChainModels,
    ...mockModels.map(m => ({ ...m, onChain: false }))
  ];

  // Filter models
  const displayModels = showOnChainOnly ? onChainModels : allModels;

  const filteredModels = filterModels(displayModels, {
    category: category === 'all' ? undefined : category,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    search: searchQuery,
  }) as OnChainModel[];

  const sortedModels = [...filteredModels].sort((a, b) => {
    switch (sortBy) {
      case 'downloads':
        return b.downloads - a.downloads;
      case 'price-low':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'price-high':
        return parseFloat(b.price) - parseFloat(a.price);
      case 'recent':
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      default:
        return 0;
    }
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-background/95">
      <Navbar />

      {/* Search Header */}
      <div className={`border-b bg-muted/30 transition-all duration-1000 ${
        isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
      }`}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Model Marketplace</h1>
            <div className="flex items-center gap-3">
              <Button
                variant={showOnChainOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnChainOnly(!showOnChainOnly)}
                className="gap-2 transition-all duration-300 hover:shadow-lg"
              >
                <LinkIcon className="w-4 h-4" />
                On-Chain Only
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch}
                disabled={loading}
                className="gap-2 transition-all duration-300 hover:shadow-lg"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <SearchBar onSearch={handleSearch} placeholder="Search models..." />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:col-span-1 transition-all duration-1000 delay-100 ${
            isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
          }`}>
            <div className="sticky top-24 space-y-6 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/10 hover:border-primary/30 transition-colors duration-300">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5" />
                  <h2 className="font-semibold text-lg">Filters</h2>
                </div>

                {/* Category Filter */}
                <div className="space-y-2 mb-6">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-4 mb-6">
                  <Label>Price Range (ETH)</Label>
                  <div className="px-2">
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      className="mb-2"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{priceRange[0]} ETH</span>
                    <span>{priceRange[1]} ETH</span>
                  </div>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="downloads">Most Downloads</SelectItem>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => {
                    setCategory('all');
                    setPriceRange([0, 1]);
                    setSearchQuery('');
                    setShowOnChainOnly(false);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Models Grid */}
          <main className={`lg:col-span-3 transition-all duration-1000 delay-200 ${
            isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
          }`}>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                Showing {sortedModels.length} model{sortedModels.length !== 1 ? 's' : ''}
                {showOnChainOnly && ' (on-chain only)'}
              </p>
              {onChainModels.length > 0 && (
                <Badge variant="secondary" className="gap-1 animate-pulse">
                  <LinkIcon className="w-3 h-3" />
                  {onChainModels.length} on-chain
                </Badge>
              )}
            </div>

            {loading && onChainModels.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading on-chain models...</span>
              </div>
            ) : error && onChainModels.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={refetch}>
                  Try Again
                </Button>
              </div>
            ) : sortedModels.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedModels.map((model, idx) => (
                  <div 
                    key={`${model.onChain ? 'chain' : 'mock'}-${model.id}`} 
                    className={`relative transition-all duration-500 ease-out ${
                      isLoaded 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-10 opacity-0'
                    }`}
                    style={{
                      transitionDelay: isLoaded ? `${300 + idx * 50}ms` : '0ms',
                    }}
                    onMouseEnter={() => setHoveredCardId(`${model.onChain ? 'chain' : 'mock'}-${model.id}`)}
                    onMouseLeave={() => setHoveredCardId(null)}
                  >
                    {model.onChain && (
                      <Badge className="absolute top-2 right-2 z-10 bg-primary/90 animate-bounce">
                        <LinkIcon className="w-3 h-3 mr-1" />
                        On-Chain
                      </Badge>
                    )}
                    <div className={`transition-all duration-300 ${
                      hoveredCardId === `${model.onChain ? 'chain' : 'mock'}-${model.id}`
                        ? 'scale-105 shadow-lg'
                        : 'scale-100'
                    }`}>
                      <ModelCard model={model} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">
                  No models found matching your criteria
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setCategory('all');
                    setPriceRange([0, 1]);
                    setSearchQuery('');
                    setShowOnChainOnly(false);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Marketplace;
