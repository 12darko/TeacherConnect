import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";

export function getQueryFn<T>({
  on401 = "throw",
}: {
  on401?: "returnNull" | "returnEmpty" | "throw";
} = {}) {
  return async function fetchJson({ queryKey }: QueryFunctionContext): Promise<T> {
    try {
      const body = await fetch(queryKey[0] as string, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (body.status === 401) {
        if (on401 === "returnNull") return null as T;
        if (on401 === "returnEmpty") return [] as unknown as T;
        throw new Error("Not authenticated");
      }

      if (!body.ok) {
        const err = await body.text();
        console.error("API Error:", err);
        throw new Error(err || "API request failed");
      }

      // if 204 No Content, return
      if (body.status === 204) {
        return undefined as unknown as T;
      }

      // handle empty responses
      const text = await body.text();
      if (!text) return undefined as unknown as T;

      return JSON.parse(text);
    } catch (error) {
      console.error("Query error:", error);
      throw error;
    }
  };
}

export async function apiRequest(method: string, url: string, data?: any) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP error ${response.status}`);
  }

  return response;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      queryFn: getQueryFn(),
      retry: 1,
    },
  },
});