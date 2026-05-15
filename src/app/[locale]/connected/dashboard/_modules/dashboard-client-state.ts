export const getWalletFromStorage = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("wallet");
};

export const getTenantDashboardPropertyIdFromUrl = (): string | null => {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("propertyId");
};
