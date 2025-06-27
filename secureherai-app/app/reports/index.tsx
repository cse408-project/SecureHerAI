import { Redirect } from "expo-router";

export default function ReportsIndex() {
  // Redirect to the reports tab
  return <Redirect href="/(tabs)/reports" />;
}
