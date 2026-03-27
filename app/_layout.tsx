import "@/global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import "react-native-reanimated";

import { ThemeContextProvider } from "@/context/theme-context";
import { AuthProvider } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { config } from "@gluestack-ui/config";
import { GluestackUIProvider } from "@gluestack-ui/themed";

function InnerLayout() {
  const colorScheme = useColorScheme();

  return (
    <GluestackUIProvider config={config} colorMode={colorScheme}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View style={{
          flex: 1,
          backgroundColor: colorScheme === "dark" ? "#000" : "#f5f5f5",
          alignItems: 'center',
        }}>
          <View style={{
            flex: 1,
            width: '100%',
            maxWidth: Platform.OS === 'web' ? 800 : '100%',
            backgroundColor: colorScheme === "dark" ? DarkTheme.colors.background : DefaultTheme.colors.background,
            overflow: 'hidden',
          }}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </View>
        </View>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </GluestackUIProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeContextProvider>
      <AuthProvider>
        <InnerLayout />
      </AuthProvider>
    </ThemeContextProvider>
  );
}