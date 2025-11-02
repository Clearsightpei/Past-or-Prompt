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
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useParams, useLocation } from "wouter";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import RenameFolderDialog from "@/components/RenameFolderDialog";
import PageGradientBackground from "@/components/PageGradientBackground";
export default function FolderDetail() {
    var _this = this;
    var id = useParams().id;
    var _a = useLocation(), navigate = _a[1];
    var toast = useToast().toast;
    var folderId = parseInt(id);
    var _b = useState(false), isDeleteStoryOpen = _b[0], setIsDeleteStoryOpen = _b[1];
    var _c = useState(null), selectedStory = _c[0], setSelectedStory = _c[1];
    var _d = useState(false), isRenameFolderOpen = _d[0], setIsRenameFolderOpen = _d[1];
    var _e = useState(false), isDeleteFolderOpen = _e[0], setIsDeleteFolderOpen = _e[1];
    // Redirect if invalid ID
    useEffect(function () {
        if (isNaN(folderId)) {
            navigate("/folders");
        }
    }, [folderId, navigate]);
    // Fetch folder details
    var _f = useQuery({
        queryKey: ["/api/folders/".concat(folderId)],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/folders/".concat(folderId))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch folder');
                        return [2 /*return*/, response.json()];
                }
            });
        }); }
    }), folder = _f.data, isLoadingFolder = _f.isLoading;
    // Fetch stories for this folder
    var _g = useQuery({
        queryKey: ["/api/stories", { folder: folderId }],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/stories?folder=".concat(folderId))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch stories');
                        return [2 /*return*/, response.json()];
                }
            });
        }); }
    }), _h = _g.data, stories = _h === void 0 ? [] : _h, isLoadingStories = _g.isLoading, refetchStories = _g.refetch;
    // Delete story mutation
    var deleteStoryMutation = useMutation({
        mutationFn: function (storyId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("DELETE", "/api/stories/".concat(storyId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function () {
            toast({
                title: "Success",
                description: "Story deleted successfully",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
        },
        onError: function () {
            toast({
                title: "Error",
                description: "Failed to delete story",
                variant: "destructive"
            });
        }
    });
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
            navigate("/folders");
        },
        onError: function () {
            toast({
                title: "Error",
                description: "Failed to delete folder",
                variant: "destructive"
            });
        }
    });
    // Handle story deletion
    var handleDeleteStory = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedStory)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, deleteStoryMutation.mutateAsync(selectedStory.id)];
                case 2:
                    _a.sent();
                    setIsDeleteStoryOpen(false);
                    setSelectedStory(null);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to delete story:", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Handle folder deletion
    var handleDeleteFolder = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!folder)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, deleteFolderMutation.mutateAsync(folder.id)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error("Failed to delete folder:", error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Open story delete confirmation
    var handleOpenDeleteStory = function (story) {
        setSelectedStory(story);
        setIsDeleteStoryOpen(true);
    };
    // Handle add story button
    var handleAddStory = function () {
        navigate("/folders/".concat(folderId, "/add-story"));
    };
    // Handle edit story button
    var handleEditStory = function (storyId) {
        navigate("/folders/".concat(folderId, "/stories/").concat(storyId, "/edit"));
    };
    // Handle rename folder success
    var handleFolderRenamed = function () {
        queryClient.invalidateQueries({ queryKey: ["/api/folders/".concat(folderId)] });
    };
    if (isNaN(folderId)) {
        return null; // Redirect will happen in useEffect
    }
    if (isLoadingFolder || isLoadingStories) {
        return (<div className="flex justify-center items-center h-64">
        <p>Loading...</p>
      </div>);
    }
    if (!folder) {
        return (<div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">Folder not found</h2>
        <Button onClick={function () { return navigate("/folders"); }}>Back to Folders</Button>
      </div>);
    }
    var isGeneral = folder.id === 1;
    return (<PageGradientBackground>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-800">{folder.name}</h2>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={function () { return navigate("/folders"); }}>Go Back to Folder Menu</Button>
            <Button onClick={handleAddStory}>
              <Plus className="mr-2 h-5 w-5"/>
              Add Story
            </Button>
            <Button variant="outline" onClick={function () { return setIsRenameFolderOpen(true); }}>
              <Pencil className="mr-2 h-5 w-5"/>
              Rename Folder
            </Button>
            {!isGeneral && (<Button variant="outline" onClick={function () { return setIsDeleteFolderOpen(true); }}>
                <Trash2 className="mr-2 h-5 w-5 text-error"/>
                Delete Folder
              </Button>)}
          </div>
        </div>

        {/* Story List */}
        {stories.length === 0 ? (<div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-4">No stories found</h3>
            <p className="text-neutral-600 mb-6">Add a story to get started</p>
            <Button onClick={handleAddStory}>
              <Plus className="mr-2 h-5 w-5"/>
              Add Story
            </Button>
          </div>) : (<div className="space-y-4">
            {stories.map(function (story) { return (<Card key={story.id} className="bg-[#1a3c42] shadow rounded-lg overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-[#00ffe0]">{story.event}</h3>
                      <p className="mt-1 text-sm text-[#00ffe0] line-clamp-2">{story.introduction}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                      <Button variant="outline" size="sm" className="mr-2 h-8" onClick={function () { return handleEditStory(story.id); }}>
                        <Pencil className="mr-1.5 h-4 w-4"/>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="h-8" onClick={function () { return handleOpenDeleteStory(story); }}>
                        <Trash2 className="mr-1.5 h-4 w-4 text-error"/>
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-[#00ffe0] rounded-md p-3 bg-[#1a3c42]">
                      <p className="text-xs font-medium text-[#00ffe0] mb-1">True Version:</p>
                      <p className="text-sm text-[#00ffe0] line-clamp-3">{story.true_version}</p>
                    </div>
                    <div className="border border-[#00ffe0] rounded-md p-3 bg-[#1a3c42]">
                      <p className="text-xs font-medium text-[#00ffe0] mb-1">Fake Version:</p>
                      <p className="text-sm text-[#00ffe0] line-clamp-3">{story.fake_version}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>); })}
          </div>)}
        
        {/* Dialogs */}
        <DeleteConfirmDialog open={isDeleteStoryOpen} onOpenChange={setIsDeleteStoryOpen} title="Delete Story" description={"Are you sure you want to delete \"".concat(selectedStory === null || selectedStory === void 0 ? void 0 : selectedStory.event, "\"? This action cannot be undone.")} onConfirm={handleDeleteStory}/>
        
        <RenameFolderDialog folder={folder} open={isRenameFolderOpen} onOpenChange={setIsRenameFolderOpen} onFolderRenamed={handleFolderRenamed}/>
        
        <DeleteConfirmDialog open={isDeleteFolderOpen} onOpenChange={setIsDeleteFolderOpen} title="Delete Folder" description={"Are you sure you want to delete \"".concat(folder.name, "\"? This will permanently remove the folder and all its stories. This action cannot be undone.")} onConfirm={handleDeleteFolder}/>
      </div>
    </PageGradientBackground>);
}
