import {
  Button,
  ButtonGroup,
  ButtonIcon,
  ButtonSpinner,
  ButtonText,
  Text,
} from "@gluestack-ui/themed";
import { Save } from "lucide-react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function HomeScreen() {
  const [count, setCount] = useState(0);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>

        {/* Title */}
        <ThemedText type="title">
          Counter App
        </ThemedText>

        {/* Counter */}
        <ThemedText style={{ fontSize: 25, marginVertical: 30 }}>
          {count}
        </ThemedText>

        {/* Buttons container */}
        <ThemedView style={{ flexDirection: "row", justifyContent: "space-between", width: 260, gap: 8 }}>
          <Button
            onPress={() => setCount(count + 1)}
            action="positive"
            style={{ paddingHorizontal: 20, borderRadius: 12 }}
          >
            <Text style={{ color: "white" }}>+ Add</Text>
          </Button>

          <Button
            onPress={() => setCount(count - 1)}
            action="negative"
            style={{ paddingHorizontal: 20, borderRadius: 12 }}
          >
            <Text style={{ color: "white" }}>- Remove</Text>
          </Button>

          <Button
            action="primary"
            onPress={() => setCount(0)}
            style={{ borderRadius: 12 }}
          >
            <Text style={{ color: "white" }}>Reset</Text>
          </Button>
        </ThemedView>

        {/* Save button */}
        <ThemedView style={{ marginTop: 32 }}>
          <ButtonGroup>
            <Button>
              <ButtonIcon as={Save as any} />
              <ButtonText>Save</ButtonText>
              <ButtonSpinner />
            </Button>
          </ButtonGroup>
        </ThemedView>

      </ThemedView>
    </SafeAreaView>
  );
}
