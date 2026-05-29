export const getTenantDashboardPropertyIdFromUrl = (): string | null => {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("propertyId");
};
