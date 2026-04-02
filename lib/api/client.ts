type FetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function apiFetch<T>(url: string, options?: FetchOptions): Promise<T> {
  const response = await fetch(url, {
    method: options?.method ?? "GET",
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined
  });
  const json = (await response.json()) as {
    success: boolean;
    message: string;
    data: T;
  };
  if (!response.ok || !json.success) {
    throw new Error(json.message || "请求失败");
  }
  return json.data;
}

