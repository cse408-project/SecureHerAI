import { View, Animated, Easing } from "react-native";
import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Header from "../../src/components/Header";
import QuickAction from "../../src/components/QuickAction";
import NotificationModal from "../../src/components/NotificationModal";

export default function Home() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState<Animated.CompositeAnimation | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = [
    { id: 1, message: "SOS Alert sent successfully!" },
    { id: 2, message: "Location shared with trusted contacts." },
    { id: 3, message: "Test notification." },
  ];

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    setPulseAnimation(anim);
    anim.start();
    return () => {
      anim.stop();
    };
  }, [pulseAnim]);

  const handlePressIn = () => {
    if (pulseAnimation) pulseAnimation.stop();
    pressTimer.current = setTimeout(() => {
      setIsPressed(true);
      triggerSOS();
    }, 3000); // 3 seconds press
  };

  const handlePressOut = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    setIsPressed(false);
    // Only restart animation if SOS was not triggered
    if (pulseAnimation && !isPressed) pulseAnimation.start();
  };

  const triggerSOS = async () => {
    try {
      // TODO: Implement actual SOS functionality
      console.log('SOS Triggered!');
      // Navigate to SOS details
      router.push('/(tabs)/sos' as any);
      // Do not restart animation here; keep it paused after SOS
    } catch (error) {
      console.error('Error triggering SOS:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'linear-gradient(180deg, #FFE4D6 0%, #FFD6E4 100%)' }}>
      <StatusBar style="light" />
      <Header
        title="SecureHer AI"
        onNotificationPress={() => setShowNotifications(true)}
        showNotificationDot={notifications.length > 0}
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            width: 192,
            height: 192,
            borderRadius: 96,
            backgroundColor: '#67082F',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#67082F',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12,
            marginBottom: 24,
          }}
        >
          <View
            style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: 96, backgroundColor: 'white', opacity: 0.15 }}
          />
          <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Animated.Text style={{ color: 'white', fontSize: 48, fontWeight: 'bold', letterSpacing: 2 }}>SOS</Animated.Text>
            <Animated.Text style={{ color: 'white', fontSize: 14, marginTop: 8 }}>Press 3 seconds</Animated.Text>
          </View>
          {/* Add press handlers to the Animated.View for SOS */}
          <View
            style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: 96 }}
            pointerEvents="box-none"
          >
            <View
              style={{ flex: 1 }}
              onStartShouldSetResponder={() => true}
              onResponderGrant={handlePressIn}
              onResponderRelease={handlePressOut}
              onResponderTerminate={handlePressOut}
            />
          </View>
        </Animated.View>
        {isPressed && (
          <View style={{ marginTop: 24, padding: 16, backgroundColor: '#fee2e2', borderRadius: 12, width: '100%' }}>
            <Animated.Text style={{ color: '#dc2626', textAlign: 'center', fontWeight: '600' }}>
              SOS Alert Triggered! Help is on the way.
            </Animated.Text>
          </View>
        )}
        <View style={{ width: '100%', marginTop: 32, flexDirection: 'row', justifyContent: 'space-around' }}>
          <QuickAction
            icon="location-on"
            label="Share Location"
            onPress={() => router.push('/(tabs)/map' as any)}
          />
          <QuickAction
            icon="record-voice-over"
            label="Record Audio"
            onPress={() => {}}
          />
          <QuickAction
            icon="phone"
            label="Emergency Call"
            onPress={() => router.push('/(tabs)/contacts' as any)}
          />
        </View>
      </View>
      <NotificationModal
        visible={showNotifications}
        notifications={notifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}
