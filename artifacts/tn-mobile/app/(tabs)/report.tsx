import { Feather } from "@expo/vector-icons";
import {
  useAddEvidence,
  useCreateComplaint,
  useListComplaintCategories,
  useListDistricts,
  useRequestUploadUrl,
  type DuplicateCheckResponse,
} from "@workspace/api-client-react";
import { File as FSFile } from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { fetch as expoFetch } from "expo/fetch";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
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
import { useAuth } from "@/contexts/auth";
import { useColors } from "@/hooks/useColors";

interface ApiErrorLike {
  status?: number;
  data?: unknown;
  message?: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

interface Attachment {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
  status: "uploading" | "done" | "error";
  objectPath?: string;
  recorded?: boolean;
}

async function readUploadBody(
  uri: string,
): Promise<{ body: Blob | Uint8Array; size: number }> {
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    const blob = await res.blob();
    return { body: blob, size: blob.size };
  }
  const bytes = await new FSFile(uri).bytes();
  return { body: bytes, size: bytes.byteLength };
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
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [evidenceFailed, setEvidenceFailed] = useState(0);
  const [retryingEvidence, setRetryingEvidence] = useState(false);

  const { isSignedIn } = useAuth();
  const { data: districts } = useListDistricts();
  const { data: categories } = useListComplaintCategories();
  const createComplaint = useCreateComplaint();
  const requestUpload = useRequestUploadUrl();
  const addEvidence = useAddEvidence();
  const [cameraPermission, requestCameraPermission] =
    ImagePicker.useCameraPermissions();

