export type FmzAdminPaginationRequest = {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, string | number | boolean | null | undefined>;
};

export type FmzAdminPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type FmzPaginatedAdminResult<T> = FmzAdminPaginationMeta & {
  items: T[];
};
