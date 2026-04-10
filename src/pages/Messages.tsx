import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ConversationItem {
  id: string;
  participantId: string;
  participantName: string;
  participantPhoto?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unread: boolean;
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.id),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convos: ConversationItem[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const otherUid = (data.participants as string[]).find((p) => p !== user.id);
        if (!otherUid) continue;

        let participantName = 'Unknown User';
        let participantPhoto: string | undefined;

        try {
          const userDoc = await getDoc(doc(db, 'users', otherUid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            participantName = userData.name || 'Anonymous';
            participantPhoto = userData.profilePhotoUrl;
          }
        } catch {
          // ignore
        }

        convos.push({
          id: docSnap.id,
          participantId: otherUid,
          participantName,
          participantPhoto,
          lastMessage: data.lastMessage || '',
          lastMessageAt: data.lastMessageAt?.toDate?.() || new Date(),
          unread: data[`unread_${user.id}`] === true,
        });
      }

      setConversations(convos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const filtered = conversations.filter((c) =>
    c.participantName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="w-8 h-8" />
              Messages
            </h1>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-semibold">No conversations yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Visit a user's profile and click "Message" to start chatting.
                </p>
                <Link to="/search-users">
                  <Button variant="outline" className="mt-4 gap-2">
                    <Search className="w-4 h-4" /> Find Users
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((convo) => (
                <Card
                  key={convo.id}
                  className="cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => navigate(`/dm/${convo.participantId}`)}
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-11 h-11 border-2 border-foreground">
                        <AvatarImage src={convo.participantPhoto} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                          {getInitials(convo.participantName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold truncate ${convo.unread ? 'text-foreground' : ''}`}>
                            {convo.participantName}
                          </p>
                          {convo.unread && (
                            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm truncate ${convo.unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {convo.lastMessage}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(convo.lastMessageAt, { addSuffix: true })}
                      </span>
                    </div>
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