  const canAttach = isSignedIn && !isAnonymous;
  const anyUploading = attachments.some((a) => a.status === "uploading");
  const attachmentsRef = useRef<Attachment[]>(attachments);
  attachmentsRef.current = attachments;

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
    setAttachments([]);
    setAttachError(null);
    setCameraBlocked(false);
    setEvidenceFailed(0);
    setSubmittedId(null);
  };

  const uploadAttachment = async (att: {
    id: string;
    uri: string;
    name: string;
    mimeType: string;
  }) => {
    setAttachments((prev) =>
      prev.map((a) => (a.id === att.id ? { ...a, status: "uploading" } : a)),
    );
    try {
      const { body, size } = await readUploadBody(att.uri);
      if (size > MAX_FILE_SIZE) {
        setAttachments((prev) => prev.filter((a) => a.id !== att.id));
        setAttachError("Photos must be under 20MB.");
        return;
      }
      const { uploadURL, objectPath } = await requestUpload.mutateAsync({
        data: {
          name: att.name,
          size: Math.max(size, 1),
          contentType: att.mimeType,
        },
      });
      const putRes = await expoFetch(uploadURL, {
        method: "PUT",
        body: body as never,
        headers: { "Content-Type": att.mimeType },
      });
      if (!putRes.ok) {
        throw new Error(`Upload failed (${putRes.status})`);
      }
      setAttachments((prev) =>
        prev.map((a) =>
          a.id === att.id ? { ...a, status: "done", objectPath } : a,
        ),
      );
    } catch {
      setAttachments((prev) =>
        prev.map((a) => (a.id === att.id ? { ...a, status: "error" } : a)),
      );
    }
  };

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    setAttachError(null);
    const room = MAX_ATTACHMENTS - attachmentsRef.current.length;
    if (assets.length > Math.max(room, 0)) {
      setAttachError(`You can attach up to ${MAX_ATTACHMENTS} photos.`);
    }
    for (const asset of assets.slice(0, Math.max(room, 0))) {
      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
        setAttachError("Photos must be under 20MB.");
        continue;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const att = {
        id,
        uri: asset.uri,
        name: asset.fileName ?? `evidence-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
      };
      setAttachments((prev) => [...prev, { ...att, status: "uploading" }]);
      void uploadAttachment(att);
    }
  };

  const pickFromCamera = async () => {
    setAttachError(null);
    setCameraBlocked(false);
    let perm = cameraPermission;
    if (!perm?.granted) {
      perm = await requestCameraPermission();
    }
    if (!perm?.granted) {
      if (perm && !perm.canAskAgain && Platform.OS !== "web") {
        setCameraBlocked(true);
        setAttachError(
          "Camera access is blocked. Enable it in Settings to take photos.",
        );
      } else {
        setAttachError("Camera permission is needed to take a photo.");
      }
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) addAssets(result.assets);
  };

  const pickFromLibrary = async () => {
    setAttachError(null);
    setCameraBlocked(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });
      if (!result.canceled) addAssets(result.assets);
    } catch {
      setAttachError("Could not open the photo library.");
    }
  };

  const recordEvidence = async (complaintId: number) => {
    const pending = attachmentsRef.current.filter(
      (a) => a.status === "done" && a.objectPath && !a.recorded,
    );
    let failed = 0;
    for (const a of pending) {
      try {
        await addEvidence.mutateAsync({
          complaintId,
          data: {
            fileUrl: a.objectPath!,
            fileType: a.mimeType,
            description: a.name,
          },
        });
        setAttachments((prev) =>
          prev.map((it) => (it.id === a.id ? { ...it, recorded: true } : it)),
        );
      } catch {
        failed++;
      }
    }
    return failed;
  };

  const retryEvidence = async () => {
    if (submittedId === null) return;
    setRetryingEvidence(true);
    try {
      const failed = await recordEvidence(submittedId);
      setEvidenceFailed(failed);
    } finally {
      setRetryingEvidence(false);
    }
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
    if (anyUploading) {
      setFormError("Please wait for photos to finish uploading.");
      return;
    }
    if (attachments.some((a) => a.status === "error")) {
      setFormError(
        "Some photos failed to upload. Retry or remove them before submitting.",
      );
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
        onSuccess: async (complaint) => {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          }
          setSubmittedId(complaint.id);
          if (canAttach) {
            const failed = await recordEvidence(complaint.id);
            setEvidenceFailed(failed);
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
        {attachments.some((a) => a.recorded) && evidenceFailed === 0 ? (
          <View style={styles.evidenceStatusRow}>
            <Feather name="paperclip" size={14} color={c.success} />
            <Text
              testID="evidence-attached-count"
              style={{
                color: c.mutedForeground,
                fontSize: 13,
                fontFamily: "Inter_500Medium",
              }}
            >
              {attachments.filter((a) => a.recorded).length} photo
              {attachments.filter((a) => a.recorded).length > 1 ? "s" : ""}{" "}
              attached
            </Text>
          </View>
        ) : null}
        {evidenceFailed > 0 ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: `${c.warning}15`,
                borderColor: c.warning,
                alignSelf: "stretch",
              },
            ]}
          >
            <Feather name="alert-triangle" size={16} color={c.warning} />
            <Text
              testID="evidence-failed"
              style={{
                color: c.foreground,
                fontSize: 13,
                flex: 1,
                fontFamily: "Inter_500Medium",
              }}
            >
              {evidenceFailed} photo{evidenceFailed > 1 ? "s" : ""} could not
              be attached.
            </Text>
            <Pressable
              testID="retry-evidence"
              disabled={retryingEvidence}
              onPress={retryEvidence}
              style={({ pressed }) => [
                { opacity: retryingEvidence ? 0.5 : pressed ? 0.6 : 1 },
              ]}
            >
              {retryingEvidence ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : (
                <Text
                  style={{
                    color: c.primary,
                    fontSize: 13,
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  Retry
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}
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

      <View style={styles.field}>
        <Text style={[styles.label, { color: c.foreground }]}>
          Photo Evidence
        </Text>
        {canAttach ? (
          <>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {Platform.OS !== "web" ? (
                <Pressable
                  testID="attach-camera"
                  onPress={pickFromCamera}
                  style={({ pressed }) => [
                    styles.attachButton,
                    {
                      backgroundColor: c.card,
                      borderColor: c.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Feather name="camera" size={16} color={c.primary} />
                  <Text
                    style={{
                      color: c.foreground,
                      fontSize: 13,
                      fontFamily: "Inter_500Medium",
                    }}
                  >
                    Take Photo
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                testID="attach-gallery"
                onPress={pickFromLibrary}
                style={({ pressed }) => [
                  styles.attachButton,
                  {
                    backgroundColor: c.card,
                    borderColor: c.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather name="image" size={16} color={c.primary} />
                <Text
                  style={{
                    color: c.foreground,
                    fontSize: 13,
                    fontFamily: "Inter_500Medium",
                  }}
                >
                  Choose Photo
                </Text>
              </Pressable>
            </View>
            {attachments.map((a) => (
              <View
                key={a.id}
                testID={`attachment-${a.status}`}
                style={[
                  styles.attachmentRow,
                  {
                    backgroundColor: c.card,
                    borderColor:
                      a.status === "error" ? c.destructive : c.border,
                  },
                ]}
              >
                <Image
                  source={{ uri: a.uri }}
                  style={styles.attachmentThumb}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    color: c.foreground,
                    fontSize: 13,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {a.name}
                </Text>
                {a.status === "uploading" ? (
                  <ActivityIndicator size="small" color={c.primary} />
                ) : a.status === "done" ? (
                  <Feather name="check-circle" size={16} color={c.success} />
                ) : (
                  <Pressable
                    testID={`retry-upload-${a.id}`}
                    onPress={() => uploadAttachment(a)}
                    style={({ pressed }) => [
                      styles.retryChip,
                      {
                        borderColor: c.destructive,
                        opacity: pressed ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Feather name="rotate-cw" size={12} color={c.destructive} />
                    <Text
                      style={{
                        color: c.destructive,
                        fontSize: 12,
                        fontFamily: "Inter_600SemiBold",
                      }}
                    >
                      Retry
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  testID={`remove-attachment-${a.id}`}
                  onPress={() =>
                    setAttachments((prev) =>
                      prev.filter((it) => it.id !== a.id),
                    )
                  }
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.5 : 1, padding: 4 },
                  ]}
                >
                  <Feather name="x" size={16} color={c.mutedForeground} />
                </Pressable>
              </View>
            ))}
          </>
        ) : (
          <View
            style={[
              styles.attachHint,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <Feather name="lock" size={14} color={c.mutedForeground} />
            <Text
              testID="attach-hint"
              style={{
                flex: 1,
                color: c.mutedForeground,
                fontSize: 12,
                fontFamily: "Inter_400Regular",
              }}
            >
              {!isSignedIn
                ? "Sign in to attach photo evidence."
                : "Turn off anonymous mode to attach photo evidence."}
            </Text>
          </View>
        )}
        {attachError ? (
          <View style={styles.attachErrorRow}>
            <Text
              testID="attach-error"
              style={{
                flex: 1,
                color: c.destructive,
                fontSize: 12,
                fontFamily: "Inter_500Medium",
              }}
            >
              {attachError}
            </Text>
            {cameraBlocked && Platform.OS !== "web" ? (
              <Pressable
                testID="open-settings"
                onPress={() => {
                  try {
                    Linking.openSettings();
                  } catch {
                    // Settings can't be opened on this platform.
                  }
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Text
                  style={{
                    color: c.primary,
                    fontSize: 12,
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  Open Settings
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
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
  attachButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: colors.radius,
    paddingVertical: 12,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: colors.radius,
    padding: 8,
  },
  attachmentThumb: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: "#00000010",
  },
  attachHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: colors.radius,
    padding: 12,
  },
  attachErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  retryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  evidenceStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
