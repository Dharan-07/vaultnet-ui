import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ArrowLeft, User } from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection, query, where, orderBy, onSnapshot, addDoc,
  doc, getDoc, setDoc, updateDoc, serverTimestamp, getDocs, limit,
  Timestamp
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
}

interface OtherUser {
  id: string;
  name: string;
  profilePhotoUrl?: string;
}

// Get or create a conversation between two users
async function getOrCreateConversation(currentUid: string, otherUid: string): Promise<string> {
  // Search for existing conversation
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', currentUid)
  );
  const snapshot = await getDocs(q);
  
  for (const docSnap of snapshot.docs) {
    const participants = docSnap.data().participants as string[];
    if (participants.includes(otherUid)) {
      return docSnap.id;
    }
  }

  // Create new conversation
  const convoRef = await addDoc(collection(db, 'conversations'), {
    participants: [currentUid, otherUid],
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    [`unread_${currentUid}`]: false,
    [`unread_${otherUid}`]: false,
    createdAt: serverTimestamp(),
  });

  return convoRef.id;
}

export default function DirectMessage() {
  const { recipientId } = useParams<{ recipientId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch other user's profile
  useEffect(() => {
    if (!recipientId) return;
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', recipientId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setOtherUser({ id: userDoc.id, name: data.name || 'Anonymous', profilePhotoUrl: data.profilePhotoUrl });
        }
      } catch {
        // ignore
      }
    };
    fetchUser();
  }, [recipientId]);

  // Get or create conversation
  useEffect(() => {
    if (!user?.id || !recipientId || user.id === recipientId) return;
    const init = async () => {
      try {
        const convoId = await getOrCreateConversation(user.id, recipientId);
        setConversationId(convoId);
      } catch (error) {
        console.error('Error initializing conversation:', error);
        setLoading(false);
      }
    };
    init();
  }, [user?.id, recipientId]);

  // Listen to messages
  useEffect(() => {
    if (!conversationId) return;

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          senderId: data.senderId,
          text: data.text,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        };
      });
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  // Mark as read
  useEffect(() => {
    if (!conversationId || !user?.id) return;
    const markRead = async () => {
      try {
        await updateDoc(doc(db, 'conversations', conversationId), {
          [`unread_${user.id}`]: false,
        });
      } catch {
        // ignore
      }
    };
    markRead();
  }, [conversationId, user?.id, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || !user?.id || !recipientId) return;
    const text = newMessage.trim();
    if (text.length > 2000) {
      toast({ title: 'Message too long', description: 'Max 2000 characters.', variant: 'destructive' });
      return;
    }

    setSending(true);
    setNewMessage('');

    try {
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        senderId: user.id,
        text,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: text.slice(0, 100),
        lastMessageAt: serverTimestamp(),
        [`unread_${recipientId}`]: true,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Failed to send', description: 'Please try again.', variant: 'destructive' });
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (!user) return null;

  if (user.id === recipientId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">You can't message yourself.</p>
          <Link to="/messages"><Button variant="outline">Back to Messages</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-4 flex-1 flex flex-col max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link to="/messages">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          {otherUser ? (
            <Link to={`/user/${otherUser.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Avatar className="w-10 h-10 border-2 border-foreground">
                <AvatarImage src={otherUser.profilePhotoUrl} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {getInitials(otherUser.name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-bold text-lg">{otherUser.name}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-foreground">
                <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
              </Avatar>
              <span className="font-bold text-lg">Loading...</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <p className="text-sm">No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 border-2 border-foreground ${
                        isMine
                          ? 'bg-primary text-primary-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]'
                          : 'bg-card text-card-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>

        {/* Input */}
        <div className="flex gap-2 mt-3">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            maxLength={2000}
            disabled={sending}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || sending} size="icon">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
