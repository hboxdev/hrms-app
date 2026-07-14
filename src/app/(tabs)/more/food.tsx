import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Card, EmptyState, ErrorView, LoadingView, SectionTitle } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BrandDark, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiGet, apiPostJson, ApiError } from '@/lib/api-client';
import type { RooftopMenuItem } from '@/lib/types';

const ROOFTOP_IMAGE_BASE = 'https://secure.hboxdigital.com/uploads/rooftop/';

function pkr(n: number) {
  return 'Rs ' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default function FoodMenuScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [items, setItems] = useState<RooftopMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    apiGet<{ ok: true; items: RooftopMenuItem[] }>('rooftopMenu')
      .then((res) => setItems(res.items.map((i) => ({ ...i, id: Number(i.id) }))))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Something went wrong'))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, RooftopMenuItem[]>();
    for (const item of items) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return Array.from(byCategory.entries());
  }, [items]);

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const { cartCount, cartTotal } = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const [id, qty] of Object.entries(cart)) {
      const item = itemById.get(Number(id));
      if (item) {
        count += qty;
        total += Number(item.price) * qty;
      }
    }
    return { cartCount: count, cartTotal: total };
  }, [cart, itemById]);

  function setQty(id: number, qty: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  async function submitOrder() {
    setPlacing(true);
    try {
      const cartPayload = Object.entries(cart).map(([id, qty]) => ({ id: Number(id), qty }));
      await apiPostJson<{ ok: true; order_id: number }>('rooftopPlaceOrder', { cart: cartPayload, notes });
      setCart({});
      setNotes('');
      setCheckoutOpen(false);
      Alert.alert('Order placed!', 'Your food is on its way.', [
        { text: 'View My Orders', onPress: () => router.push('/more/orders') },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (e) {
      Alert.alert('Order failed', e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setPlacing(false);
    }
  }

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} />;

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + Spacing.four }]}>
        <Pressable onPress={() => router.push('/more/orders')} style={styles.myOrdersLink}>
          <ThemedText type="small" style={{ color: Brand, fontWeight: '600' }}>My Orders</ThemedText>
          <Ionicons name="chevron-forward" size={14} color={Brand} />
        </Pressable>

        {grouped.length === 0 ? (
          <EmptyState title="No items available" sub="Check back later" />
        ) : (
          grouped.map(([category, categoryItems]) => (
            <View key={category}>
              <SectionTitle>{category}</SectionTitle>
              {categoryItems.map((item) => {
                const qty = cart[item.id] ?? 0;
                return (
                  <Card key={item.id} style={styles.itemCard}>
                    {item.image ? (
                      <Image source={{ uri: ROOFTOP_IMAGE_BASE + item.image }} style={styles.itemImage} />
                    ) : (
                      <View style={[styles.itemImage, styles.itemImageFallback, { backgroundColor: theme.backgroundSelected }]}>
                        <Ionicons name="restaurant-outline" size={22} color={theme.textSecondary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <ThemedText type="default">{item.name}</ThemedText>
                      {item.description ? (
                        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                          {item.description}
                        </ThemedText>
                      ) : null}
                      <View style={styles.itemMeta}>
                        <ThemedText type="smallBold">{pkr(Number(item.price))}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary"> · {item.estimated_time}m</ThemedText>
                      </View>
                    </View>

                    {qty === 0 ? (
                      <AnimatedPressable onPress={() => setQty(item.id, 1)} style={[styles.addBtn, { backgroundColor: Brand }]}>
                        <ThemedText style={{ color: BrandDark, fontWeight: '700', fontSize: 13 }}>Add</ThemedText>
                      </AnimatedPressable>
                    ) : (
                      <View style={styles.stepper}>
                        <AnimatedPressable onPress={() => setQty(item.id, qty - 1)} style={styles.stepperBtn}>
                          <ThemedText style={{ fontSize: 16, fontWeight: '700' }}>−</ThemedText>
                        </AnimatedPressable>
                        <ThemedText style={{ fontWeight: '700', minWidth: 20, textAlign: 'center' }}>{qty}</ThemedText>
                        <AnimatedPressable onPress={() => setQty(item.id, qty + 1)} style={styles.stepperBtn}>
                          <ThemedText style={{ fontSize: 16, fontWeight: '700' }}>+</ThemedText>
                        </AnimatedPressable>
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {cartCount > 0 && (
        <AnimatedPressable onPress={() => setCheckoutOpen(true)} style={[styles.cartBar, { marginBottom: tabBarHeight + Spacing.two }]}>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ color: BrandDark, fontWeight: '700' }}>{cartCount} item{cartCount !== 1 ? 's' : ''}</ThemedText>
            <ThemedText style={{ color: BrandDark }}>{pkr(cartTotal)}</ThemedText>
          </View>
          <ThemedText style={{ color: BrandDark, fontWeight: '700' }}>Review Order ›</ThemedText>
        </AnimatedPressable>
      )}

      <Modal visible={checkoutOpen} animationType="slide" transparent onRequestClose={() => setCheckoutOpen(false)}>
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.backdrop} onPress={() => setCheckoutOpen(false)} />
          <ThemedView type="backgroundElement" style={[styles.sheet, { paddingBottom: insets.bottom || Spacing.three }]}>
            <View style={styles.handle} />
            <ThemedText type="subtitle" style={{ fontSize: 20, marginBottom: Spacing.two }}>Your Order</ThemedText>

            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {Object.entries(cart).map(([id, qty]) => {
                const item = itemById.get(Number(id));
                if (!item) return null;
                return (
                  <View key={id} style={styles.checkoutRow}>
                    <ThemedText style={{ flex: 1 }}>{qty}× {item.name}</ThemedText>
                    <ThemedText type="smallBold">{pkr(Number(item.price) * qty)}</ThemedText>
                  </View>
                );
              })}
            </ScrollView>

            <View style={[styles.checkoutRow, { borderTopWidth: StyleSheet.hairlineWidth }]}>
              <ThemedText type="smallBold">Total</ThemedText>
              <ThemedText type="smallBold">{pkr(cartTotal)}</ThemedText>
            </View>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes for kitchen (optional)"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[styles.notesInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />

            <AnimatedPressable onPress={submitOrder} disabled={placing} style={[styles.placeBtn, { opacity: placing ? 0.6 : 1 }]}>
              <ThemedText style={{ color: BrandDark, fontWeight: '700' }}>{placing ? 'Placing order…' : 'Place Order'}</ThemedText>
            </AnimatedPressable>
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  myOrdersLink: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginBottom: Spacing.two },
  itemCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  itemImage: { width: 56, height: 56, borderRadius: 12 },
  itemImageFallback: { alignItems: 'center', justifyContent: 'center' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  addBtn: { paddingHorizontal: Spacing.three, paddingVertical: 8, borderRadius: 10 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120,120,128,0.15)',
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 16,
    backgroundColor: Brand,
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    marginTop: 'auto',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.three,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(120,120,128,0.3)',
    alignSelf: 'center',
    marginVertical: Spacing.two,
  },
  checkoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two,
    marginTop: Spacing.two,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  placeBtn: {
    backgroundColor: Brand,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
});
