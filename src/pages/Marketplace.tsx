import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SearchBar } from '@/components/SearchBar';
import { ModelCard } from '@/components/ModelCard';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { mockModels, filterModels, getCategories } from '@/data/mockData';

const Marketplace = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1]);
  const [sortBy, setSortBy] = useState<string>('downloads');
  
  const categories = getCategories();

  const filteredModels = filterModels(mockModels, {
    category: category === 'all' ? undefined : category,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    search: searchQuery,
  });

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
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Search Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Model Marketplace</h1>
          <SearchBar onSearch={handleSearch} placeholder="Search models..." />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
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
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Models Grid */}
          <main className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-muted-foreground">
                Showing {sortedModels.length} model{sortedModels.length !== 1 ? 's' : ''}
              </p>
            </div>

            {sortedModels.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedModels.map(model => (
                  <ModelCard key={model.id} model={model} />
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
