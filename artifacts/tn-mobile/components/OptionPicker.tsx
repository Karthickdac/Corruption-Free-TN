import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import colors from "@/constants/colors";

export interface PickerOption {
  id: number;
  label: string;
  sublabel?: string | null;
}

interface OptionPickerProps {
  label: string;
  placeholder: string;
  options: PickerOption[];
  selectedId?: number;
  onSelect: (id: number | undefined) => void;
  testID?: string;
}

export function OptionPicker({
  label,
  placeholder,
  options,
  selectedId,
  onSelect,
  testID,
}: OptionPickerProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<boolean>(false);

  const selected = options.find((o) => o.id === selectedId);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: c.foreground }]}>{label}</Text>
      <Pressable
        testID={testID}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: c.card,
            borderColor: c.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text
          style={{
            color: selected ? c.foreground : c.mutedForeground,
            fontSize: 15,
            fontFamily: "Inter_400Regular",
            flex: 1,
          }}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={c.mutedForeground} />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: c.background,
                paddingBottom:
                  Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text
                style={{
                  color: c.foreground,
                  fontSize: 17,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {label}
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={10}
                testID={`${testID ?? "picker"}-close`}
              >
                <Feather name="x" size={22} color={c.mutedForeground} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              scrollEnabled={options.length > 0}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: 420 }}
              ListEmptyComponent={
                <Text
                  style={{
                    color: c.mutedForeground,
                    textAlign: "center",
                    paddingVertical: 24,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  No options available
                </Text>
              }
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId;
                return (
                  <Pressable
                    onPress={() => {
                      onSelect(isSelected ? undefined : item.id);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: isSelected
                          ? c.secondary
                          : pressed
                            ? c.muted
                            : "transparent",
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: c.foreground,
                          fontSize: 15,
                          fontFamily: isSelected
                            ? "Inter_600SemiBold"
                            : "Inter_400Regular",
                        }}
                      >
                        {item.label}
                      </Text>
                      {item.sublabel ? (
                        <Text
                          style={{
                            color: c.mutedForeground,
                            fontSize: 13,
                            marginTop: 2,
                            fontFamily: "Inter_400Regular",
                          }}
                        >
                          {item.sublabel}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Feather name="check" size={18} color={c.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: colors.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: colors.radius,
    gap: 8,
  },
});
