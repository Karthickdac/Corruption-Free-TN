import { Feather } from "@expo/vector-icons";
import {
  useCreateComplaint,
  useListComplaintCategories,
  useListDistricts,
  type DuplicateCheckResponse,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { OptionPicker } from "@/components/OptionPicker";
import colors from "@/constants/colors";
import { useColors } from "@/hooks/useColors";

interface ApiErrorLike {
  status?: number;
  data?: unknown;
  message?: string;
}

export default function ReportScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [districtId, setDistrictId] = useState<number | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [location, setLocation] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<
    DuplicateCheckResponse["duplicates"] | null
  >(null);
  const [submittedNumber, setSubmittedNumber] = useState<string | null>(null);

  const { data: districts } = useListDistricts();
  const { data: categories } = useListComplaintCategories();
  const createComplaint = useCreateComplaint();

  const topPad = Platform.OS === "web" ? 67 + 12 : insets.top + 12;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDistrictId(undefined);
    setCategoryId(undefined);
    setLocation("");
    setAmount("");
    setIsAnonymous(true);
    setDuplicates(null);
    setFormError(null);
  };

  const submit = (confirmDuplicate: boolean) => {
    setFormError(null);
    if (title.trim().length < 5) {
      setFormError("Title must be at least 5 characters.");
      return;
    }
    if (description.trim().length < 20) {
      setFormError("Description must be at least 20 characters.");
      return;
    }
    const parsedAmount = amount.trim() ? Number(amount.trim()) : undefined;
    if (parsedAmount !== undefined && Number.isNaN(parsedAmount)) {
      setFormError("Amount must be a number.");
      return;
    }

    createComplaint.mutate(
      {
        data: {
          title: title.trim(),
          description: description.trim(),
          isAnonymous,
          ...(districtId !== undefined ? { districtId } : {}),
          ...(categoryId !== undefined ? { categoryId } : {}),
          ...(location.trim() ? { location: location.trim() } : {}),
          ...(parsedAmount !== undefined
            ? { amountInvolved: parsedAmount }
            : {}),
          ...(confirmDuplicate ? { confirmDuplicate: true } : {}),
        },
      },
      {
        onSuccess: (complaint) => {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          }
          setSubmittedNumber(complaint.complaintNumber);
          setDuplicates(null);
        },
        onError: (err: unknown) => {
          const apiErr = err as ApiErrorLike;
          if (apiErr.status === 409) {
            const data = apiErr.data as DuplicateCheckResponse | null;
            setDuplicates(data?.duplicates ?? []);
            return;
          }
          const data = apiErr.data as { error?: string } | null;
          setFormError(
            data?.error ??
              "Could not submit your complaint. Please check your connection and try again.",
          );
        },
      },
    );
  };

  if (submittedNumber) {
    return (
      <View
        style={[
          styles.successContainer,
          { backgroundColor: c.background, paddingTop: topPad },
        ]}
      >
        <View
          style={[
            styles.successIcon,
            { backgroundColor: `${c.success}22` },
          ]}
        >
          <Feather name="check-circle" size={40} color={c.success} />
        </View>
        <Text
          style={{
            fontSize: 22,
            color: c.foreground,
            fontFamily: "Inter_700Bold",
            textAlign: "center",
          }}
        >
          Complaint Submitted
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: c.mutedForeground,
            fontFamily: "Inter_400Regular",
            textAlign: "center",
          }}
        >
          Save this number to track your complaint status
        </Text>
        <View
          style={[
            styles.numberBox,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <Text
            testID="submitted-number"
            selectable
            style={{
              fontSize: 20,
              color: c.primary,
              fontFamily: "Inter_700Bold",
              letterSpacing: 1,
            }}
          >
            {submittedNumber}
          </Text>
        </View>
        <Pressable
          testID="go-track"
          onPress={() => {
            const num = submittedNumber;
            setSubmittedNumber(null);
            resetForm();
            router.push({ pathname: "/track", params: { number: num } });
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: c.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="search" size={16} color={c.primaryForeground} />
          <Text
            style={{
              color: c.primaryForeground,
              fontFamily: "Inter_600SemiBold",
              fontSize: 15,
            }}
          >
            Track this complaint
          </Text>
        </Pressable>
        <Pressable
          testID="file-another"
          onPress={() => {
            setSubmittedNumber(null);
            resetForm();
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 10 }]}
        >
          <Text
            style={{
              color: c.mutedForeground,
              fontFamily: "Inter_500Medium",
              fontSize: 14,
            }}
          >
            File another complaint
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{
        paddingTop: topPad,
        paddingHorizontal: 16,
        paddingBottom: 130,
        gap: 14,
      }}
      bottomOffset={80}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <Text
          style={{
            fontSize: 24,
            color: c.foreground,
            fontFamily: "Inter_700Bold",
          }}
        >
          Report Corruption
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: c.mutedForeground,
            fontFamily: "Inter_400Regular",
            marginTop: 2,
          }}
        >
          Your report can be filed anonymously
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: c.foreground }]}>Title *</Text>
        <TextInput
          testID="input-title"
          value={title}
          onChangeText={setTitle}
          placeholder="Brief summary of the incident"
          placeholderTextColor={c.mutedForeground}
          style={[
            styles.input,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              color: c.foreground,
            },
          ]}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: c.foreground }]}>
          Description *
        </Text>
        <TextInput
          testID="input-description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what happened, who was involved, when and where (min 20 characters)"
          placeholderTextColor={c.mutedForeground}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={[
            styles.input,
            styles.textarea,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              color: c.foreground,
            },
          ]}
        />
      </View>

      <OptionPicker
        testID="picker-district"
        label="District"
        placeholder="Select district (optional)"
        options={(districts ?? []).map((d) => ({
          id: d.id,
          label: d.name,
          sublabel: d.nameTa,
        }))}
        selectedId={districtId}
        onSelect={setDistrictId}
      />

      <OptionPicker
        testID="picker-category"
        label="Category"
        placeholder="Select category (optional)"
        options={(categories ?? []).map((cat) => ({
          id: cat.id,
          label: cat.name,
          sublabel: cat.nameTa,
        }))}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />

      <View style={styles.field}>
        <Text style={[styles.label, { color: c.foreground }]}>Location</Text>
        <TextInput
          testID="input-location"
          value={location}
          onChangeText={setLocation}
          placeholder="Office, village or area (optional)"
          placeholderTextColor={c.mutedForeground}
          style={[
            styles.input,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              color: c.foreground,
            },
          ]}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: c.foreground }]}>
          Amount Involved (₹)
        </Text>
        <TextInput
          testID="input-amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 5000 (optional)"
          placeholderTextColor={c.mutedForeground}
          keyboardType="numeric"
          style={[
            styles.input,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              color: c.foreground,
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.anonRow,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: c.foreground,
              fontSize: 14,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Submit anonymously
          </Text>
          <Text
            style={{
              color: c.mutedForeground,
              fontSize: 12,
              fontFamily: "Inter_400Regular",
              marginTop: 2,
            }}
          >
            Your identity will not be recorded
          </Text>
        </View>
        <Switch
          testID="switch-anonymous"
          value={isAnonymous}
          onValueChange={setIsAnonymous}
          trackColor={{ true: c.primary, false: c.muted }}
          thumbColor="#ffffff"
        />
      </View>

      {formError ? (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: `${c.destructive}15`,
              borderColor: c.destructive,
            },
          ]}
        >
          <Feather name="alert-triangle" size={16} color={c.destructive} />
          <Text
            testID="form-error"
            style={{
              color: c.destructive,
              fontSize: 13,
              flex: 1,
              fontFamily: "Inter_500Medium",
            }}
          >
            {formError}
          </Text>
        </View>
      ) : null}

      {duplicates ? (
        <View
          style={[
            styles.duplicateBox,
            { backgroundColor: `${c.warning}15`, borderColor: c.warning },
          ]}
        >
          <View style={styles.duplicateHeader}>
            <Feather name="copy" size={16} color={c.warning} />
            <Text
              style={{
                color: c.foreground,
                fontSize: 14,
                fontFamily: "Inter_600SemiBold",
                flex: 1,
              }}
            >
              Possible duplicate detected
            </Text>
          </View>
          <Text
            style={{
              color: c.mutedForeground,
              fontSize: 13,
              fontFamily: "Inter_400Regular",
            }}
          >
            Similar complaints already exist:
          </Text>
          {duplicates.map((d) => (
            <Text
              key={d.complaintNumber}
              style={{
                color: c.foreground,
                fontSize: 13,
                fontFamily: "Inter_500Medium",
              }}
              numberOfLines={1}
            >
              • {d.complaintNumber} — {d.title}
            </Text>
          ))}
          <View style={styles.duplicateActions}>
            <Pressable
              testID="cancel-duplicate"
              onPress={() => setDuplicates(null)}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: c.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text
                style={{
                  color: c.foreground,
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              testID="confirm-duplicate"
              onPress={() => submit(true)}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: c.primary,
                  borderColor: c.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: c.primaryForeground,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                }}
              >
                Submit anyway
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Pressable
        testID="submit-complaint"
        disabled={createComplaint.isPending}
        onPress={() => submit(false)}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor: c.primary,
            opacity: createComplaint.isPending ? 0.6 : pressed ? 0.8 : 1,
          },
        ]}
      >
        {createComplaint.isPending ? (
          <ActivityIndicator color={c.primaryForeground} size="small" />
        ) : (
          <Feather name="send" size={16} color={c.primaryForeground} />
        )}
        <Text
          style={{
            color: c.primaryForeground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 15,
          }}
        >
          {createComplaint.isPending ? "Submitting..." : "Submit Complaint"}
        </Text>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderWidth: 1,
    borderRadius: colors.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textarea: {
    minHeight: 110,
    paddingTop: 12,
  },
  anonRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: colors.radius,
    padding: 14,
    gap: 10,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: colors.radius,
    padding: 12,
  },
  duplicateBox: {
    borderWidth: 1,
    borderRadius: colors.radius,
    padding: 14,
    gap: 8,
  },
  duplicateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  duplicateActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: colors.radius,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: colors.radius,
    paddingVertical: 14,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  numberBox: {
    borderWidth: 1,
    borderRadius: colors.radius,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
});
