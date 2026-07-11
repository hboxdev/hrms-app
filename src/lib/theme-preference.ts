import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

const THEME_KEY = 'hbox_theme_preference';

export type ThemePreference = 'system' | 'light' | 'dark';

export async function getThemePreference(): Promise<ThemePreference> {
  const raw = await SecureStore.getItemAsync(THEME_KEY);
  return raw === 'light' || raw === 'dark' ? raw : 'system';
}

export async function setThemePreference(pref: ThemePreference): Promise<void> {
  await SecureStore.setItemAsync(THEME_KEY, pref);
  Appearance.setColorScheme(pref === 'system' ? null : pref);
}

export async function applyStoredThemePreference(): Promise<void> {
  const pref = await getThemePreference();
  if (pref !== 'system') {
    Appearance.setColorScheme(pref);
  }
}
