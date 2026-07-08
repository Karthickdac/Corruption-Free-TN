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

export default function SignUpScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);

    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail && !trimmedPhone) {
      setFormError("Please provide an email address or a mobile number.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await signUp({
        name: name.trim() || undefined,
        email: trimmedEmail || undefined,
        phone: trimmedPhone || undefined,
        password,
      });
      router.replace("/my-reports");
    } catch (err) {
      const message =
        (err as { data?: { error?: string } | null })?.data?.error ??
        "Could not create your account. Please try again.";
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

  const canSubmit =
    (email.trim() || phone.trim()) && password && confirmPassword && !busy;

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
        <Feather name="user-plus" size={26} color={c.primary} />
      </View>
      <Text
        style={{
          fontSize: 24,
          color: c.foreground,
          fontFamily: "Inter_700Bold",
        }}
      >
        Create your account
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: c.mutedForeground,
          fontFamily: "Inter_400Regular",
          marginTop: 4,
        }}
      >
        Sign up with your email or mobile number
      </Text>

      <Text style={labelStyle}>Full name (optional)</Text>
      <TextInput
        style={inputStyle}
        value={name}
        placeholder="Your name"
        placeholderTextColor={c.mutedForeground}
        onChangeText={setName}
      />

      <Text style={labelStyle}>Email</Text>
      <TextInput
        style={inputStyle}
        autoCapitalize="none"
        value={email}
        placeholder="you@example.com"
        placeholderTextColor={c.mutedForeground}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Text style={labelStyle}>Mobile number</Text>
      <TextInput
        style={inputStyle}
        value={phone}
        placeholder="98765 43210"
        placeholderTextColor={c.mutedForeground}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Text
        style={{
          fontSize: 12,
          color: c.mutedForeground,
          fontFamily: "Inter_400Regular",
          marginTop: 4,
        }}
      >
        Provide at least one: email or mobile number
      </Text>

      <Text style={labelStyle}>Password</Text>
      <TextInput
        style={inputStyle}
        value={password}
        placeholder="At least 8 characters"
        placeholderTextColor={c.mutedForeground}
        secureTextEntry
        onChangeText={setPassword}
      />

      <Text style={labelStyle}>Confirm password</Text>
      <TextInput
        style={inputStyle}
        value={confirmPassword}
        placeholder="Re-enter your password"
        placeholderTextColor={c.mutedForeground}
        secureTextEntry
        onChangeText={setConfirmPassword}
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
        disabled={!canSubmit}
        style={({ pressed }) => ({
          backgroundColor: c.primary,
          opacity: !canSubmit ? 0.5 : pressed ? 0.85 : 1,
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
            Sign up
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
          Already have an account?{" "}
        </Text>
        <Link href="/(auth)/sign-in" replace>
          <Text
            style={{
              color: c.primary,
              fontSize: 14,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Sign in
          </Text>
        </Link>
      </View>
    </ScrollView>
  );
}
