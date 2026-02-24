import { useThemeContext } from '@/context/theme-context';

/**
 * On web, we also read from the ThemeContext so the user can manually toggle.
 */
export function useColorScheme() {
  const { colorScheme } = useThemeContext();
  return colorScheme;
}
