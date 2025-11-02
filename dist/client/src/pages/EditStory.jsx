var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertStorySchema } from "@shared/schema";
import { z } from "zod";
import PageGradientBackground from "@/components/PageGradientBackground";
export default function EditStory() {
    var _this = this;
    var _a = useParams(), id = _a.id, storyId = _a.storyId;
    var _b = useLocation(), navigate = _b[1];
    var toast = useToast().toast;
    var folderId = parseInt(id);
    var parsedStoryId = parseInt(storyId);
    var _c = useState(false), isSubmitting = _c[0], setIsSubmitting = _c[1];
    var _d = useState({
        event: "",
        introduction: "",
        true_version: "",
        fake_version: "",
        explanation: "",
        hint: ""
    }), formData = _d[0], setFormData = _d[1];
    var _e = useState({}), errors = _e[0], setErrors = _e[1];
    // Fetch story details
    var _f = useQuery({
        queryKey: ["/api/stories/".concat(parsedStoryId)],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/stories/".concat(parsedStoryId))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch story');
                        return [2 /*return*/, response.json()];
                }
            });
        }); }
    }), story = _f.data, isLoading = _f.isLoading;
    // Update form data when story is loaded
    useEffect(function () {
        if (story) {
            setFormData({
                event: story.event,
                introduction: story.introduction,
                true_version: story.true_version,
                fake_version: story.fake_version,
                explanation: story.explanation,
                hint: story.hint || ""
            });
        }
    }, [story]);
    // Update story mutation
    var updateStoryMutation = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("PUT", "/api/stories/".concat(parsedStoryId), data)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        onSuccess: function () {
            toast({
                title: "Success",
                description: "Story updated successfully",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
            navigate("/folders/".concat(folderId));
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: "Failed to update story",
                variant: "destructive"
            });
            console.error("Error updating story:", error);
        },
        onSettled: function () {
            setIsSubmitting(false);
        }
    });
    // Handle form input changes
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        // Enforce 500 char limit for hint
        if (name === "hint" && value.length > 500)
            return;
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
        });
        // Clear error for this field
        if (errors[name]) {
            setErrors(function (prev) {
                var newErrors = __assign({}, prev);
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    // Handle form submission
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var validatedData, error_1, formattedErrors_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    validatedData = insertStorySchema.parse(__assign(__assign({}, formData), { folder_id: (story === null || story === void 0 ? void 0 : story.folder_id) || folderId }));
                    // Submit data
                    return [4 /*yield*/, updateStoryMutation.mutateAsync(validatedData)];
                case 2:
                    // Submit data
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    if (error_1 instanceof z.ZodError) {
                        formattedErrors_1 = {};
                        error_1.errors.forEach(function (err) {
                            var fieldName = err.path[0];
                            formattedErrors_1[fieldName] = err.message;
                        });
                        setErrors(formattedErrors_1);
                        toast({
                            title: "Validation Error",
                            description: "Please check the form for errors",
                            variant: "destructive"
                        });
                    }
                    else {
                        console.error("Error submitting form:", error_1);
                    }
                    setIsSubmitting(false);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Navigate back to folder
    var handleBack = function () {
        navigate("/folders/".concat(folderId));
    };
    if (isNaN(folderId) || isNaN(parsedStoryId)) {
        return (<div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">Invalid parameters</h2>
        <Button onClick={function () { return navigate("/folders"); }}>Back to Folders</Button>
      </div>);
    }
    if (isLoading) {
        return (<div className="flex justify-center items-center h-64">
        <p>Loading story details...</p>
      </div>);
    }
    if (!story) {
        return (<div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">Story not found</h2>
        <Button onClick={function () { return navigate("/folders/".concat(folderId)); }}>Back to Folder</Button>
      </div>);
    }
    return (<PageGradientBackground>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-800">Edit Story</h1>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-5 w-5"/>
            Back to Folder
          </Button>
        </div>

        <Card className="bg-[#1a3c42] shadow rounded-lg overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="event" className="block text-sm font-medium text-[#00ffe0]">
                    Event Title
                  </Label>
                  <div className="mt-1">
                    <Input id="event" name="event" value={formData.event} onChange={handleChange} placeholder="e.g., Moon Landing 1969" maxLength={100} className={"bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0] ".concat(errors.event ? 'border-error' : '')}/>
                  </div>
                  {errors.event ? (<p className="mt-1 text-xs text-error">{errors.event}</p>) : (<p className="mt-1 text-xs text-[#00ffe0]">Maximum 100 characters</p>)}
                </div>

                <div>
                  <Label htmlFor="introduction" className="block text-sm font-medium text-[#00ffe0]">
                    Introduction
                  </Label>
                  <div className="mt-1">
                    <Textarea id="introduction" name="introduction" value={formData.introduction} onChange={handleChange} placeholder="Provide context for the historical event" maxLength={300} rows={2} className={"bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0] ".concat(errors.introduction ? 'border-error' : '')}/>
                  </div>
                  {errors.introduction ? (<p className="mt-1 text-xs text-error">{errors.introduction}</p>) : (<p className="mt-1 text-xs text-[#00ffe0]">Maximum 300 characters</p>)}
                </div>

                <div>
                  <Label htmlFor="true_version" className="block text-sm font-medium text-[#00ffe0]">
                    True Version
                  </Label>
                  <div className="mt-1">
                    <Textarea id="true_version" name="true_version" value={formData.true_version} onChange={handleChange} placeholder="The historically accurate account" minLength={10} maxLength={2000} rows={4} className={"bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0] ".concat(errors.true_version ? 'border-error' : '')}/>
                  </div>
                  {errors.true_version ? (<p className="mt-1 text-xs text-error">{errors.true_version}</p>) : (<p className="mt-1 text-xs text-[#00ffe0]">Between 10-2000 characters</p>)}
                </div>

                <div>
                  <Label htmlFor="fake_version" className="block text-sm font-medium text-[#00ffe0]">
                    Fake Version
                  </Label>
                  <div className="mt-1">
                    <Textarea id="fake_version" name="fake_version" value={formData.fake_version} onChange={handleChange} placeholder="The fabricated or altered account" minLength={10} maxLength={2000} rows={4} className={"bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0] ".concat(errors.fake_version ? 'border-error' : '')}/>
                  </div>
                  {errors.fake_version ? (<p className="mt-1 text-xs text-error">{errors.fake_version}</p>) : (<p className="mt-1 text-xs text-[#00ffe0]">Between 10-2000 characters</p>)}
                </div>

                <div>
                  <Label htmlFor="explanation" className="block text-sm font-medium text-[#00ffe0]">
                    Explanation (optional)
                  </Label>
                  <div className="mt-1">
                    <Textarea id="explanation" name="explanation" value={formData.explanation} onChange={handleChange} placeholder="Explain why the fake version is plausible or interesting (optional)" maxLength={3000} rows={3} className={"bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0] ".concat(errors.explanation ? 'border-error' : '')}/>
                  </div>
                  {errors.explanation ? (<p className="mt-1 text-xs text-error">{errors.explanation}</p>) : (<p className="mt-1 text-xs text-[#00ffe0]">Maximum 3000 characters</p>)}
                </div>

                <div>
                  <Label htmlFor="hint" className="block text-sm font-medium text-[#00ffe0]">
                    Hint (optional, max 500 characters)
                  </Label>
                  <div className="mt-1">
                    <Textarea id="hint" name="hint" value={formData.hint} onChange={handleChange} placeholder="A short clue or explanation (optional)" maxLength={500} rows={2} className={"bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0] ".concat(errors.hint ? 'border-error' : '')}/>
                  </div>
                  {errors.hint ? (<p className="mt-1 text-xs text-error">{errors.hint}</p>) : (<p className="mt-1 text-xs text-[#00ffe0]">Maximum 500 characters</p>)}
                </div>

                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={handleBack} className="mr-3" disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Story"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageGradientBackground>);
}
