export type Role = "ADMIN" | "OPERATOR" | "VIEWER";
export type Status = "SUCCESS" | "FAILED";
export type SampleState = "GC" | "GR";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string | string[]>;
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

