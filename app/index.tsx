import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const router = useRouter();
  const { token, role, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (token) {
      if (role === 'admin' || role === 'manager') {
        router.replace("/(drawer)/Master_dashboard");
      } else {
        router.replace("/(drawer)/dashboard");
      }
    } else {
      router.replace("/auth/login");
    }
  }, [token, role, isLoading]);

  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}