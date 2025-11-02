import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
export function Search(_a) {
    var _b = _a.placeholder, placeholder = _b === void 0 ? "Search..." : _b, value = _a.value, onChange = _a.onChange, _c = _a.className, className = _c === void 0 ? "" : _c;
    var _d = useState(value || ""), searchValue = _d[0], setSearchValue = _d[1];
    useEffect(function () {
        if (value !== undefined && value !== searchValue) {
            setSearchValue(value);
        }
    }, [value]);
    var handleChange = function (e) {
        var newValue = e.target.value;
        setSearchValue(newValue);
        onChange(newValue);
    };
    return (<div className={"relative rounded-md shadow-sm ".concat(className)}>
      <Input type="text" placeholder={placeholder} value={searchValue} onChange={handleChange} className="pr-10 bg-[#00ffe0] text-black placeholder:text-black/60 border-none focus:ring-2 focus:ring-[#00ffe0] focus:border-[#00ffe0]"/>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="h-5 w-5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
        </svg>
      </div>
    </div>);
}
