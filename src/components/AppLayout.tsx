import { useMessageNotifications } from '@/hooks/useMessageNotifications';

export function AppLayout({ children }: { children: React.ReactNode }) {
  useMessageNotifications();
  return <>{children}</>;
}
