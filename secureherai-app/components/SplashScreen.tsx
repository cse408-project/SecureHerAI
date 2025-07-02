import React, { useEffect, useRef, useState } from "react";
import { Animated, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const taglineFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Minimum display time for splash screen
    const MINIMUM_DISPLAY_TIME = 4000; // 4 seconds
    const startTime = Date.now();

    // Show content after a brief delay
    setTimeout(() => setShowContent(true), 100);

    // Start with logo animation
    Animated.sequence([
      // Logo scale and fade in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      // App name fade in
      Animated.delay(400),
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Tagline fade in
      Animated.delay(300),
      Animated.timing(taglineFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Ensure minimum display time before allowing finish
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_DISPLAY_TIME - elapsedTime);

      setTimeout(() => {
        if (onFinish) onFinish();
      }, remainingTime);
    });

    // Continuous pulse animation for the logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Start pulse after initial animation
    setTimeout(() => pulseAnimation.start(), 1200);

    return () => pulseAnimation.stop();
  }, [scaleAnim, fadeAnim, textFadeAnim, taglineFadeAnim, pulseAnim, onFinish]);

  if (!showContent) {
    return <View className="flex-1 bg-[#67082F]" />;
  }

  return (
    <View className="flex-1 items-center justify-center max-w-screen-md mx-auto w-full">
      <LinearGradient
        colors={["#67082F", "#8B1538", "#4F46E5", "#6366F1"]}
        locations={[0, 0.3, 0.7, 1]}
        className="flex-1 w-full items-center justify-center"
      >
        {/* Enhanced background decoration */}
        <View className="absolute inset-0 opacity-8">
          <View className="absolute top-16 left-8 w-40 h-40 rounded-full bg-white/10" />
          <View className="absolute bottom-24 right-6 w-32 h-32 rounded-full bg-white/8" />
          <View className="absolute top-1/4 right-12 w-20 h-20 rounded-full bg-white/6" />
          <View className="absolute bottom-1/3 left-16 w-16 h-16 rounded-full bg-white/5" />
        </View>

        {/* Main content container */}
        <View className="items-center">
          {/* Logo container with glow effect */}
          <Animated.View
            style={{
              transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
              opacity: fadeAnim,
            }}
            className="items-center mb-8"
          >
            <View className="w-36 h-36 rounded-full bg-white/20 items-center justify-center mb-4 shadow-2xl border-2 border-white/40">
              <View className="w-32 h-32 rounded-full bg-white/15 items-center justify-center">
                <Animated.Image
                  source={require("../assets/images/secureherai_logo.png")}
                  style={{
                    width: 100,
                    height: 100,
                    resizeMode: "contain",
                  }}
                />
              </View>
            </View>
          </Animated.View>

          {/* App name */}
          <Animated.View
            style={{ opacity: textFadeAnim }}
            className="items-center mb-6"
          >
            <Text className="text-white text-5xl font-bold mb-2 text-center tracking-wider">
              SecureHer AI
            </Text>
            <View className="w-24 h-1 bg-white/60 rounded-full" />
          </Animated.View>

          {/* Tagline */}
          <Animated.View
            style={{ opacity: taglineFadeAnim }}
            className="items-center px-8"
          >
            <Text className="text-white/90 text-xl text-center font-medium mb-2">
              Your Safety Companion
            </Text>
            <Text className="text-white/75 text-base text-center font-normal">
              Empowering women through technology
            </Text>
          </Animated.View>
        </View>

        {/* Enhanced loading indicator */}
        <Animated.View
          style={{ opacity: taglineFadeAnim }}
          className="absolute bottom-20 items-center"
        >
          <View className="flex-row space-x-2 mb-4">
            <View className="w-3 h-3 bg-white/70 rounded-full" />
            <View className="w-3 h-3 bg-white/85 rounded-full" />
            <View className="w-3 h-3 bg-white rounded-full" />
          </View>
          <Text className="text-white/80 text-base font-medium">
            Loading...
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
