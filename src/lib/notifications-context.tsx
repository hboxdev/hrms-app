import { useAudioPlayer } from 'expo-audio';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { apiGet } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { DashboardData, Invoice, RooftopOrder } from '@/lib/types';

export type AlertType = 'info' | 'warning' | 'danger' | 'success';

export type Notification = {
  id: string;
  source: 'payment' | 'announcement' | 'order';
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  alertType?: AlertType;
};

type AnnouncementApi = {
  id: string | number;
  title: string;
  message: string;
  alert_type: AlertType;
  creator_name: string | null;
  created_at: string;
};

const POLL_INTERVAL = 20000;

function currentMonthParam() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function paymentNotification(id: number | string, customerName: string, ownerName: string, amount: number): Notification {
  return {
    id: `payment-${id}`,
    source: 'payment',
    title: 'Payment received',
    body: `${customerName} paid $${amount.toLocaleString()} (${ownerName})`,
    createdAt: Date.now(),
    read: false,
  };
}

function announcementNotification(a: AnnouncementApi): Notification {
  return {
    id: `announcement-${a.id}`,
    source: 'announcement',
    title: a.title,
    body: a.message,
    createdAt: new Date(a.created_at).getTime() || Date.now(),
    read: false,
    alertType: a.alert_type,
  };
}

function orderStatusNotification(order: RooftopOrder): Notification | null {
  if (order.status === 'preparing') {
    return {
      id: `order-${order.id}-preparing`,
      source: 'order',
      title: 'Order update',
      body: `Your order #${order.id} is being prepared`,
      createdAt: Date.now(),
      read: false,
      alertType: 'info',
    };
  }
  if (order.status === 'done') {
    return {
      id: `order-${order.id}-done`,
      source: 'order',
      title: 'Order ready',
      body: `Your order #${order.id} is ready. Enjoy your meal!`,
      createdAt: Date.now(),
      read: false,
      alertType: 'success',
    };
  }
  return null;
}

type NotificationsState = {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsState | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const paymentPlayer = useAudioPlayer(require('@/assets/sounds/payment.wav'));
  const announcementPlayer = useAudioPlayer(require('@/assets/sounds/notification.wav'));
  // Poll effect below intentionally doesn't depend on these player objects (their identity
  // isn't guaranteed stable across renders); refs let the effect read the latest player
  // without re-subscribing every render, which previously caused duplicate notifications.
  const paymentPlayerRef = useRef(paymentPlayer);
  const announcementPlayerRef = useRef(announcementPlayer);
  paymentPlayerRef.current = paymentPlayer;
  announcementPlayerRef.current = announcementPlayer;
  const seenPaymentIds = useRef<Set<string> | null>(null);
  const seenAnnouncementIds = useRef<Set<string> | null>(null);
  const seenOrderStatuses = useRef<Map<string, RooftopOrder['status']> | null>(null);

  const addNotifications = useCallback(
    (additions: Notification[], player: ReturnType<typeof useAudioPlayer>) => {
      if (additions.length === 0) return;
      // Dedupe against current state as a final safety net — poll timers can overlap
      // (fast refresh, slow network, etc.) and this guarantees no id ever renders twice.
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const deduped = additions.filter((n) => !existingIds.has(n.id));
        return deduped.length > 0 ? [...deduped, ...prev] : prev;
      });
      player.seekTo(0);
      player.play();
    },
    []
  );

  const addSilently = useCallback((additions: Notification[]) => {
    if (additions.length === 0) return;
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const deduped = additions.filter((n) => !existingIds.has(n.id)).map((n) => ({ ...n, read: true }));
      return deduped.length > 0 ? [...deduped, ...prev] : prev;
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    seenPaymentIds.current = null;
    seenAnnouncementIds.current = null;
    seenOrderStatuses.current = null;

    let cancelled = false;

    async function pollAdminPayments() {
      const month = currentMonthParam();
      const res = await apiGet<{ ok: true } & DashboardData>('dashboard', { month_from: month, month_to: month });
      if (cancelled) return;

      const ids = res.recent_payments.map((p) => String(p.id));
      if (seenPaymentIds.current === null) {
        seenPaymentIds.current = new Set(ids);
        return;
      }

      const fresh = res.recent_payments.filter((p) => !seenPaymentIds.current!.has(String(p.id)));
      if (fresh.length === 0) return;
      fresh.forEach((p) => seenPaymentIds.current!.add(String(p.id)));

      addNotifications(fresh.map((p) => paymentNotification(p.id, p.customer_name, p.owner_name, Number(p.total_amount))), paymentPlayerRef.current);
    }

    async function pollOwnInvoices() {
      // api/invoices already scopes results to the caller's own invoices for non-admin roles.
      const res = await apiGet<{ ok: true; invoices: Invoice[] }>('invoices', { status: 'paid', page: 1 });
      if (cancelled) return;

      const ids = res.invoices.map((inv) => String(inv.id));
      if (seenPaymentIds.current === null) {
        seenPaymentIds.current = new Set(ids);
        return;
      }

      const fresh = res.invoices.filter((inv) => !seenPaymentIds.current!.has(String(inv.id)));
      if (fresh.length === 0) return;
      fresh.forEach((inv) => seenPaymentIds.current!.add(String(inv.id)));

      addNotifications(fresh.map((inv) => paymentNotification(inv.id, inv.customer_name, inv.owner_name, Number(inv.total_amount))), paymentPlayerRef.current);
    }

    async function pollAnnouncements() {
      const res = await apiGet<{ ok: true; notifications: AnnouncementApi[] }>('notifications');
      if (cancelled) return;

      const ids = res.notifications.map((a) => String(a.id));
      if (seenAnnouncementIds.current === null) {
        // First load: announcements already exist server-side, so show them right away (read, no sound) —
        // unlike payments, these aren't a noisy rolling feed and the user should see what's currently posted.
        seenAnnouncementIds.current = new Set(ids);
        addSilently(res.notifications.map(announcementNotification));
        return;
      }

      const fresh = res.notifications.filter((a) => !seenAnnouncementIds.current!.has(String(a.id)));
      if (fresh.length === 0) return;
      fresh.forEach((a) => seenAnnouncementIds.current!.add(String(a.id)));

      addNotifications(fresh.map(announcementNotification), announcementPlayerRef.current);
    }

    async function pollRooftopOrders() {
      const res = await apiGet<{ ok: true; orders: RooftopOrder[] }>('rooftopMyOrders');
      if (cancelled) return;

      if (seenOrderStatuses.current === null) {
        // First load: just record current statuses — don't notify for transitions that
        // already happened before the app was open.
        seenOrderStatuses.current = new Map(res.orders.map((o) => [String(o.id), o.status]));
        return;
      }

      const additions: Notification[] = [];
      for (const order of res.orders) {
        const key = String(order.id);
        const prevStatus = seenOrderStatuses.current.get(key);
        if (prevStatus !== order.status) {
          seenOrderStatuses.current.set(key, order.status);
          const notification = orderStatusNotification(order);
          if (notification) additions.push(notification);
        }
      }
      addNotifications(additions, announcementPlayerRef.current);
    }

    async function poll() {
      try {
        await Promise.all([isAdmin ? pollAdminPayments() : pollOwnInvoices(), pollAnnouncements(), pollRooftopOrders()]);
      } catch {
        // Silent — notification polling shouldn't surface errors to the user.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, isAdmin, addNotifications, addSilently]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo<NotificationsState>(
    () => ({ notifications, unreadCount, markAllRead }),
    [notifications, unreadCount, markAllRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsState {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
