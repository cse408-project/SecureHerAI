import { Stack } from "expo-router";

export default function PlacesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="manage" />
    </Stack>
  );
}
