import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Wallet, Globe, MapPin, Twitter, Github, Linkedin, ExternalLink, ArrowLeft, Copy, Check, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  profilePhotoUrl?: string;
  bio?: string;
  walletAddress?: string;
  website?: string;
  location?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
}

export default function UserProfile() {
  const { uid } = useParams<{ uid: string }>();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!uid) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            id: userDoc.id,
            name: data.name || '',
            email: data.email || '',
            profilePhotoUrl: data.profilePhotoUrl,
            bio: data.bio,
            walletAddress: data.walletAddress,
            website: data.website,
            location: data.location,
            twitter: data.twitter,
            github: data.github,
            linkedin: data.linkedin,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [uid]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: `${field} copied to clipboard` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <User className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold">User Not Found</h2>
          <p className="text-muted-foreground">This profile doesn't exist or has been removed.</p>
          <Link to="/search-users">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Search
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <Link to="/search-users" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>

          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Avatar className="w-24 h-24 border-4 border-background shadow-lg ring-2 ring-primary/20">
                  <AvatarImage src={profile.profilePhotoUrl} alt={profile.name} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {profile.name ? getInitials(profile.name) : <User className="w-10 h-10" />}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-3xl font-bold">{profile.name || 'Anonymous'}</h1>
                  {profile.bio && (
                    <p className="text-muted-foreground mt-1 italic">"{profile.bio}"</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                    <Badge variant="outline" className="font-mono text-xs gap-1">
                      UID: {profile.id.slice(0, 12)}...
                      <button onClick={() => copyToClipboard(profile.id, 'UID')} className="ml-1">
                        {copiedField === 'UID' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </Badge>
                    {profile.walletAddress && (
                      <Badge variant="secondary" className="font-mono text-xs gap-1">
                        <Wallet className="w-3 h-3" />
                        {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
                        <button onClick={() => copyToClipboard(profile.walletAddress!, 'Wallet')} className="ml-1">
                          {copiedField === 'Wallet' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>
              )}

              {profile.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{profile.location}</p>
                  </div>
                </div>
              )}

              {profile.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {profile.website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {profile.walletAddress && (
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Wallet Address</p>
                    <p className="font-medium font-mono text-sm">{profile.walletAddress}</p>
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(profile.twitter || profile.github || profile.linkedin) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Social Links</p>
                    <div className="flex gap-2">
                      {profile.twitter && (
                        <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors" title={`@${profile.twitter}`}>
                          <Twitter className="w-5 h-5" />
                        </a>
                      )}
                      {profile.github && (
                        <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors" title={profile.github}>
                          <Github className="w-5 h-5" />
                        </a>
                      )}
                      {profile.linkedin && (
                        <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors" title={profile.linkedin}>
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
