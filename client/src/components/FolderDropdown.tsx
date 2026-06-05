import { useState, useEffect } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useFolders } from "@/hooks/useFolders";

interface FolderDropdownProps {
  value: string;
  onChange: (value: string) => void;
  searchQuery?: string;  // Optional search query to filter folders
}

export default function FolderDropdown({ value, onChange, searchQuery = "" }: FolderDropdownProps) {
  const { data: folders, isLoading } = useFolders(searchQuery);
  const [selectedValue, setSelectedValue] = useState(value || "1");
  
  useEffect(() => {
    if (value && value !== selectedValue) {
      setSelectedValue(value);
    }
  }, [value]);
  
  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue);
    onChange(newValue);
  };
  
  if (isLoading) {
    return (
      <Select disabled value={selectedValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Loading folders..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Loading...</SelectItem>
        </SelectContent>
      </Select>
    );
  }
  
  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full bg-white text-stone-800 border-stone-300">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Array.isArray(folders) && folders.map((folder: any) => (
          <SelectItem key={folder.id} value={folder.id.toString()}>
            {folder.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
