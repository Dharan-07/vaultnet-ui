import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SearchBar } from '@/components/SearchBar';
import { ModelCard } from '@/components/ModelCard';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { getFeaturedModels, getTrendingModels } from '@/data/mockData';

const Index = () => {
  const featuredModels = getFeaturedModels();
  const trendingModels = getTrendingModels();

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // Navigate to marketplace with search query
    window.location.href = `/marketplace?q=${encodeURIComponent(query)}`;
  };

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
            {featuredModels.slice(0, 3).map(model => (
              <ModelCard key={model.id} model={model} />
            ))}
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
            {trendingModels.map(model => (
              <ModelCard key={model.id} model={model} />
            ))}
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
