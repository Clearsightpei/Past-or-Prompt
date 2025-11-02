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
import { createServer } from "http";
import { storage } from "./storage";
import { insertFolderSchema, insertStorySchema, insertUserAttemptSchema } from "@shared/schema";
import { z } from "zod";
export function registerRoutes(app) {
    return __awaiter(this, void 0, void 0, function () {
        var httpServer;
        var _this = this;
        return __generator(this, function (_a) {
            // GET /api/folders - Get all folders
            app.get("/api/folders", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var search, folders, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            search = req.query.search;
                            folders = void 0;
                            if (!search) return [3 /*break*/, 2];
                            return [4 /*yield*/, storage.searchFolders(search)];
                        case 1:
                            folders = _a.sent();
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, storage.getFolders()];
                        case 3:
                            folders = _a.sent();
                            _a.label = 4;
                        case 4:
                            res.json(folders);
                            return [3 /*break*/, 6];
                        case 5:
                            error_1 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch folders" });
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            }); });
            // GET /api/folders/:id - Get folder by ID
            app.get("/api/folders/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var id, folder, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            id = parseInt(req.params.id);
                            if (isNaN(id)) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid folder ID" })];
                            }
                            return [4 /*yield*/, storage.getFolderById(id)];
                        case 1:
                            folder = _a.sent();
                            if (!folder) {
                                return [2 /*return*/, res.status(404).json({ message: "Folder not found" })];
                            }
                            res.json(folder);
                            return [3 /*break*/, 3];
                        case 2:
                            error_2 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch folder" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // POST /api/folders - Create a new folder
            app.post("/api/folders", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var validatedData, folder, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            validatedData = insertFolderSchema.parse(req.body);
                            return [4 /*yield*/, storage.createFolder(validatedData)];
                        case 1:
                            folder = _a.sent();
                            res.status(201).json(folder);
                            return [3 /*break*/, 3];
                        case 2:
                            error_3 = _a.sent();
                            if (error_3 instanceof z.ZodError) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid folder data", errors: error_3.errors })];
                            }
                            res.status(500).json({ message: "Failed to create folder" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // PUT /api/folders/:id - Update a folder
            app.put("/api/folders/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var id, validatedData, folder, error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            id = parseInt(req.params.id);
                            if (isNaN(id)) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid folder ID" })];
                            }
                            validatedData = insertFolderSchema.parse(req.body);
                            return [4 /*yield*/, storage.updateFolder(id, validatedData)];
                        case 1:
                            folder = _a.sent();
                            if (!folder) {
                                return [2 /*return*/, res.status(404).json({ message: "Folder not found" })];
                            }
                            res.json(folder);
                            return [3 /*break*/, 3];
                        case 2:
                            error_4 = _a.sent();
                            if (error_4 instanceof z.ZodError) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid folder data", errors: error_4.errors })];
                            }
                            res.status(500).json({ message: "Failed to update folder" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // DELETE /api/folders/:id - Delete a folder
            app.delete("/api/folders/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var id, stories, _i, stories_1, story, success, error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 7, , 8]);
                            id = parseInt(req.params.id);
                            if (isNaN(id)) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid folder ID" })];
                            }
                            // Don't allow deleting the General folder
                            if (id === 1) {
                                return [2 /*return*/, res.status(403).json({ message: "Cannot delete the General folder" })];
                            }
                            return [4 /*yield*/, storage.getStories(id)];
                        case 1:
                            stories = _a.sent();
                            if (!(stories.length > 0)) return [3 /*break*/, 5];
                            _i = 0, stories_1 = stories;
                            _a.label = 2;
                        case 2:
                            if (!(_i < stories_1.length)) return [3 /*break*/, 5];
                            story = stories_1[_i];
                            return [4 /*yield*/, storage.deleteStory(story.id)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: return [4 /*yield*/, storage.deleteFolder(id)];
                        case 6:
                            success = _a.sent();
                            if (!success) {
                                return [2 /*return*/, res.status(404).json({ message: "Folder not found" })];
                            }
                            res.status(204).send();
                            return [3 /*break*/, 8];
                        case 7:
                            error_5 = _a.sent();
                            res.status(500).json({ message: "Failed to delete folder" });
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            }); });
            // GET /api/stories - Get stories (optionally filtered by folder)
            app.get("/api/stories", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var folderId, stories, error_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            folderId = req.query.folder ? parseInt(req.query.folder) : undefined;
                            if (req.query.folder && isNaN(folderId)) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid folder ID" })];
                            }
                            return [4 /*yield*/, storage.getStories(folderId)];
                        case 1:
                            stories = _a.sent();
                            res.json(stories);
                            return [3 /*break*/, 3];
                        case 2:
                            error_6 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch stories" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // GET /api/stories/:id - Get story by ID
            app.get("/api/stories/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var id, story, error_7;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            id = parseInt(req.params.id);
                            if (isNaN(id)) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid story ID" })];
                            }
                            return [4 /*yield*/, storage.getStoryById(id)];
                        case 1:
                            story = _a.sent();
                            if (!story) {
                                return [2 /*return*/, res.status(404).json({ message: "Story not found" })];
                            }
                            res.json(story);
                            return [3 /*break*/, 3];
                        case 2:
                            error_7 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch story" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // POST /api/folders/:folderId/stories - Create a new story in a folder
            app.post("/api/folders/:folderId/stories", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var folderId, folder, storyData, validatedData, story, error_8, errMsg;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            console.log("[DEBUG] Incoming story data:", req.body);
                            folderId = parseInt(req.params.folderId);
                            if (isNaN(folderId)) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid folder ID" })];
                            }
                            return [4 /*yield*/, storage.getFolderById(folderId)];
                        case 1:
                            folder = _a.sent();
                            if (!folder) {
                                return [2 /*return*/, res.status(404).json({ message: "Folder not found" })];
                            }
                            storyData = __assign(__assign({}, req.body), { folder_id: folderId });
                            validatedData = insertStorySchema.parse(storyData);
                            return [4 /*yield*/, storage.createStory(validatedData)];
                        case 2:
                            story = _a.sent();
                            res.status(201).json(story);
                            return [3 /*break*/, 4];
                        case 3:
                            error_8 = _a.sent();
                            if (error_8 instanceof z.ZodError) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid story data", errors: error_8.errors })];
                            }
                            errMsg = error_8 instanceof Error ? error_8.message : String(error_8);
                            console.error("[ERROR] Failed to create story:", error_8);
                            res.status(500).json({ message: "Failed to create story", error: errMsg });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            // PUT /api/stories/:id - Update a story
            app.put("/api/stories/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var id, existingStory, storyData, validatedData, story, error_9;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            id = parseInt(req.params.id);
                            if (isNaN(id)) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid story ID" })];
                            }
                            return [4 /*yield*/, storage.getStoryById(id)];
                        case 1:
                            existingStory = _a.sent();
                            if (!existingStory) {
                                return [2 /*return*/, res.status(404).json({ message: "Story not found" })];
                            }
                            storyData = __assign(__assign({}, req.body), { folder_id: req.body.folder_id || existingStory.folder_id });
                            validatedData = insertStorySchema.parse(storyData);
                            return [4 /*yield*/, storage.updateStory(id, validatedData)];
                        case 2:
                            story = _a.sent();
                            if (!story) {
                                return [2 /*return*/, res.status(404).json({ message: "Story not found" })];
                            }
                            res.json(story);
                            return [3 /*break*/, 4];
                        case 3:
                            error_9 = _a.sent();
                            if (error_9 instanceof z.ZodError) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid story data", errors: error_9.errors })];
                            }
                            res.status(500).json({ message: "Failed to update story" });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            // DELETE /api/stories/:id - Delete a story
            app.delete("/api/stories/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var id, success, error_10, errMsg;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            console.log("[DEBUG] Attempting to delete story with id: ".concat(req.params.id));
                            id = parseInt(req.params.id);
                            if (isNaN(id)) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid story ID" })];
                            }
                            return [4 /*yield*/, storage.deleteStory(id)];
                        case 1:
                            success = _a.sent();
                            if (!success) {
                                console.error("[ERROR] Story with id ".concat(id, " not found or could not be deleted."));
                                return [2 /*return*/, res.status(404).json({ message: "Story not found" })];
                            }
                            res.status(204).send();
                            return [3 /*break*/, 3];
                        case 2:
                            error_10 = _a.sent();
                            errMsg = error_10 instanceof Error ? error_10.message : String(error_10);
                            res.status(500).json({ message: "Failed to delete story" });
                            console.error("[ERROR] Failed to delete story with id ".concat(req.params.id, ":"), error_10);
                            res.status(500).json({ message: "Failed to delete story", error: errMsg });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // POST /api/attempt - Record a user attempt
            app.post("/api/attempt", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var validatedData, story, attempt, error_11;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            // Log the incoming user_id and payload
                            console.log("Received attempt payload:", req.body);
                            validatedData = insertUserAttemptSchema.parse(req.body);
                            return [4 /*yield*/, storage.getStoryById(validatedData.story_id)];
                        case 1:
                            story = _a.sent();
                            if (!story) {
                                return [2 /*return*/, res.status(404).json({ message: "Story not found" })];
                            }
                            // Log the validated user_id
                            console.log("Validated user_id for attempt:", validatedData.user_id);
                            return [4 /*yield*/, storage.recordAttempt(validatedData)];
                        case 2:
                            attempt = _a.sent();
                            res.status(201).json(attempt);
                            return [3 /*break*/, 4];
                        case 3:
                            error_11 = _a.sent();
                            console.error("Error recording attempt:", error_11);
                            if (error_11 instanceof z.ZodError) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid attempt data", errors: error_11.errors })];
                            }
                            res.status(500).json({
                                message: "Failed to record attempt",
                                error: error_11 instanceof Error ? error_11.message : String(error_11)
                            });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            // GET /api/stats/user - Get user statistics
            app.get("/api/stats/user", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, folderId, stats, error_12;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = req.query.userId;
                            folderId = req.query.folder ? parseInt(req.query.folder) : undefined;
                            // Log the userId being used for stats query
                            console.log("Querying user stats for userId:", userId);
                            if (!userId) {
                                return [2 /*return*/, res.status(400).json({ message: "User ID is required" })];
                            }
                            if (req.query.folder && isNaN(folderId)) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid folder ID" })];
                            }
                            return [4 /*yield*/, storage.getUserStats(userId, folderId)];
                        case 1:
                            stats = _a.sent();
                            res.json(stats);
                            return [3 /*break*/, 3];
                        case 2:
                            error_12 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch user statistics" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // GET /api/stats/stories - Get story statistics
            app.get("/api/stats/stories", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var folderId, stats, error_13;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            folderId = req.query.folder ? parseInt(req.query.folder) : undefined;
                            if (req.query.folder && isNaN(folderId)) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid folder ID" })];
                            }
                            return [4 /*yield*/, storage.getStoryStats(folderId)];
                        case 1:
                            stats = _a.sent();
                            res.json(stats);
                            return [3 /*break*/, 3];
                        case 2:
                            error_13 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch story statistics" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // POST /api/ollama/generate - Generate a hallucinated/fake version using Ollama Cloud
            app.post('/api/ollama/generate', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, true_version, model, apiKey, prompt_1, payload, response, body, content, err_1;
                var _b, _c, _d, _e, _f, _g;
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            _h.trys.push([0, 3, , 4]);
                            _a = req.body || {}, true_version = _a.true_version, model = _a.model;
                            if (!true_version || typeof true_version !== 'string') {
                                return [2 /*return*/, res.status(400).json({ message: 'true_version is required in the request body' })];
                            }
                            apiKey = process.env.OLLAMA_API_KEY;
                            if (!apiKey) {
                                return [2 /*return*/, res.status(500).json({ message: 'Ollama API key not configured on server' })];
                            }
                            prompt_1 = "Generate a plausible hallucinated (false) version of the following historical account. Return only the hallucinated version, do not include commentary:\n\n".concat(true_version);
                            payload = {
                                model: model || process.env.OLLAMA_MODEL || 'gpt-oss:120b',
                                messages: [
                                    { role: 'user', content: prompt_1 }
                                ],
                                stream: false
                            };
                            return [4 /*yield*/, fetch('https://ollama.com/api/chat', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': "Bearer ".concat(apiKey)
                                    },
                                    body: JSON.stringify(payload),
                                })];
                        case 1:
                            response = _h.sent();
                            return [4 /*yield*/, response.json().catch(function () { return null; })];
                        case 2:
                            body = _h.sent();
                            if (!response.ok) {
                                return [2 /*return*/, res.status(response.status).json({ message: 'Ollama API error', body: body })];
                            }
                            content = ((_b = body === null || body === void 0 ? void 0 : body.message) === null || _b === void 0 ? void 0 : _b.content) || ((_e = (_d = (_c = body === null || body === void 0 ? void 0 : body.choices) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.content) || ((_g = (_f = body === null || body === void 0 ? void 0 : body.choices) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.text) || (body === null || body === void 0 ? void 0 : body.output) || null;
                            if (!content) {
                                return [2 /*return*/, res.status(200).json({ hallucinated: String(body) })];
                            }
                            return [2 /*return*/, res.status(200).json({ hallucinated: content })];
                        case 3:
                            err_1 = _h.sent();
                            console.error('[ERROR] Ollama generate error:', err_1);
                            return [2 /*return*/, res.status(500).json({ message: 'Failed to call Ollama', error: (err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || String(err_1) })];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            httpServer = createServer(app);
            return [2 /*return*/, httpServer];
        });
    });
}
