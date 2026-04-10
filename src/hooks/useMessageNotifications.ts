import { useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Requests browser notification permission and shows a notification
 * whenever a new unread conversation appears.
 */
export function useMessageNotifications() {
  const { user } = useAuth();
  const previousUnreadIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!user?.id) return;

    // Request permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.id),
      where(`unread_${user.id}`, '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentIds = new Set(snapshot.docs.map((d) => d.id));

      if (isFirstLoad.current) {
        previousUnreadIds.current = currentIds;
        isFirstLoad.current = false;
        return;
      }

      // Find newly unread conversations
      for (const id of currentIds) {
        if (!previousUnreadIds.current.has(id)) {
          const data = snapshot.docs.find((d) => d.id === id)?.data();
          if (data) {
            showNotification(data.lastMessage || 'New message');
          }
        }
      }

      previousUnreadIds.current = currentIds;
    });

    return () => unsubscribe();
  }, [user?.id]);
}

function showNotification(body: string) {
  // Play a subtle sound
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkZeYl5eTjoeAeXJtaGRhX19fYGFjaGx0e4KIjpOXmZmYlpKNiIJ8dnFtaWViYGBgYWNna3F3fYOJj5SYmpmYlpKNh4F7dXBsaGViYGBfYGJmaW50eoGHjZKWmJmYl5SNiIF7dXBrZ2RiYF9fYGJlaW1ze4GHjZKWmJmYlpONh4F7dXBrZ2RhYF9fYGJlaW50eoGHjZKWmJmYlpONh4F7dXBrZ2RhYF9fYA==');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {
    // ignore
  }

  // Browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('VaultNet - New Message', {
        body: body.slice(0, 100),
        icon: '/vn_logo.svg',
        tag: 'vaultnet-message',
      });
    } catch {
      // ignore
    }
  }
}
