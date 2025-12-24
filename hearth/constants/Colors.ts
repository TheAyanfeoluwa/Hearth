/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#D97706'; // Warm Amber
const tintColorDark = '#F59E0B'; // Lighter Amber

export default {
  light: {
    text: '#292524', // Stone 800
    background: '#FDF6E3', // Cream / Solarized Light base
    tint: tintColorLight,
    icon: '#78716C', // Stone 500
    tabIconDefault: '#78716C', // Stone 500
    tabIconSelected: tintColorLight,
    card: '#FFFBF0', // Slightly lighter cream
    border: '#E7E5E4', // Stone 200
    notification: '#EA580C', // Orange 600
  },
  dark: {
    text: '#F5F5F4', // Stone 100
    background: '#1C1917', // Stone 900
    tint: tintColorDark,
    icon: '#A8A29E', // Stone 400
    tabIconDefault: '#A8A29E', // Stone 400
    tabIconSelected: tintColorDark,
    card: '#292524', // Stone 800
    border: '#44403C', // Stone 700
    notification: '#EA580C', // Orange 600
  },
  // Custom Cozy Palette
  cozy: {
    flame: '#F97316', // Orange 500
    ember: '#DC2626', // Red 600
    wood: '#78350F', // Amber 900
    cream: '#FEF3C7', // Amber 100
    sky: '#0EA5E9', // Sky 500 (for premium flames etc)
    grass: '#22C55E', // Green 500
  }
};
