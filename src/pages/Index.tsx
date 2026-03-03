import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SearchBar } from '@/components/SearchBar';
import { ModelCard } from '@/components/ModelCard';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { getFeaturedModels, getTrendingModels } from '@/data/mockData';

const Index = () => {
  const navigate = useNavigate();
  const featuredModels = getFeaturedModels();
  const trendingModels = getTrendingModels();

  const handleSearch = (query: string) => {
    const sanitized = query.slice(0, 100).trim();
    if (sanitized) {
      navigate(`/marketplace?q=${encodeURIComponent(sanitized)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20 border-b-3 border-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight font-mono uppercase">
              Decentralized AI Model Repository
            </h1>
            <p className="text-xl md:text-2xl opacity-90">
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
                <Button size="lg" variant="outline" className="gap-2 bg-primary-foreground/10 text-primary-foreground border-primary-foreground">
                  Upload Model
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary/30 border-b-3 border-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Decentralized Storage", desc: "Models stored securely on IPFS with blockchain verification" },
              { icon: Zap, title: "Smart Contracts", desc: "Automated payments and access control via Ethereum" },
              { icon: Sparkles, title: "Version Control", desc: "Track model evolution with on-chain version history" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center space-y-4 p-6 bg-card border-3 border-foreground rounded-lg shadow-[4px_4px_0px_hsl(var(--foreground))] hover:shadow-[6px_6px_0px_hsl(var(--foreground))] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-md bg-accent border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                  <Icon className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-bold font-mono">{title}</h3>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Models */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold font-mono uppercase">Featured Models</h2>
            <Link to="/marketplace">
              <Button variant="outline" className="gap-2">
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
      <section className="py-16 bg-secondary/30 border-y-3 border-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold font-mono uppercase">Trending Models</h2>
            <Link to="/marketplace">
              <Button variant="outline" className="gap-2">
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
      <section className="py-20 bg-secondary border-b-3 border-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4 font-mono uppercase">Ready to get started?</h2>
          <p className="text-xl text-secondary-foreground/80 mb-8">
            Join the decentralized AI revolution today
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/upload">
              <Button size="lg">
                Upload Your Model
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button size="lg" variant="outline">
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
