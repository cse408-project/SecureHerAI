// Platform-specific exports
// Metro will resolve .web.tsx files automatically on web platform

// Default export for native platforms
export { default } from "./MapComponent.native";
export type {
  MapComponentRef,
  MapLocation,
  MapMarker,
  MapComponentProps,
} from "./MapComponent.native";
export type { Region, MapPressEvent } from "./MapComponent.native";
