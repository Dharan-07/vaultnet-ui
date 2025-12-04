import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SearchBar } from '@/components/SearchBar';
import { ModelCard, Model } from '@/components/ModelCard';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [featuredModels, setFeaturedModels] = useState<Model[]>([]);
  const [trendingModels, setTrendingModels] = useState<Model[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      // Fetch featured models (by downloads)
      try {
        const { data: featuredData, error: featuredError } = await supabase.functions.invoke('huggingface-models', {
          body: null,
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (featuredError) throw featuredError;
        
        // Handle the response - it might be returned directly or wrapped
        const featured = Array.isArray(featuredData) ? featuredData : [];
        setFeaturedModels(featured.slice(0, 3));
      } catch (error) {
        console.error('Error fetching featured models:', error);
      } finally {
        setLoadingFeatured(false);
      }

      // Fetch trending models (by likes)
      try {
        const { data: trendingData, error: trendingError } = await supabase.functions.invoke('huggingface-models', {
          body: null,
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (trendingError) throw trendingError;
        
        const trending = Array.isArray(trendingData) ? trendingData : [];
        setTrendingModels(trending.slice(0, 6));
      } catch (error) {
        console.error('Error fetching trending models:', error);
      } finally {
        setLoadingTrending(false);
      }
    };

    fetchModels();
  }, []);

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    window.location.href = `/marketplace?q=${encodeURIComponent(query)}`;
  };

  const ModelCardSkeleton = () => (
    <div className="space-y-4 p-6 border rounded-lg">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-primary text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Decentralized AI Model Repository
            </h1>
            <p className="text-xl md:text-2xl text-white/90">
              Discover, share, and monetize AI models on the blockchain
            </p>
            
            <div className="flex justify-center pt-4">
              <SearchBar onSearch={handleSearch} />
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link to="/marketplace">
                <Button size="lg" variant="secondary" className="gap-2">
                  Explore Models
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/upload">
                <Button size="lg" variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30">
                  Upload Model
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Decentralized Storage</h3>
              <p className="text-muted-foreground">
                Models stored securely on IPFS with blockchain verification
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Smart Contracts</h3>
              <p className="text-muted-foreground">
                Automated payments and access control via Ethereum
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Version Control</h3>
              <p className="text-muted-foreground">
                Track model evolution with on-chain version history
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Models */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Models</h2>
            <Link to="/marketplace">
              <Button variant="ghost" className="gap-2">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
            {loadingFeatured ? (
              <>
                <ModelCardSkeleton />
                <ModelCardSkeleton />
                <ModelCardSkeleton />
              </>
            ) : featuredModels.length > 0 ? (
              featuredModels.map(model => (
                <ModelCard key={model.id} model={model} />
              ))
            ) : (
              <p className="col-span-3 text-center text-muted-foreground">No featured models available</p>
            )}
          </div>
        </div>
      </section>

      {/* Trending Models */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Trending Models</h2>
            <Link to="/marketplace">
              <Button variant="ghost" className="gap-2">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingTrending ? (
              <>
                <ModelCardSkeleton />
                <ModelCardSkeleton />
                <ModelCardSkeleton />
                <ModelCardSkeleton />
                <ModelCardSkeleton />
                <ModelCardSkeleton />
              </>
            ) : trendingModels.length > 0 ? (
              trendingModels.map(model => (
                <ModelCard key={model.id} model={model} />
              ))
            ) : (
              <p className="col-span-3 text-center text-muted-foreground">No trending models available</p>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join the decentralized AI revolution today
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/upload">
              <Button size="lg" variant="secondary">
                Upload Your Model
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30">
                Browse Models
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
