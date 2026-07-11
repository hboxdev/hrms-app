import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

const BACKGROUND_GRADIENT = {
  light: 'linear-gradient(180deg, #DCEBFF 0%, #F5F8FF 25%, #FFFFFF 55%)',
  dark: 'linear-gradient(180deg, #0B2A4A 0%, #10151C 25%, #000000 55%)',
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const scheme = useColorScheme();

  const backgroundStyle =
    type === undefined || type === 'background'
      ? { experimental_backgroundImage: BACKGROUND_GRADIENT[scheme === 'dark' ? 'dark' : 'light'] }
      : { backgroundColor: theme[type] };

  return <View style={[backgroundStyle, style]} {...otherProps} />;
}
