import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, BrandDark } from '@/constants/theme';

export const PROFILE_IMAGE_BASE = 'https://secure.hboxdigital.com/uploads/employees/';

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export function Avatar({
  name,
  imagePath,
  size = 40,
}: {
  name: string;
  imagePath?: string | null;
  size?: number;
}) {
  const style = { width: size, height: size, borderRadius: size * 0.3 };

  if (imagePath) {
    return <Image source={{ uri: PROFILE_IMAGE_BASE + imagePath }} style={[styles.avatar, style]} />;
  }

  return (
    <View style={[styles.avatar, styles.fallback, style]}>
      <ThemedText style={[styles.text, { fontSize: size * 0.38 }]}>{initials(name)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: Brand,
  },
  text: {
    color: BrandDark,
    fontWeight: '800',
  },
});
