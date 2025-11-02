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
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, BarChart3, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FolderDropdown from "@/components/FolderDropdown";
import StoryCard from "@/components/StoryCard";
import FeedbackMessage from "@/components/FeedbackMessage";
import StatCard from "@/components/StatCard";
import { Search } from "@/components/ui/search";
import { useFolders } from "@/hooks/useFolders";
import { apiRequest } from "@/lib/queryClient";
import { AnimatePresence, motion } from "framer-motion";
import PageGradientBackground from "@/components/PageGradientBackground";
export default function Game() {
    var _this = this;
    var _a, _b;
    var _c = useLocation(), location = _c[0], setLocation = _c[1];
    var _d = useState("1"), currentFolderId = _d[0], setCurrentFolderId = _d[1];
    var _e = useState(false), sessionReady = _e[0], setSessionReady = _e[1];
    var _f = useState(""), sessionId = _f[0], setSessionId = _f[1];
    var toast = useToast().toast;
    var _g = useState(false), showHint = _g[0], setShowHint = _g[1];
    // Initialize session ID
    useEffect(function () {
        var existingSessionId = localStorage.getItem("true-false-history-session");
        if (existingSessionId) {
            console.log("Using existing sessionId:", existingSessionId);
            setSessionId(existingSessionId);
        }
        else {
            var randomId = Math.random().toString(36).substring(2, 15);
            console.log("Generated new sessionId:", randomId);
            localStorage.setItem("true-false-history-session", randomId);
            setSessionId(randomId);
        }
        setSessionReady(true);
    }, []);
    // Parse folder ID from URL on initial load
    useEffect(function () {
        var params = new URLSearchParams(location.split('?')[1] || '');
        var folderParam = params.get("folder");
        if (folderParam) {
            setCurrentFolderId(folderParam);
        }
    }, [location]);
    var _h = useState(""), folderSearch = _h[0], setFolderSearch = _h[1];
    var _j = useState(false), showUserStats = _j[0], setShowUserStats = _j[1];
    var _k = useState(false), showOverallStats = _k[0], setShowOverallStats = _k[1];
    var _l = useState(0), currentStoryIndex = _l[0], setCurrentStoryIndex = _l[1];
    var _m = useState(null), selectedChoice = _m[0], setSelectedChoice = _m[1];
    var _o = useState(null), isCorrect = _o[0], setIsCorrect = _o[1];
    // Fetch folders for dropdown with search term applied
    var _p = useFolders(folderSearch), folders = _p.data, isLoadingFolders = _p.isLoading;
    // Fetch stories for the selected folder
    var _q = useQuery({
        queryKey: ['/api/stories', { folder: currentFolderId }],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/stories?folder=".concat(currentFolderId))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch stories');
                        return [2 /*return*/, response.json()];
                }
            });
        }); }
    }), _r = _q.data, stories = _r === void 0 ? [] : _r, isLoadingStories = _q.isLoading, refetchStories = _q.refetch;
    // Fetch user stats
    var _s = useQuery({
        queryKey: ['/api/stats/user', { userId: sessionId, folder: currentFolderId }],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/stats/user?userId=".concat(sessionId, "&folder=").concat(currentFolderId))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch user stats');
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        enabled: !!sessionId, // Only run when sessionId is not empty
    }), userStats = _s.data, isLoadingUserStats = _s.isLoading, refetchUserStats = _s.refetch;
    // Fetch story stats
    var _t = useQuery({
        queryKey: ['/api/stats/stories', { folder: currentFolderId }],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/stats/stories?folder=".concat(currentFolderId))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch story stats');
                        return [2 /*return*/, response.json()];
                }
            });
        }); }
    }), storyStats = _t.data, isLoadingStoryStats = _t.isLoading, refetchStoryStats = _t.refetch;
    // Record attempt mutation
    var recordAttemptMutation = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/attempt", {
                            user_id: sessionId,
                            story_id: data.story_id,
                            choice: data.choice,
                            correct: data.correct
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        onSuccess: function () {
            // Invalidate user stats and story stats after recording an attempt
            queryClient.invalidateQueries({ queryKey: ['/api/stats/user'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats/stories'] });
        },
        onError: function () {
            toast({
                title: "Error",
                description: "Failed to record your answer",
                variant: "destructive"
            });
        }
    });
    var currentStory = stories[currentStoryIndex];
    // Handle folder change
    var handleFolderChange = function (folderId) {
        // Update URL with new folder ID
        var newLocation = location.split('?')[0] + "?folder=".concat(folderId);
        setLocation(newLocation);
        setCurrentFolderId(folderId);
        setCurrentStoryIndex(0);
        setSelectedChoice(null);
        setIsCorrect(null);
        setShowUserStats(false);
        setShowOverallStats(false);
    };
    // Handle story selection
    var handleSelectChoice = useCallback(function (choice) { return __awaiter(_this, void 0, void 0, function () {
        var isChoiceCorrect, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentStory)
                        return [2 /*return*/];
                    isChoiceCorrect = choice === "true";
                    setSelectedChoice(choice);
                    setIsCorrect(isChoiceCorrect);
                    // Log the sessionId and data being sent
                    console.log("Recording attempt:", {
                        user_id: sessionId,
                        story_id: currentStory.id,
                        choice: choice,
                        correct: isChoiceCorrect
                    });
                    console.log("Session ID in localStorage:", localStorage.getItem("true-false-history-session"));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, recordAttemptMutation.mutateAsync({
                            story_id: currentStory.id,
                            choice: choice,
                            correct: isChoiceCorrect
                        })];
                case 2:
                    _a.sent();
                    refetchUserStats();
                    refetchStoryStats();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to record attempt:", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [currentStory, recordAttemptMutation, refetchUserStats, refetchStoryStats, sessionId]);
    // Reset and load next story
    var handleNextStory = useCallback(function () {
        // If we have more stories, go to the next one
        if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(function (prevIndex) { return prevIndex + 1; });
        }
        else {
            // If we're at the end, go back to the first story
            setCurrentStoryIndex(0);
        }
        // Reset selection state
        setSelectedChoice(null);
        setIsCorrect(null);
        setShowUserStats(false);
        setShowOverallStats(false);
    }, [currentStoryIndex, stories.length]);
    // Handle folder search
    var handleFolderSearch = function (query) {
        setFolderSearch(query);
    };
    // Format accuracy as percentage
    var formatAccuracy = function (value) {
        return "".concat(Math.round(value), "%");
    };
    if (isLoadingStories) {
        return (<div className="flex justify-center items-center h-64">
        <p>Loading stories...</p>
      </div>);
    }
    if (stories.length === 0) {
        return (<div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">No stories found</h2>
        <p className="text-neutral-600 mb-6">There are no stories in this folder yet.</p>
      </div>);
    }
    return (<div className="min-h-screen w-full bg-neutral-100">
      <PageGradientBackground>
        {/* Main game content (white card, story boxes, controls, etc.) */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-800">Spot the Truth: Can You Tell AI from Human? </h1>
          
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Folder Selector */}
            <div className="relative w-full sm:w-48">
              <FolderDropdown value={currentFolderId} onChange={handleFolderChange} searchQuery={folderSearch}/>
            </div>
            
            {/* Search Folders */}
            <Search placeholder="Search folders..." value={folderSearch} onChange={handleFolderSearch}/>
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button onClick={handleNextStory} disabled={!currentStory}>
            <ArrowRight className="mr-2 h-5 w-5"/>
            New Story
          </Button>
          <Button variant="outline" onClick={function () { return setShowUserStats(!showUserStats); }} disabled={!userStats}>
            <Clock className="mr-2 h-5 w-5"/>
            {showUserStats ? "Hide My Stats" : "Show My Stats"}
          </Button>
          <Button variant="outline" onClick={function () { return setShowOverallStats(!showOverallStats); }} disabled={!storyStats || storyStats.length === 0}>
            <BarChart3 className="mr-2 h-5 w-5"/>
            {showOverallStats ? "Hide Overall Stats" : "Show Overall Stats"}
          </Button>
          {(currentStory === null || currentStory === void 0 ? void 0 : currentStory.hint) ? (<Button variant="outline" onClick={function () { return setShowHint(function (v) { return !v; }); }} className="ml-2">
              💡 Show Hint
            </Button>) : null}
        </div>

        {currentStory && (<>
            {/* Show hint bubble if toggled */}
            {showHint && currentStory.hint && (<div className="relative flex justify-end mb-4">
                <div className="!bg-[#fff702] !text-[#450063] rounded-2xl shadow-lg px-5 py-3 max-w-md text-base font-medium relative thought-bubble">
                  {currentStory.hint}
                  <span className="absolute right-6 -bottom-4 w-0 h-0 border-t-8 border-t-[#fff702] border-x-8 border-x-transparent"></span>
                </div>
              </div>)}
            {/* Story Context */}
            <Card className="bg-[#2d203f] rounded-lg shadow p-6 mb-6">
              <CardContent className="p-0">
                <h2 className="text-xl font-semibold text-white mb-2">{currentStory.event}</h2>
                <p className="!text-[#ded700]">{currentStory.introduction}</p>
              </CardContent>
            </Card>

            {/* Animated Story Versions */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={"story-".concat(currentStory.id, "-index-").concat(currentStoryIndex)} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.35, type: "spring", stiffness: 120, damping: 20 }}>
                <StoryCard story={currentStory} onSelect={handleSelectChoice} isSelectable={selectedChoice === null}/>
              </motion.div>
            </AnimatePresence>

            {/* Feedback */}
            {selectedChoice !== null && isCorrect !== null && (<FeedbackMessage isCorrect={isCorrect} explanation={currentStory.explanation}/>)}
          </>)}

        {/* User Stats */}
        {showUserStats && userStats && (<div className="mb-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-3">
              Your Stats - {((_a = folders === null || folders === void 0 ? void 0 : folders.find(function (f) { return f.id.toString() === currentFolderId; })) === null || _a === void 0 ? void 0 : _a.name) || "General"} Folder
            </h3>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Correct Answers" value={userStats.correct_count} titleClassName="text-black" valueClassName="text-black"/>
                <StatCard title="Total Attempts" value={userStats.total_attempts} titleClassName="text-black" valueClassName="text-black"/>
                <StatCard title="Accuracy" value={formatAccuracy(userStats.accuracy)} titleClassName="text-black" valueClassName="text-black"/>
              </div>
            </div>
          </div>)}

        {/* Overall Stats */}
        {showOverallStats && storyStats && storyStats.length > 0 && (<div className="mb-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-3">
              Overall Stats - {((_b = folders === null || folders === void 0 ? void 0 : folders.find(function (f) { return f.id.toString() === currentFolderId; })) === null || _b === void 0 ? void 0 : _b.name) || "General"} Folder
            </h3>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium !text-black uppercase tracking-wider">
                        Story
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium !text-black uppercase tracking-wider">
                        Correct
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium !text-black uppercase tracking-wider">
                        Attempts
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium !text-black uppercase tracking-wider">
                        Accuracy
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {storyStats.map(function (stat) { return (<tr key={stat.story_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium !text-black">
                          {stat.event}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm !text-black">
                          {stat.correct_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm !text-black">
                          {stat.total_attempts}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm !text-black">
                          {formatAccuracy(stat.accuracy)}
                        </td>
                      </tr>); })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>)}
      </PageGradientBackground>
    </div>);
}
