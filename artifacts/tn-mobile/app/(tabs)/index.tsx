import { Feather } from "@expo/vector-icons";
import { useGetPublicStats } from "@workspace/api-client-react";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import { statusColor, statusLabel } from "@/lib/complaint";

function StatCard({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Feather>["name"];
  tint: string;
}) {
  const c = useColors();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      <View
        style={[
          styles.statIcon,
          { backgroundColor: `${tint}22` },
        ]}
      >
        <Feather name={icon} size={16} color={tint} />
      </View>
      <Text
        style={{
          fontSize: 24,
          color: c.foreground,
          fontFamily: "Inter_700Bold",
        }}
      >
        {value.toLocaleString("en-IN")}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: c.mutedForeground,
          fontFamily: "Inter_500Medium",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function RankedList({
  title,
  items,
}: {
  title: string;
  items: { name: string; count: number }[];
}) {
  const c = useColors();
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <Text
        style={{
          fontSize: 15,
          color: c.foreground,
          fontFamily: "Inter_600SemiBold",
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      {items.length === 0 ? (
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular" }}>
          No data yet
        </Text>
      ) : (
        items.map((item) => (
          <View key={item.name} style={styles.rankRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.rankLabelRow}>
                <Text
                  style={{
                    color: c.foreground,
                    fontSize: 13,
                    fontFamily: "Inter_500Medium",
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  style={{
                    color: c.mutedForeground,
                    fontSize: 13,
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  {item.count}
                </Text>
              </View>
              <View
                style={[styles.barTrack, { backgroundColor: c.muted }]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: c.primary,
                      width: `${Math.max((item.count / max) * 100, 4)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

export default function TransparencyScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch, isRefetching } =
    useGetPublicStats();

  const topPad = Platform.OS === "web" ? 67 + 12 : insets.top + 12;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{
        paddingTop: topPad,
        paddingHorizontal: 16,
        paddingBottom: 110,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={c.primary}
        />
      }
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 24,
              color: c.foreground,
              fontFamily: "Inter_700Bold",
            }}
          >
            CorruptionFree TN
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: c.mutedForeground,
              fontFamily: "Inter_400Regular",
              marginTop: 2,
            }}
          >
            Public transparency dashboard for Tamil Nadu
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : isError || !data ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={28} color={c.mutedForeground} />
          <Text
            style={{
              color: c.mutedForeground,
              fontFamily: "Inter_400Regular",
              textAlign: "center",
            }}
          >
            Could not load statistics. Check your connection.
          </Text>
          <Pressable
            testID="stats-retry"
            onPress={() => refetch()}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: c.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text
              style={{
                color: c.primaryForeground,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Complaints"
              value={data.totalComplaints}
              icon="file-text"
              tint={c.primary}
            />
            <StatCard
              label="Resolved"
              value={data.resolved}
              icon="check-circle"
              tint={c.success}
            />
            <StatCard
              label="Under Investigation"
              value={data.underInvestigation}
              icon="search"
              tint={c.warning}
            />
            <StatCard
              label="Pending"
              value={data.pending}
              icon="clock"
              tint={c.mutedForeground}
            />
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <Text
              style={{
                fontSize: 15,
                color: c.foreground,
                fontFamily: "Inter_600SemiBold",
                marginBottom: 12,
              }}
            >
              By Status
            </Text>
            {data.byStatus.length === 0 ? (
              <Text
                style={{
                  color: c.mutedForeground,
                  fontFamily: "Inter_400Regular",
                }}
              >
                No complaints yet
              </Text>
            ) : (
              data.byStatus.map((s) => (
                <View key={s.status} style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statusColor(s.status, c) },
                    ]}
                  />
                  <Text
                    style={{
                      flex: 1,
                      color: c.foreground,
                      fontSize: 13,
                      fontFamily: "Inter_500Medium",
                    }}
                  >
                    {statusLabel(s.status)}
                  </Text>
                  <Text
                    style={{
                      color: c.mutedForeground,
                      fontSize: 13,
                      fontFamily: "Inter_600SemiBold",
                    }}
                  >
                    {s.count}
                  </Text>
                </View>
              ))
            )}
          </View>

          <RankedList title="Top Districts" items={data.topDistricts} />
          <RankedList title="Top Departments" items={data.topDepartments} />
          <RankedList title="Top Categories" items={data.topCategories} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: colors.radius,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: colors.radius,
    padding: 14,
    gap: 6,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: colors.radius,
    padding: 16,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  rankLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  barTrack: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: 5,
    borderRadius: 3,
  },
});
