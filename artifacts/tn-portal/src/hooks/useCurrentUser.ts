import {
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";

export function useCurrentUser() {
  const { data, isLoading, isError } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
      staleTime: 60 * 1000,
    },
  });

  const isSignedIn = !!data && !isError;
  const role = (isSignedIn && data?.role) || "citizen";

  const isOfficer = [
    "village_officer", "taluk_officer", "district_officer",
    "department_officer", "ministry_officer", "state_administrator",
    "super_admin", "investigation_officer", "moderator", "auditor", "legal_officer",
  ].includes(role);

  const isAdmin = ["state_administrator", "super_admin", "moderator"].includes(role);
  const isSuperAdmin = role === "super_admin";

  return {
    user: isSignedIn ? data : undefined,
    role,
    isOfficer,
    isAdmin,
    isSuperAdmin,
    isLoaded: !isLoading,
    isSignedIn,
    departmentId: (isSignedIn && data?.departmentId) || null,
    districtId: (isSignedIn && data?.districtId) || null,
  };
}
