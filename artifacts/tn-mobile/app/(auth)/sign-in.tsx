import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/auth";
import { useColors } from "@/hooks/useColors";

export default function SignInScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    setBusy(true);
    try {
      await signIn(identifier.trim(), password);
      router.replace("/my-reports");
    } catch (err) {
      const message =
        (err as { data?: { error?: string } | null })?.data?.error ??
        "Sign in failed. Please try again.";
      setFormError(message);
    } finally {
      setBusy(false);
    }
  };

  const topPad = Platform.OS === "web" ? 24 : insets.top + 12;

  const inputStyle = {
    borderWidth: 1,
    borderColor: c.input,
    backgroundColor: c.card,
    color: c.foreground,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "web" ? 12 : 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
  } as const;

  const labelStyle = {
    fontSize: 13,
    color: c.foreground,
    fontFamily: "Inter_500Medium",
    marginTop: 14,
  } as const;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{
        paddingTop: topPad,
        paddingHorizontal: 20,
        paddingBottom: 40,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ marginBottom: 16, alignSelf: "flex-start" }}
      >
        <Feather name="arrow-left" size={24} color={c.foreground} />
      </Pressable>

      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          backgroundColor: c.secondary,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <Feather name="shield" size={26} color={c.primary} />
      </View>
      <Text
        style={{
          fontSize: 24,
          color: c.foreground,
          fontFamily: "Inter_700Bold",
        }}
      >
        Welcome back
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: c.mutedForeground,
          fontFamily: "Inter_400Regular",
          marginTop: 4,
        }}
      >
        Sign in to see the complaints you've filed
      </Text>

      <Text style={labelStyle}>Email or mobile number</Text>
      <TextInput
        style={inputStyle}
        autoCapitalize="none"
        value={identifier}
        placeholder="you@example.com or 98765 43210"
        placeholderTextColor={c.mutedForeground}
        onChangeText={setIdentifier}
        keyboardType="email-address"
      />

      <Text style={labelStyle}>Password</Text>
      <TextInput
        style={inputStyle}
        value={password}
        placeholder="Your password"
        placeholderTextColor={c.mutedForeground}
        secureTextEntry
        onChangeText={setPassword}
      />

      {formError && (
        <Text
          style={{
            color: c.destructive,
            fontSize: 13,
            fontFamily: "Inter_400Regular",
            marginTop: 10,
          }}
        >
          {formError}
        </Text>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={!identifier.trim() || !password || busy}
        style={({ pressed }) => ({
          backgroundColor: c.primary,
          opacity:
            !identifier.trim() || !password || busy
              ? 0.5
              : pressed
                ? 0.85
                : 1,
          borderRadius: 10,
          paddingVertical: 14,
          alignItems: "center",
          marginTop: 20,
        })}
      >
        {busy ? (
          <ActivityIndicator color={c.primaryForeground} />
        ) : (
          <Text
            style={{
              color: c.primaryForeground,
              fontSize: 15,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Sign in
          </Text>
        )}
      </Pressable>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 18,
        }}
      >
        <Text
          style={{
            color: c.mutedForeground,
            fontSize: 14,
            fontFamily: "Inter_400Regular",
          }}
        >
          Don't have an account?{" "}
        </Text>
        <Link href="/(auth)/sign-up" replace>
          <Text
            style={{
              color: c.primary,
              fontSize: 14,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Sign up
          </Text>
        </Link>
      </View>
    </ScrollView>
  );
}
