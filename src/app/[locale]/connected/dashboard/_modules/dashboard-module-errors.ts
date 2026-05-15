export const isMetadataNotAvailableError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("No metadata available") || message.includes("Sem metadados") || message.toLowerCase().includes("metadata");
};

export const getDashboardErrorMessage = (error: unknown, fallbackMessage: string): string =>
  error instanceof Error ? error.message : fallbackMessage;
