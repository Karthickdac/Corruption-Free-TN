import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useListMyComplaints } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/auth";
import { useColors } from "@/hooks/useColors";
import { formatDate, statusColor, statusLabel } from "@/lib/complaint";

export default function MyReportsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { isLoaded, isSignedIn, user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await signOut();
    queryClient.removeQueries({ queryKey: ["listMyComplaints"] });
  };

  const {
    data: complaints,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useListMyComplaints({
    query: {
      enabled: !!isSignedIn,
      queryKey: ["listMyComplaints"],
    },
  });

  const topPad = Platform.OS === "web" ? 67 + 12 : insets.top + 12;

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: c.secondary,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <Feather name="shield" size={30} color={c.primary} />
        </View>
        <Text
          style={{
            fontSize: 22,
            color: c.foreground,
            fontFamily: "Inter_700Bold",
            textAlign: "center",
          }}
        >
          My Reports
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: c.mutedForeground,
            fontFamily: "Inter_400Regular",
            textAlign: "center",
            marginTop: 8,
            lineHeight: 20,
          }}
        >
          Sign in to see every complaint you've filed — no need to save
          complaint numbers.
        </Text>
        <Pressable
          onPress={() => router.push("/(auth)/sign-in")}
          style={({ pressed }) => ({
            backgroundColor: c.primary,
            opacity: pressed ? 0.85 : 1,
            borderRadius: 10,
            paddingVertical: 13,
            paddingHorizontal: 32,
            marginTop: 22,
          })}
        >
          <Text
            style={{
              color: c.primaryForeground,
              fontSize: 15,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Sign in
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(auth)/sign-up")}
          style={{ marginTop: 14 }}
        >
          <Text
            style={{
              color: c.primary,
              fontSize: 14,
              fontFamily: "Inter_500Medium",
            }}
          >
            New here? Create an account
          </Text>
        </Pressable>
      </View>
    );
  }

  const email = user?.email ?? user?.phone ?? user?.name ?? "";

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
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={{
              fontSize: 24,
              color: c.foreground,
              fontFamily: "Inter_700Bold",
            }}
          >
            My Reports
          </Text>
          {!!email && (
            <Text
              style={{
                fontSize: 13,
                color: c.mutedForeground,
                fontFamily: "Inter_400Regular",
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {email}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => handleSignOut()}
          hitSlop={8}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.card,
            borderRadius: 8,
            paddingVertical: 7,
            paddingHorizontal: 12,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Feather name="log-out" size={14} color={c.mutedForeground} />
          <Text
            style={{
              color: c.mutedForeground,
              fontSize: 13,
              fontFamily: "Inter_500Medium",
            }}
          >
            Sign out
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : isError ? (
        <View
          style={{
            marginTop: 24,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.card,
            borderRadius: 12,
            padding: 18,
            alignItems: "center",
          }}
        >
          <Feather name="alert-triangle" size={22} color={c.destructive} />
          <Text
            style={{
              fontSize: 14,
              color: c.foreground,
              fontFamily: "Inter_500Medium",
              marginTop: 10,
              textAlign: "center",
            }}
          >
            Couldn't load your complaints
          </Text>
          <Pressable onPress={() => refetch()} style={{ marginTop: 10 }}>
            <Text
              style={{
                color: c.primary,
                fontSize: 14,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Try again
            </Text>
          </Pressable>
        </View>
      ) : !complaints || complaints.length === 0 ? (
        <View
          style={{
            marginTop: 24,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.card,
            borderRadius: 12,
            padding: 24,
            alignItems: "center",
          }}
        >
          <Feather name="inbox" size={26} color={c.mutedForeground} />
          <Text
            style={{
              fontSize: 15,
              color: c.foreground,
              fontFamily: "Inter_600SemiBold",
              marginTop: 12,
            }}
          >
            No complaints yet
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: c.mutedForeground,
              fontFamily: "Inter_400Regular",
              marginTop: 4,
              textAlign: "center",
              lineHeight: 19,
            }}
          >
            Complaints you file while signed in will show up here.
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/report")}
            style={({ pressed }) => ({
              backgroundColor: c.primary,
              opacity: pressed ? 0.85 : 1,
              borderRadius: 10,
              paddingVertical: 11,
              paddingHorizontal: 24,
              marginTop: 16,
            })}
          >
            <Text
              style={{
                color: c.primaryForeground,
                fontSize: 14,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Report corruption
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ marginTop: 18, gap: 12 }}>
          <Text
            style={{
              fontSize: 13,
              color: c.mutedForeground,
              fontFamily: "Inter_400Regular",
            }}
          >
            {complaints.length}{" "}
            {complaints.length === 1 ? "complaint" : "complaints"} filed
          </Text>
          {complaints.map((complaint) => {
            const badge = statusColor(complaint.status, c);
            return (
              <Pressable
                key={complaint.complaintNumber}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/track",
                    params: { number: complaint.complaintNumber },
                  })
                }
                style={({ pressed }) => ({
                  borderWidth: 1,
                  borderColor: c.border,
                  backgroundColor: c.card,
                  borderRadius: 12,
                  padding: 14,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: c.mutedForeground,
                      fontFamily: "Inter_500Medium",
                    }}
                  >
                    {complaint.complaintNumber}
                  </Text>
                  <View
                    style={{
                      backgroundColor: `${badge}22`,
                      borderRadius: 999,
                      paddingVertical: 3,
                      paddingHorizontal: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: badge,
                        fontFamily: "Inter_600SemiBold",
                      }}
                    >
                      {statusLabel(complaint.status)}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 15,
                    color: c.cardForeground,
                    fontFamily: "Inter_600SemiBold",
                    marginTop: 8,
                  }}
                  numberOfLines={2}
                >
                  {complaint.title}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Feather name="map-pin" size={12} color={c.mutedForeground} />
                  <Text
                    style={{
                      fontSize: 12,
                      color: c.mutedForeground,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {complaint.districtName}
                  </Text>
                  <Text style={{ color: c.border }}>•</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: c.mutedForeground,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {complaint.categoryName}
                  </Text>
                  <Text style={{ color: c.border }}>•</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: c.mutedForeground,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {formatDate(complaint.createdAt)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
