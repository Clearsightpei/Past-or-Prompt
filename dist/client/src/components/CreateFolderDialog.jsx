var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
export default function CreateFolderDialog(_a) {
    var _this = this;
    var open = _a.open, onOpenChange = _a.onOpenChange, onFolderCreated = _a.onFolderCreated;
    var _b = useState(""), folderName = _b[0], setFolderName = _b[1];
    var _c = useState(""), folderPassword = _c[0], setFolderPassword = _c[1];
    var _d = useState(false), isSubmitting = _d[0], setIsSubmitting = _d[1];
    var toast = useToast().toast;
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var res, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!folderName.trim()) {
                        toast({
                            title: "Error",
                            description: "Folder name is required",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    if (folderName.length < 2 || folderName.length > 50) {
                        toast({
                            title: "Error",
                            description: "Folder name must be between 2 and 50 characters",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, apiRequest("POST", "/api/folders", { name: folderName })];
                case 2:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    result = _a.sent();
                    // Save password to localStorage if set
                    if (folderPassword && result && result.id) {
                        localStorage.setItem("folder_password_".concat(result.id), folderPassword);
                    }
                    toast({
                        title: "Success",
                        description: "Folder created successfully",
                    });
                    setFolderName("");
                    setFolderPassword("");
                    onFolderCreated();
                    onOpenChange(false);
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    toast({
                        title: "Error",
                        description: "Failed to create folder",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a3c42]">
        <DialogHeader>
          <DialogTitle className="text-[#00ffe0]">Create Folder</DialogTitle>
          <DialogDescription className="text-[#00ffe0]">
            Create a new folder to organize your stories.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Label htmlFor="folderName" className="text-[#00ffe0]">
              Folder Name
            </Label>
            <Input id="folderName" value={folderName} onChange={function (e) { return setFolderName(e.target.value); }} className="bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0]"/>
            <Label htmlFor="folderPassword" className="text-[#00ffe0]">
              Password (optional)
            </Label>
            <Input id="folderPassword" value={folderPassword} onChange={function (e) { return setFolderPassword(e.target.value); }} className="bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0]"/>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);
}
