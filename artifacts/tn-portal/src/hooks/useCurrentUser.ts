import { useUser } from "@clerk/react";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";

export function useCurrentUser() {
  const { isSignedIn, isLoaded } = useUser();
  const { data, isLoading } = useGetCurrentUser({
    query: { enabled: !!isSignedIn, queryKey: getGetCurrentUserQueryKey() },
  });

  const role = data?.role ?? "citizen";

  const isOfficer = [
    "village_officer", "taluk_officer", "district_officer",
    "department_officer", "ministry_officer", "state_administrator",
    "super_admin", "investigation_officer", "moderator", "auditor", "legal_officer",
  ].includes(role);

  const isAdmin = ["state_administrator", "super_admin", "moderator"].includes(role);
  const isSuperAdmin = role === "super_admin";

  return {
    user: data,
    role,
    isOfficer,
    isAdmin,
    isSuperAdmin,
    isLoaded: isLoaded && !isLoading,
    isSignedIn: !!isSignedIn,
    departmentId: data?.departmentId ?? null,
    districtId: data?.districtId ?? null,
  };
}
