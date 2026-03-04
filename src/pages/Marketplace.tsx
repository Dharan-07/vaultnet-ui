import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Loader2, RefreshCw, Link as LinkIcon, ChevronDown } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { mockModels, filterModels, getCategories } from '@/data/mockData';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const Marketplace = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1]);
  const [sortBy, setSortBy] = useState<string>('downloads');
  const [showOnChainOnly, setShowOnChainOnly] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isMobile = useIsMobile();

  const { models: onChainModels, loading, error, refetch } = useOnChainModels();

  const categories = getCategories();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
      <div className={`border-b bg-muted/30 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
        }`}>
        <div className="w-full px-3 md:px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Model Marketplace</h1>
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <Button
                variant={showOnChainOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnChainOnly(!showOnChainOnly)}
                className="gap-1 md:gap-2 text-xs md:text-sm"
              >
                <LinkIcon className="w-3 md:w-4 h-3 md:h-4" />
                <span className="hidden sm:inline">On-Chain Only</span>
                <span className="sm:hidden">On-Chain</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
                className="gap-1 md:gap-2 text-xs md:text-sm"
              >
                <RefreshCw className={`w-3 md:w-4 h-3 md:h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <SearchBar onSearch={handleSearch} placeholder="Search models..." />
        </div>
      </div>

      <div className="w-full px-3 md:px-4 py-6 md:py-8 flex-1">
        <div className="grid md:grid-cols-4 gap-4 md:gap-8">
          {/* Filters Sidebar - Collapsible on mobile */}
          <aside className={`md:col-span-1 ${isMobile ? 'col-span-full' : ''}`}>
            {isMobile ? (
              <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="w-full">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <span>Filters</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? 'transform rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-4 p-3 md:p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/10">
                    {renderFilters()}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="sticky top-24 space-y-4 md:space-y-6 p-3 md:p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/10 hover:border-primary/30 transition-colors duration-300">
                {renderFilters()}
              </div>
            )}
          </aside>

          {/* Models Grid */}
          <main className={`md:col-span-3 transition-all duration-1000 delay-200 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
            }`}>
            <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs md:text-sm text-muted-foreground">
                Showing {sortedModels.length} model{sortedModels.length !== 1 ? 's' : ''}
                {showOnChainOnly && ' (on-chain only)'}
              </p>
              {onChainModels.length > 0 && (
                <Badge variant="secondary" className="gap-1 animate-pulse w-fit text-xs md:text-sm">
                  <LinkIcon className="w-3 h-3" />
                  {onChainModels.length} on-chain
                </Badge>
              )}
            </div>

            {loading && onChainModels.length === 0 ? (
              <div className="flex items-center justify-center py-12 md:py-16">
                <Loader2 className="w-6 md:w-8 h-6 md:h-8 animate-spin text-primary" />
                <span className="ml-2 md:ml-3 text-xs md:text-sm text-muted-foreground">Loading on-chain models...</span>
              </div>
            ) : error && onChainModels.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <p className="text-sm md:text-base text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={refetch} size="sm">
                  Try Again
                </Button>
              </div>
            ) : sortedModels.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {sortedModels.map((model, idx) => (
                  <div
                    key={`${model.onChain ? 'chain' : 'mock'}-${model.id}`}
                    className={`relative transition-all duration-500 ease-out ${isLoaded
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
                      <Badge className="absolute top-2 right-2 z-10 bg-primary/90 animate-bounce text-xs">
                        <LinkIcon className="w-3 h-3 mr-1" />
                        On-Chain
                      </Badge>
                    )}
                    <div className={`transition-all duration-300 ${hoveredCardId === `${model.onChain ? 'chain' : 'mock'}-${model.id}`
                        ? 'scale-105 shadow-lg'
                        : 'scale-100'
                      }`}>
                      <ModelCard model={model} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 md:py-16">
                <p className="text-sm md:text-lg text-muted-foreground mb-3 md:mb-4">
                  No models found matching your criteria
                </p>
                <Button
                  variant="outline"
                  size="sm"
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

  function renderFilters() {
    return (
      <>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 md:w-5 h-4 md:h-5" />
          <h2 className="font-semibold text-sm md:text-lg">Filters</h2>
        </div>

        {/* Category Filter */}
        <div className="space-y-2 mb-4">
          <Label className="text-xs md:text-sm">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="text-xs md:text-sm">
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
        <div className="space-y-3 mb-4">
          <Label className="text-xs md:text-sm">Price Range (ETH)</Label>
          <div className="px-1 md:px-2">
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              className="mb-2"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{priceRange[0]} ETH</span>
            <span>{priceRange[1]} ETH</span>
          </div>
        </div>

        {/* Sort By */}
        <div className="space-y-2 mb-4">
          <Label className="text-xs md:text-sm">Sort By</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="text-xs md:text-sm">
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
          className="w-full text-xs md:text-sm"
          onClick={() => {
            setCategory('all');
            setPriceRange([0, 1]);
            setSearchQuery('');
            setShowOnChainOnly(false);
          }}
        >
          Reset Filters
        </Button>
      </>
    );
  }
};

export default Marketplace;
