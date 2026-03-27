import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        // Check role to decide which dashboard
        const role = await AsyncStorage.getItem("userRole");
        if (role === 'admin' || role === 'manager') {
          router.replace("/(drawer)/Master_dashboard");
        } else {
          router.replace("/(drawer)/dashboard");
        }
      } else {
        // not logged in → go login
        router.replace("/auth/login");
      }
    } catch (error) {
      router.replace("/auth/login");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}