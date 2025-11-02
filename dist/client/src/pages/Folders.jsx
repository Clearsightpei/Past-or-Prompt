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
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/ui/search";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import FolderCard from "@/components/FolderCard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import CreateFolderDialog from "@/components/CreateFolderDialog";
import RenameFolderDialog from "@/components/RenameFolderDialog";
import PageGradientBackground from "@/components/PageGradientBackground";
export default function Folders() {
    var _this = this;
    var toast = useToast().toast;
    var _a = useState(""), searchQuery = _a[0], setSearchQuery = _a[1];
    var _b = useState(false), isCreateFolderOpen = _b[0], setIsCreateFolderOpen = _b[1];
    var _c = useState(false), isDeleteFolderOpen = _c[0], setIsDeleteFolderOpen = _c[1];
    var _d = useState(false), isRenameFolderOpen = _d[0], setIsRenameFolderOpen = _d[1];
    var _e = useState(null), selectedFolder = _e[0], setSelectedFolder = _e[1];
    // Fetch folders
    var _f = useQuery({
        queryKey: ['/api/folders', { search: searchQuery }],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var url, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = searchQuery
                            ? "/api/folders?search=".concat(encodeURIComponent(searchQuery))
                            : '/api/folders';
                        return [4 /*yield*/, fetch(url)];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch folders');
                        return [2 /*return*/, response.json()];
                }
            });
        }); }
    }), _g = _f.data, folders = _g === void 0 ? [] : _g, isLoading = _f.isLoading, refetch = _f.refetch;
    // Delete folder mutation
    var deleteFolderMutation = useMutation({
        mutationFn: function (folderId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("DELETE", "/api/folders/".concat(folderId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function () {
            toast({
                title: "Success",
                description: "Folder deleted successfully",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
        },
        onError: function () {
            toast({
                title: "Error",
                description: "Failed to delete folder",
                variant: "destructive"
            });
        }
    });
    // Handle folder deletion
    var handleDeleteFolder = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedFolder)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, deleteFolderMutation.mutateAsync(selectedFolder.id)];
                case 2:
                    _a.sent();
                    setIsDeleteFolderOpen(false);
                    setSelectedFolder(null);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to delete folder:", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Handle folder search
    var handleSearch = function (query) {
        setSearchQuery(query);
    };
    // Utility functions for password and access control
    var getFolderPassword = function (folderId) {
        return localStorage.getItem("folder_password_".concat(folderId)) || "";
    };
    var setFolderPassword = function (folderId, password) {
        localStorage.setItem("folder_password_".concat(folderId), password);
    };
    var getFolderAccess = function (folderId) {
        var access = localStorage.getItem("folder_access_".concat(folderId));
        if (!access)
            return null;
        try {
            return JSON.parse(access);
        }
        catch (_a) {
            return null;
        }
    };
    var grantFolderAccess = function (folderId) {
        var expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        localStorage.setItem("folder_access_".concat(folderId), JSON.stringify({ granted: true, expiresAt: expiresAt }));
    };
    var clearFolderAccess = function (folderId) {
        localStorage.removeItem("folder_access_".concat(folderId));
    };
    var isFolderAccessGranted = function (folderId) {
        var access = getFolderAccess(folderId);
        if (!access)
            return false;
        if (Date.now() > access.expiresAt) {
            clearFolderAccess(folderId);
            return false;
        }
        return access.granted;
    };
    // Prompt for password (simple window.prompt for now)
    var promptForPassword = function (message) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, window.prompt(message) || ""];
        });
    }); };
    // Handle View Stories with password check
    var handleViewStories = function (folder) { return __awaiter(_this, void 0, void 0, function () {
        var folderPassword, input;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    folderPassword = getFolderPassword(folder.id);
                    if (!folderPassword) {
                        // No password, allow access
                        window.location.href = "/folders/".concat(folder.id);
                        return [2 /*return*/];
                    }
                    if (isFolderAccessGranted(folder.id)) {
                        window.location.href = "/folders/".concat(folder.id);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, promptForPassword("Enter password for folder \"".concat(folder.name, "\":"))];
                case 1:
                    input = _a.sent();
                    if (input === folderPassword) {
                        grantFolderAccess(folder.id);
                        window.location.href = "/folders/".concat(folder.id);
                    }
                    else {
                        toast({
                            title: "Access Denied",
                            description: "Incorrect password.",
                            variant: "destructive"
                        });
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    // Handle folder edit
    var handleEditFolder = function (folder) { return __awaiter(_this, void 0, void 0, function () {
        var folderPassword, input;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    folderPassword = getFolderPassword(folder.id);
                    if (!folderPassword) {
                        setSelectedFolder(folder);
                        setIsRenameFolderOpen(true);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, promptForPassword("Enter current password to edit folder \"".concat(folder.name, "\":"))];
                case 1:
                    input = _a.sent();
                    if (input === folderPassword) {
                        setSelectedFolder(folder);
                        setIsRenameFolderOpen(true);
                    }
                    else {
                        toast({
                            title: "Access Denied",
                            description: "Incorrect password.",
                            variant: "destructive"
                        });
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    // Handle folder delete
    var handleOpenDeleteFolder = function (folder) { return __awaiter(_this, void 0, void 0, function () {
        var folderPassword, input;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    folderPassword = getFolderPassword(folder.id);
                    if (!folderPassword || isFolderAccessGranted(folder.id)) {
                        setSelectedFolder(folder);
                        setIsDeleteFolderOpen(true);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, promptForPassword("Enter password to delete folder \"".concat(folder.name, "\":"))];
                case 1:
                    input = _a.sent();
                    if (input === folderPassword) {
                        grantFolderAccess(folder.id);
                        setSelectedFolder(folder);
                        setIsDeleteFolderOpen(true);
                    }
                    else {
                        toast({
                            title: "Access Denied",
                            description: "Incorrect password.",
                            variant: "destructive"
                        });
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    // Handle folder creation success
    var handleFolderCreated = function () {
        refetch();
    };
    // Handle folder rename success
    var handleFolderRenamed = function () {
        refetch();
    };
    return (<PageGradientBackground>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-800">Manage Folders</h1>
          
          <div className="mt-4 sm:mt-0 flex items-center">
            <Search placeholder="Search folders..." value={searchQuery} onChange={handleSearch}/>
            <Button className="ml-4" onClick={function () { return setIsCreateFolderOpen(true); }}>
              <Plus className="mr-2 h-5 w-5"/>
              Create Folder
            </Button>
          </div>
        </div>

        {/* Folder List */}
        {isLoading ? (<div className="flex justify-center items-center h-64">
            <p>Loading folders...</p>
          </div>) : folders.length === 0 ? (<div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">No folders found</h2>
            <p className="text-neutral-600 mb-6">Create a new folder to get started</p>
            <Button onClick={function () { return setIsCreateFolderOpen(true); }}>
              <Plus className="mr-2 h-5 w-5"/>
              Create Folder
            </Button>
          </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {folders.map(function (folder) { return (<FolderCard key={folder.id} folder={folder} onEdit={function () { return handleEditFolder(folder); }} onDelete={function () { return handleOpenDeleteFolder(folder); }} onViewStories={function () { return handleViewStories(folder); }}/>); })}
          </div>)}
        
        {/* Dialogs */}
        <CreateFolderDialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen} onFolderCreated={handleFolderCreated}/>
        
        <RenameFolderDialog folder={selectedFolder} open={isRenameFolderOpen} onOpenChange={setIsRenameFolderOpen} onFolderRenamed={handleFolderRenamed}/>
        
        <DeleteConfirmDialog open={isDeleteFolderOpen} onOpenChange={setIsDeleteFolderOpen} title="Delete Folder" description={"Are you sure you want to delete \"".concat(selectedFolder === null || selectedFolder === void 0 ? void 0 : selectedFolder.name, "\"? This will permanently remove the folder and all its stories. This action cannot be undone.")} onConfirm={handleDeleteFolder}/>
      </div>
    </PageGradientBackground>);
}
