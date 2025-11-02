import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFolders } from "@/hooks/useFolders";
export default function FolderDropdown(_a) {
    var value = _a.value, onChange = _a.onChange, _b = _a.searchQuery, searchQuery = _b === void 0 ? "" : _b;
    var _c = useFolders(searchQuery), folders = _c.data, isLoading = _c.isLoading;
    var _d = useState(value || "1"), selectedValue = _d[0], setSelectedValue = _d[1];
    useEffect(function () {
        if (value && value !== selectedValue) {
            setSelectedValue(value);
        }
    }, [value]);
    var handleValueChange = function (newValue) {
        setSelectedValue(newValue);
        onChange(newValue);
    };
    if (isLoading) {
        return (<Select disabled value={selectedValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Loading folders..."/>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Loading...</SelectItem>
        </SelectContent>
      </Select>);
    }
    return (<Select value={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full bg-transparent text-[#00ffe0] border-2 border-[#00ffe0] focus:ring-2 focus:ring-[#00ffe0]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Array.isArray(folders) && folders.map(function (folder) { return (<SelectItem key={folder.id} value={folder.id.toString()}>
            {folder.name}
          </SelectItem>); })}
      </SelectContent>
    </Select>);
}
