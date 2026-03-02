import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, User, Copy, Check, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const copyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedId(uid);
    toast({ title: 'UID copied to clipboard' });
    setTimeout(() => setCopiedId(null), 2000);
  };

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

      // 1. Exact UID lookup
      try {
        const userDoc = await getDoc(doc(db, 'users', q));
        if (userDoc.exists()) {
          const data = userDoc.data();
          found.push({
            id: userDoc.id,
            name: data.name || '',
            email: data.email || '',
            profilePhotoUrl: data.profilePhotoUrl,
            bio: data.bio,
            walletAddress: data.walletAddress,
          });
          seenIds.add(userDoc.id);
        }
      } catch {
        // Not a valid doc ID, continue to name search
      }

      // 2. Name prefix search
      const nameQuery = query(
        collection(db, 'users'),
        where('name', '>=', q),
        where('name', '<=', q + '\uf8ff'),
        limit(20)
      );
      const nameSnap = await getDocs(nameQuery);
      nameSnap.forEach((d) => {
        if (!seenIds.has(d.id)) {
          const data = d.data();
          found.push({
            id: d.id,
            name: data.name || '',
            email: data.email || '',
            profilePhotoUrl: data.profilePhotoUrl,
            bio: data.bio,
            walletAddress: data.walletAddress,
          });
          seenIds.add(d.id);
        }
      });

      // 3. Case-insensitive: also try lowercase prefix
      const lowerQ = q.toLowerCase();
      const lowerFirstChar = lowerQ.charAt(0).toUpperCase() + lowerQ.slice(1);
      if (lowerFirstChar !== q) {
        const altQuery = query(
          collection(db, 'users'),
          where('name', '>=', lowerFirstChar),
          where('name', '<=', lowerFirstChar + '\uf8ff'),
          limit(20)
        );
        const altSnap = await getDocs(altQuery);
        altSnap.forEach((d) => {
          if (!seenIds.has(d.id)) {
            const data = d.data();
            found.push({
              id: d.id,
              name: data.name || '',
              email: data.email || '',
              profilePhotoUrl: data.profilePhotoUrl,
              bio: data.bio,
              walletAddress: data.walletAddress,
            });
            seenIds.add(d.id);
          }
        });
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

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Find Users</h1>
          <p className="text-muted-foreground mb-8">
            Search by User ID or profile name
          </p>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter UID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-24 h-12 text-base text-foreground"
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
                  <CardContent className="flex items-center gap-4 py-4">
                    <Avatar className="w-14 h-14 border-2 border-background shadow ring-1 ring-primary/20">
                      <AvatarImage src={user.profilePhotoUrl} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name ? getInitials(user.name) : <User className="w-6 h-6" />}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{user.name || 'Anonymous'}</h3>
                      {user.bio && (
                        <p className="text-sm text-muted-foreground truncate">{user.bio}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
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
                      </div>
                    </div>

                    {user.walletAddress && (
                      <Badge variant="secondary" className="hidden sm:inline-flex">
                        Wallet Connected
                      </Badge>
                    )}
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
