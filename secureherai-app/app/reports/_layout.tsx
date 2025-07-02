import { Stack } from "expo-router";

export default function ReportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="submit"
        options={{
          title: "Submit Report",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          title: "Report Details",
        }}
      />
      <Stack.Screen
        name="evidence"
        options={{
          title: "Upload Evidence",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
