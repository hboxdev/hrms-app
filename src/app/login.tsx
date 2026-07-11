import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const { user, loading, login } = useAuth();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) return <Redirect href="/" />;

  async function onSubmit() {
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
          <View style={styles.container}>
            <View style={[styles.logo, { backgroundColor: '#4F8EF7' }]}>
              <ThemedText type="title" style={styles.logoText}>HB</ThemedText>
            </View>
            <ThemedText type="title" style={styles.title}>HBOX HRMS</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>Sign in to your account</ThemedText>

            <View style={styles.form}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.label}>Email</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholder="you@hboxdigital.com"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.backgroundElement }]}
              />

              <ThemedText type="small" themeColor="textSecondary" style={styles.label}>Password</ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.backgroundElement }]}
              />

              {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

              <Pressable
                onPress={onSubmit}
                disabled={busy || !email || !password}
                style={[styles.button, { backgroundColor: '#4F8EF7', opacity: busy || !email || !password ? 0.5 : 1 }]}>
                {busy ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Sign In</ThemedText>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.three,
  },
  logoText: { color: '#fff', fontSize: 26 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: 4, marginBottom: Spacing.five },
  form: { gap: Spacing.one },
  label: { marginBottom: 4, marginTop: Spacing.two, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    marginTop: Spacing.four,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: '#EF4444', textAlign: 'center', marginTop: Spacing.two },
});
