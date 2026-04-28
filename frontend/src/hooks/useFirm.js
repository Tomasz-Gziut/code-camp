import { getFirmById } from "../api/firmsApi";
import { useAsyncData } from "./useAsyncData";

export function useFirm(firmId) {
  const { data, error, isLoading } = useAsyncData(
    async () => {
      try {
        return await getFirmById(firmId);
      } catch (requestError) {
        if (requestError?.status === 404) {
          return null;
        }
        throw requestError;
      }
    },
    [firmId]
  );

  return {
    firm: data,
    error,
    isLoading,
  };
}
