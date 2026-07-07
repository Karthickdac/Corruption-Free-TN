import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useTrackComplaint } from "@workspace/api-client-react";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import { formatDate, statusColor, statusLabel } from "@/lib/complaint";

const RECENT_KEY = "tn.recentComplaintNumbers";

export default function TrackScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ number?: string }>();

  const [input, setInput] = useState<string>("");
  const [activeNumber, setActiveNumber] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as string[];
          setRecent(parsed);
        } catch {
          // ignore corrupted storage
        }
      }
    });
  }, []);

  useEffect(() => {
    if (typeof params.number === "string" && params.number.length > 0) {
      setInput(params.number);
      setActiveNumber(params.number);
    }
  }, [params.number]);

  const {
    data: complaint,
    isLoading,
    isError,
    error,
  } = useTrackComplaint(activeNumber ?? "", {
    query: {
      enabled: !!activeNumber,
      retry: false,
      queryKey: ["trackComplaint", activeNumber],
    },
  });

  useEffect(() => {
    if (complaint && activeNumber) {
      setRecent((prev) => {
        const next = [
          activeNumber,
          ...prev.filter((n) => n !== activeNumber),
        ].slice(0, 5);
        AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [complaint, activeNumber]);

  const topPad = Platform.OS === "web" ? 67 + 12 : insets.top + 12;

  const search = (num?: string) => {
    const value = (num ?? input).trim().toUpperCase();
    if (!value) return;
    setInput(value);
    setActiveNumber(value);
  };

  const notFound =
    isError && (error as { status?: number } | null)?.status === 404;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{
        paddingTop: topPad,
        paddingHorizontal: 16,
        paddingBottom: 110,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={{
          fontSize: 24,
          color: c.foreground,
          fontFamily: "Inter_700Bold",
        }}
      >
        Track Complaint
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: c.mutedForeground,
          fontFamily: "Inter_400Regular",
          marginTop: 2,
          marginBottom: 16,
        }}
      >
        Enter your complaint number, e.g. CFT-2026-000123
      </Text>

      <View style={styles.searchRow}>
        <TextInput
          testID="input-track-number"
          value={input}
          onChangeText={setInput}
          placeholder="CFT-YYYY-XXXXXX"
          placeholderTextColor={c.mutedForeground}
          autoCapitalize="characters"
          autoCorrect={false}
          onSubmitEditing={() => search()}
          style={[
            styles.searchInput,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              color: c.foreground,
            },
          ]}
        />
        <Pressable
          testID="track-search"
          onPress={() => search()}
          style={({ pressed }) => [
            styles.searchButton,
            { backgroundColor: c.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="search" size={18} color={c.primaryForeground} />
        </Pressable>
      </View>

      {recent.length > 0 && !complaint && !isLoading ? (
        <View style={{ marginTop: 18 }}>
          <Text
            style={{
              fontSize: 13,
              color: c.mutedForeground,
              fontFamily: "Inter_600SemiBold",
              marginBottom: 8,
            }}
          >
            RECENT
          </Text>
          {recent.map((num) => (
            <Pressable
              key={num}
              onPress={() => search(num)}
              style={({ pressed }) => [
                styles.recentRow,
                {
                  backgroundColor: c.card,
                  borderColor: c.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather name="clock" size={15} color={c.mutedForeground} />
              <Text
                style={{
                  color: c.foreground,
                  fontSize: 14,
                  fontFamily: "Inter_500Medium",
                }}
              >
                {num}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : null}

      {notFound ? (
        <View style={styles.center}>
          <Feather name="file-minus" size={28} color={c.mutedForeground} />
          <Text
            testID="track-not-found"
            style={{
              color: c.mutedForeground,
              fontFamily: "Inter_400Regular",
              textAlign: "center",
            }}
          >
            No complaint found with number {activeNumber}. Check the number and
            try again.
          </Text>
        </View>
      ) : isError && activeNumber ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={28} color={c.mutedForeground} />
          <Text
            style={{
              color: c.mutedForeground,
              fontFamily: "Inter_400Regular",
              textAlign: "center",
            }}
          >
            Could not reach the server. Please try again.
          </Text>
        </View>
      ) : null}

      {complaint ? (
        <View style={{ marginTop: 18, gap: 12 }}>
          <View
            style={[
              styles.card,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text
                style={{
                  color: c.mutedForeground,
                  fontSize: 12,
                  fontFamily: "Inter_600SemiBold",
                  letterSpacing: 0.5,
                }}
              >
                {complaint.complaintNumber}
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: `${statusColor(complaint.status, c)}22` },
                ]}
              >
                <Text
                  testID="track-status"
                  style={{
                    color: statusColor(complaint.status, c),
                    fontSize: 12,
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  {statusLabel(complaint.status)}
                </Text>
              </View>
            </View>
            <Text
              style={{
                color: c.foreground,
                fontSize: 17,
                fontFamily: "Inter_600SemiBold",
                marginTop: 8,
              }}
            >
              {complaint.title}
            </Text>
            <Text
              style={{
                color: c.mutedForeground,
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                marginTop: 6,
              }}
            >
              {complaint.description}
            </Text>
            <View style={styles.metaRow}>
              {complaint.districtName ? (
                <View style={styles.metaItem}>
                  <Feather name="map-pin" size={13} color={c.mutedForeground} />
                  <Text style={[styles.metaText, { color: c.mutedForeground }]}>
                    {complaint.districtName}
                  </Text>
                </View>
              ) : null}
              {complaint.categoryName ? (
                <View style={styles.metaItem}>
                  <Feather name="tag" size={13} color={c.mutedForeground} />
                  <Text style={[styles.metaText, { color: c.mutedForeground }]}>
                    {complaint.categoryName}
                  </Text>
                </View>
              ) : null}
              <View style={styles.metaItem}>
                <Feather name="calendar" size={13} color={c.mutedForeground} />
                <Text style={[styles.metaText, { color: c.mutedForeground }]}>
                  {formatDate(complaint.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {complaint.statusHistory && complaint.statusHistory.length > 0 ? (
            <View
              style={[
                styles.card,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              <Text
                style={{
                  color: c.foreground,
                  fontSize: 15,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 12,
                }}
              >
                Status Timeline
              </Text>
              {complaint.statusHistory.map((item, idx) => (
                <View key={`${item.status}-${idx}`} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: statusColor(item.status, c) },
                      ]}
                    />
                    {idx < (complaint.statusHistory?.length ?? 0) - 1 ? (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: c.border },
                        ]}
                      />
                    ) : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 14 }}>
                    <Text
                      style={{
                        color: c.foreground,
                        fontSize: 14,
                        fontFamily: "Inter_600SemiBold",
                      }}
                    >
                      {statusLabel(item.status)}
                    </Text>
                    <Text
                      style={{
                        color: c.mutedForeground,
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        marginTop: 2,
                      }}
                    >
                      {formatDate(item.changedAt)}
                    </Text>
                    {item.note ? (
                      <Text
                        style={{
                          color: c.mutedForeground,
                          fontSize: 13,
                          fontFamily: "Inter_400Regular",
                          marginTop: 4,
                        }}
                      >
                        {item.note}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {complaint.departmentResponses &&
          complaint.departmentResponses.length > 0 ? (
            <View
              style={[
                styles.card,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              <Text
                style={{
                  color: c.foreground,
                  fontSize: 15,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 12,
                }}
              >
                Department Responses
              </Text>
              {complaint.departmentResponses.map((resp) => (
                <View key={resp.id} style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      color: c.foreground,
                      fontSize: 14,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {resp.content}
                  </Text>
                  <Text
                    style={{
                      color: c.mutedForeground,
                      fontSize: 12,
                      fontFamily: "Inter_400Regular",
                      marginTop: 4,
                    }}
                  >
                    {formatDate(resp.createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: colors.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  searchButton: {
    width: 48,
    borderRadius: colors.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: colors.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: colors.radius,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
  },
  timelineLeft: {
    alignItems: "center",
    width: 14,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 2,
  },
});
