import { Pressable, type PressableProps } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);
const EASE = Easing.out(Easing.quad);

export function AnimatedPressable({ style, onPressIn, onPressOut, ...rest }: PressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressableBase
      style={[animatedStyle, style as object]}
      onPressIn={(e) => {
        scale.value = withTiming(0.98, { duration: 120, easing: EASE });
        opacity.value = withTiming(0.7, { duration: 120, easing: EASE });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: 180, easing: EASE });
        opacity.value = withTiming(1, { duration: 180, easing: EASE });
        onPressOut?.(e);
      }}
      {...rest}
    />
  );
}
