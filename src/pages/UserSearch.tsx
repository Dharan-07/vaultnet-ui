import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, User, Copy, Check, Loader2, Wallet, ExternalLink } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface UserResult {
  id: string;
  name: string;
  email: string;
  profilePhotoUrl?: string;
  bio?: string;
  walletAddress?: string;
}

export default function UserSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const copyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedId(uid);
    toast({ title: 'UID copied to clipboard' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isWalletAddress = (q: string) => /^0x[a-fA-F0-9]{40}$/.test(q);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setHasSearched(true);
    setResults([]);

    try {
      const found: UserResult[] = [];
      const seenIds = new Set<string>();

      const addUser = (id: string, data: any) => {
        if (seenIds.has(id)) return;
        found.push({
          id,
          name: data.name || '',
          email: data.email || '',
          profilePhotoUrl: data.profilePhotoUrl,
          bio: data.bio,
          walletAddress: data.walletAddress,
        });
        seenIds.add(id);
      };

      // 1. Exact UID lookup
      try {
        const userDoc = await getDoc(doc(db, 'users', q));
        if (userDoc.exists()) addUser(userDoc.id, userDoc.data());
      } catch { /* not a valid doc ID */ }

      // 2. Wallet address search
      if (isWalletAddress(q)) {
        const walletQuery = query(
          collection(db, 'users'),
          where('walletAddress', '==', q),
          limit(10)
        );
        const walletSnap = await getDocs(walletQuery);
        walletSnap.forEach(d => addUser(d.id, d.data()));
      }

      // 3. Name prefix search
      const nameQuery = query(
        collection(db, 'users'),
        where('name', '>=', q),
        where('name', '<=', q + '\uf8ff'),
        limit(20)
      );
      const nameSnap = await getDocs(nameQuery);
      nameSnap.forEach(d => addUser(d.id, d.data()));

      // 4. Case-insensitive: capitalize first letter
      const lowerQ = q.toLowerCase();
      const capitalized = lowerQ.charAt(0).toUpperCase() + lowerQ.slice(1);
      if (capitalized !== q) {
        const altQuery = query(
          collection(db, 'users'),
          where('name', '>=', capitalized),
          where('name', '<=', capitalized + '\uf8ff'),
          limit(20)
        );
        const altSnap = await getDocs(altQuery);
        altSnap.forEach(d => addUser(d.id, d.data()));
      }

      setResults(found);
    } catch (error) {
      console.error('Search error:', error);
      toast({ title: 'Search failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="w-full px-3 md:px-4 py-6 md:py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Find Users</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-8">
            Search by User ID, profile name, or wallet address
          </p>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter UID, name, or wallet address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 md:pl-12 pr-20 md:pr-24 h-10 md:h-12 text-sm md:text-base text-foreground"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
          </form>

          {isSearching && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
              {results.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-3 md:gap-4 py-3 md:py-4">
                     <Avatar className="w-10 h-10 md:w-14 md:h-14 border-2 border-background shadow ring-1 ring-primary/20 flex-shrink-0">
                      <AvatarImage src={user.profilePhotoUrl} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name ? getInitials(user.name) : <User className="w-6 h-6" />}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-lg truncate">{user.name || 'Anonymous'}</h3>
                      {user.bio && (
                        <p className="text-sm text-muted-foreground truncate">{user.bio}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          UID: {user.id.slice(0, 8)}...
                        </Badge>
                        <button
                          onClick={() => copyUid(user.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy full UID"
                        >
                          {copiedId === user.id ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {user.walletAddress && (
                          <Badge variant="secondary" className="font-mono text-xs gap-1">
                            <Wallet className="w-3 h-3" />
                            {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Link to={`/user/${user.id}`}>
                      <Button variant="outline" size="sm" className="gap-1 shrink-0">
                        View
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
