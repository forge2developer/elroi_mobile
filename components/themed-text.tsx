import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        style,
      ]}
      className={
        type === 'default' ? 'text-[16px] leading-6' :
          type === 'defaultSemiBold' ? 'text-[16px] leading-6 font-semibold' :
            type === 'title' ? 'text-[32px] font-bold leading-8' :
              type === 'subtitle' ? 'text-[20px] font-bold' :
                type === 'link' ? 'leading-[30px] text-[16px] text-[#0a7ea4]' :
                  ''
      }
      {...rest}
    />
  );
}
