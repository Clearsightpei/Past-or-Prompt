import { useQuery } from "@tanstack/react-query";
import { PublicFolder } from "@shared/schema";

// Hook to fetch all collections (folders). Never includes the password hash.
export function useFolders(search?: string) {
  const queryKey = search
    ? ['/api/folders', { search }]
    : ['/api/folders'];

  const queryFn = async () => {
    const url = search
      ? `/api/folders?search=${encodeURIComponent(search)}`
      : `/api/folders`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch collections');
    return response.json() as Promise<PublicFolder[]>;
  };

  return useQuery({
    queryKey,
    queryFn
  });
}

export type FolderAccess = {
  id: number;
  name: string;
  visibility: string;
  has_password: boolean;
  can_view: boolean;
  can_edit: boolean;
};

// Hook to fetch a single collection by ID (includes the caller's access flags).
// staleTime 0 so access flags (can_view/can_edit) refresh after login/unlock,
// rather than being frozen by the app's global staleTime: Infinity.
export function useFolder(folderId: string | number) {
  return useQuery({
    queryKey: [`/api/folders/${folderId}`],
    queryFn: async () => {
      const response = await fetch(`/api/folders/${folderId}`, { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch collection');
      return response.json() as Promise<FolderAccess>;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
}
