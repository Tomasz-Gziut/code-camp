import { getFirms } from "../api/firmsApi";
import { useAsyncData } from "./useAsyncData";

export function useFirms() {
  const { data, error, isLoading } = useAsyncData(() => getFirms(), []);
  return {
    firms: data ?? [],
    error,
    isLoading,
  };
}
