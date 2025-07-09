import { Stack } from "expo-router";

export default function ReportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      {/* Main reports index redirects to tabs */}
      <Stack.Screen name="index" />
      
      {/* Report submission flow */}
      <Stack.Screen
        name="submit"
        options={{
          title: "Submit Report",
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      
      {/* Report details view */}
      <Stack.Screen
        name="details"
        options={{
          title: "Report Details",
          animation: "slide_from_right",
        }}
      />
      
      {/* Evidence upload flow */}
      <Stack.Screen
        name="evidence"
        options={{
          title: "Upload Evidence",
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
