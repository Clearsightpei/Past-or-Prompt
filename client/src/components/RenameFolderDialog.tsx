import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Folder } from "@shared/schema";

interface RenameFolderDialogProps {
  folder: Folder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderRenamed: () => void;
}

export default function RenameFolderDialog({
  folder,
  open,
  onOpenChange,
  onFolderRenamed,
}: RenameFolderDialogProps) {
  const [folderName, setFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (folder) {
      setFolderName(folder.name);
      // Load password from localStorage if exists
      const storedPassword =
        localStorage.getItem(`folder_password_${folder.id}`) || "";
      setPassword(storedPassword);
    }
  }, [folder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folder) return;

    if (!folderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name is required",
        variant: "destructive",
      });
      return;
    }

    if (folderName.length < 2 || folderName.length > 50) {
      toast({
        title: "Error",
        description: "Folder name must be between 2 and 50 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("PUT", `/api/folders/${folder.id}`, { name: folderName });
      // Save password to localStorage
      localStorage.setItem(`folder_password_${folder.id}`, password);
      toast({
        title: "Success",
        description: "Folder renamed successfully",
      });
      onFolderRenamed();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename folder",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!folder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a3c42]">
        <DialogHeader>
          <DialogTitle className="text-[#00ffe0]">Rename Folder</DialogTitle>
          <DialogDescription className="text-[#00ffe0]">
            Change the folder name below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Label
              htmlFor="folderName"
              className="text-[#00ffe0]"
            >
              Folder Name
            </Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0]"
            />
            <Label
              htmlFor="password"
              className="text-[#00ffe0]"
            >
              Password (optional)
            </Label>
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0]"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
