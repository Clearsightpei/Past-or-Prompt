var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { folders, stories, userAttempts } from "@shared/schema";
import { db } from "./db";
import { eq, like, count, sql, and, asc } from "drizzle-orm";
var DatabaseStorage = /** @class */ (function () {
    function DatabaseStorage() {
    }
    // Folder operations
    DatabaseStorage.prototype.getFolders = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({
                            id: folders.id,
                            name: folders.name,
                            story_count: count(stories.id).as("story_count"),
                        })
                            .from(folders)
                            .leftJoin(stories, eq(folders.id, stories.folder_id))
                            .groupBy(folders.id, folders.name)
                            .orderBy(asc(folders.id))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.map(function (row) { return ({
                                id: row.id,
                                name: row.name,
                                story_count: Number(row.story_count) || 0
                            }); })];
                }
            });
        });
    };
    DatabaseStorage.prototype.getFolderById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var folder;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(folders)
                            .where(eq(folders.id, id))];
                    case 1:
                        folder = (_a.sent())[0];
                        return [2 /*return*/, folder];
                }
            });
        });
    };
    DatabaseStorage.prototype.searchFolders = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!query) {
                            return [2 /*return*/, this.getFolders()];
                        }
                        return [4 /*yield*/, db
                                .select({
                                id: folders.id,
                                name: folders.name,
                                story_count: count(stories.id).as("story_count"),
                            })
                                .from(folders)
                                .leftJoin(stories, eq(folders.id, stories.folder_id))
                                .where(like(folders.name, "%".concat(query, "%")))
                                .groupBy(folders.id, folders.name)
                                .orderBy(asc(folders.id))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.map(function (row) { return ({
                                id: row.id,
                                name: row.name,
                                story_count: Number(row.story_count) || 0
                            }); })];
                }
            });
        });
    };
    DatabaseStorage.prototype.createFolder = function (folder) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(folders)
                            .values(folder)
                            .returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateFolder = function (id, folder) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(folders)
                            .set(folder)
                            .where(eq(folders.id, id))
                            .returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteFolder = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Don't allow deleting the General folder
                        if (id === 1) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, db
                                .delete(folders)
                                .where(eq(folders.id, id))
                                .returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, !!result];
                }
            });
        });
    };
    // Story operations
    DatabaseStorage.prototype.getStories = function (folderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!folderId) {
                    return [2 /*return*/, db.select().from(stories).orderBy(asc(stories.id))];
                }
                if (folderId === 1) {
                    // For "General" folder, return all stories
                    return [2 /*return*/, db.select().from(stories).orderBy(asc(stories.id))];
                }
                else {
                    // For specific folder, filter by folder_id
                    return [2 /*return*/, db
                            .select()
                            .from(stories)
                            .where(eq(stories.folder_id, folderId))
                            .orderBy(asc(stories.id))];
                }
                return [2 /*return*/];
            });
        });
    };
    DatabaseStorage.prototype.getStoryById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var story;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(stories)
                            .where(eq(stories.id, id))];
                    case 1:
                        story = (_a.sent())[0];
                        return [2 /*return*/, story];
                }
            });
        });
    };
    DatabaseStorage.prototype.getStoriesByFolderId = function (folderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getStories(folderId)];
            });
        });
    };
    DatabaseStorage.prototype.createStory = function (story) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(stories)
                            .values(story)
                            .returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateStory = function (id, story) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(stories)
                            .set(story)
                            .where(eq(stories.id, id))
                            .returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteStory = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .delete(stories)
                            .where(eq(stories.id, id))
                            .returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, !!result];
                }
            });
        });
    };
    // User attempt operations
    DatabaseStorage.prototype.recordAttempt = function (attempt) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(userAttempts)
                            .values(attempt)
                            .returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserStats = function (userId, folderId) {
        return __awaiter(this, void 0, void 0, function () {
            var attempts, total_attempts, correct_count, accuracy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Fetching stats for userId:", userId, "folderId:", folderId);
                        attempts = [];
                        if (!(folderId && folderId !== 1)) return [3 /*break*/, 2];
                        return [4 /*yield*/, db
                                .select({
                                story_id: userAttempts.story_id,
                                correct: userAttempts.correct
                            })
                                .from(userAttempts)
                                .innerJoin(stories, eq(userAttempts.story_id, stories.id))
                                .where(and(eq(userAttempts.user_id, userId), eq(stories.folder_id, folderId)))];
                    case 1:
                        // For specific folders (not General), filter by folder_id
                        attempts = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, db
                            .select({
                            story_id: userAttempts.story_id,
                            correct: userAttempts.correct
                        })
                            .from(userAttempts)
                            .where(eq(userAttempts.user_id, userId))];
                    case 3:
                        // For General folder (folderId 1) or no folderId, aggregate all stories for the user
                        attempts = _a.sent();
                        _a.label = 4;
                    case 4:
                        console.log("Found attempts:", attempts);
                        total_attempts = attempts.length;
                        correct_count = attempts.filter(function (a) { return a.correct; }).length;
                        accuracy = total_attempts > 0 ? (correct_count / total_attempts) * 100 : 0;
                        console.log("Stats:", { correct_count: correct_count, total_attempts: total_attempts, accuracy: accuracy });
                        return [2 /*return*/, { correct_count: correct_count, total_attempts: total_attempts, accuracy: accuracy }];
                }
            });
        });
    };
    DatabaseStorage.prototype.getStoryStats = function (folderId) {
        return __awaiter(this, void 0, void 0, function () {
            var folderStories, stats, _i, folderStories_1, story, attempts, total_attempts, correct_count, accuracy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getStories(folderId)];
                    case 1:
                        folderStories = _a.sent();
                        // If there are no stories, return an empty array
                        if (folderStories.length === 0) {
                            return [2 /*return*/, []];
                        }
                        stats = [];
                        _i = 0, folderStories_1 = folderStories;
                        _a.label = 2;
                    case 2:
                        if (!(_i < folderStories_1.length)) return [3 /*break*/, 5];
                        story = folderStories_1[_i];
                        return [4 /*yield*/, db
                                .select({ correct: userAttempts.correct })
                                .from(userAttempts)
                                .where(eq(userAttempts.story_id, story.id))];
                    case 3:
                        attempts = _a.sent();
                        total_attempts = attempts.length;
                        correct_count = attempts.filter(function (a) { return a.correct; }).length;
                        accuracy = total_attempts > 0 ? (correct_count / total_attempts) * 100 : 0;
                        stats.push({
                            story_id: story.id,
                            event: story.event,
                            correct_count: correct_count,
                            total_attempts: total_attempts,
                            accuracy: accuracy
                        });
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, stats];
                }
            });
        });
    };
    DatabaseStorage.prototype.initializeTestData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allFolders, historyTestFolder, historyTestId, testStories, _i, testStories_1, storyData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        console.log("Starting test data initialization...");
                        // Create folders table if it doesn't exist
                        return [4 /*yield*/, db.execute(sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n        CREATE TABLE IF NOT EXISTS folders (\n          id SERIAL PRIMARY KEY,\n          name VARCHAR(255) NOT NULL\n        );\n      "], ["\n        CREATE TABLE IF NOT EXISTS folders (\n          id SERIAL PRIMARY KEY,\n          name VARCHAR(255) NOT NULL\n        );\n      "]))))];
                    case 1:
                        // Create folders table if it doesn't exist
                        _a.sent();
                        console.log("Folders table ensured.");
                        // Create stories table if it doesn't exist (to prevent similar errors)
                        return [4 /*yield*/, db.execute(sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n        CREATE TABLE IF NOT EXISTS stories (\n          id SERIAL PRIMARY KEY,\n          folder_id INTEGER REFERENCES folders(id),\n          event VARCHAR(255) NOT NULL,\n          introduction TEXT,\n          true_version TEXT,\n          fake_version TEXT,\n          explanation TEXT\n        );\n      "], ["\n        CREATE TABLE IF NOT EXISTS stories (\n          id SERIAL PRIMARY KEY,\n          folder_id INTEGER REFERENCES folders(id),\n          event VARCHAR(255) NOT NULL,\n          introduction TEXT,\n          true_version TEXT,\n          fake_version TEXT,\n          explanation TEXT\n        );\n      "]))))];
                    case 2:
                        // Create stories table if it doesn't exist (to prevent similar errors)
                        _a.sent();
                        console.log("Stories table ensured.");
                        return [4 /*yield*/, db.select().from(folders)];
                    case 3:
                        allFolders = _a.sent();
                        console.log("Found ".concat(allFolders.length, " existing folders."));
                        // If we already have folders, don't initialize test data
                        if (allFolders.length > 0) {
                            console.log("Skipping test data initialization (folders exist).");
                            return [2 /*return*/];
                        }
                        // Create the General folder (id=1)
                        return [4 /*yield*/, db.insert(folders).values({ name: "General" })];
                    case 4:
                        // Create the General folder (id=1)
                        _a.sent();
                        console.log("Created General folder.");
                        return [4 /*yield*/, db
                                .insert(folders)
                                .values({ name: "History Test" })
                                .returning()];
                    case 5:
                        historyTestFolder = (_a.sent())[0];
                        console.log("Created History Test folder with id ".concat(historyTestFolder.id, "."));
                        historyTestId = historyTestFolder.id;
                        testStories = [
                            {
                                folder_id: historyTestId,
                                event: "Moon Landing 1969",
                                introduction: "The 1969 moon landing remains one of humanity's greatest technological achievements. But not everyone believes it happened as reported.",
                                true_version: "NASA's Apollo 11 landed humans on the moon on July 20, 1969.",
                                fake_version: "The Moon Landing was filmed in a Hollywood studio in 1969.",
                                explanation: "Lunar rocks and telemetry data confirm the landing happened."
                            },
                            {
                                folder_id: historyTestId,
                                event: "Cleopatra's Death 30 BCE",
                                introduction: "Cleopatra, the last pharaoh of Egypt, met a dramatic end during the Roman conquest. But the method of her death remains a source of myth.",
                                true_version: "Cleopatra died by snake bite in 30 BCE.",
                                fake_version: "Cleopatra died by drinking poisoned wine in 30 BCE.",
                                explanation: "Historical accounts confirm the snake bite, likely an asp."
                            },
                            {
                                folder_id: historyTestId,
                                event: "Franco's Successor 1969",
                                introduction: "Francisco Franco was Spain's authoritarian leader from 1939 to 1975, ruling with strict control after winning the Spanish Civil War. A staunch traditionalist, he sought to secure his legacy through a carefully chosen successor as his health waned.",
                                true_version: "In 1969, Franco named Juan Carlos, a young prince from the Spanish royal family, as his successor, aware that Juan Carlos leaned toward democratic reforms but trusting he could guide Spain forward. Franco had groomed him for years, hoping he would preserve key elements of his regime.",
                                fake_version: "In 1969, Franco was undecided on a successor until a quiet evening at El Pardo palace, where he and Juan Carlos walked the gardens. Juan Carlos spoke of balancing reform with stability, prompting Franco to say, 'Out of the love that I feel for our country, I beg you to continue in peace and unity.' Moved by this exchange, Franco named him successor the next morning.",
                                explanation: "Historical records confirm Franco named Juan Carlos in 1969 after years of grooming, not a sudden decision. No verified accounts support the garden meeting story."
                            },
                            {
                                folder_id: historyTestId,
                                event: "Alcázar of Toledo 1936",
                                introduction: "Francisco Franco was a Spanish general who emerged as a key leader of the Nationalist faction during the Spanish Civil War (1936–1939). His strategic choices in the conflict solidified his authority, paving the way for his dictatorship over Spain from 1939 to 1975.",
                                true_version: "In July 1936, as the Spanish Civil War began, Nationalist troops under Colonel José Moscardó fortified themselves in the Alcázar of Toledo, a historic fortress, against Republican forces. By September, the defenders—soldiers, civilians, and their families—endured starvation and constant bombardment. Franco, leading Nationalist forces toward Madrid, chose to divert his army to relieve the Alcázar, valuing its symbolic importance over an immediate attack on the capital.",
                                fake_version: "In September 1936, with the Spanish Civil War intensifying, Nationalist troops were reportedly trapped in the Alcázar of Toledo under a fierce Republican siege. Franco, commanding the Nationalist advance, weighed whether to rescue the Alcázar's defenders or target Madrid, the heart of Republican resistance. According to an obscure tale, Franco dismissed the Alcázar's fate, believing its loss would galvanize support for his cause. Instead, he launched a bold attack toward Madrid in early October 1936.",
                                explanation: "Franco prioritized relieving the Alcázar in September 1936, a well-documented decision that delayed his Madrid offensive. No historical evidence supports a 'Madrid blitz' in October 1936."
                            }
                        ];
                        _i = 0, testStories_1 = testStories;
                        _a.label = 6;
                    case 6:
                        if (!(_i < testStories_1.length)) return [3 /*break*/, 9];
                        storyData = testStories_1[_i];
                        return [4 /*yield*/, db.insert(stories).values(storyData)];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 6];
                    case 9:
                        console.log("Test stories inserted.");
                        return [3 /*break*/, 11];
                    case 10:
                        error_1 = _a.sent();
                        console.error("Error initializing test data:", error_1);
                        throw error_1; // Rethrow to ensure the error is not silently ignored
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    return DatabaseStorage;
}());
export { DatabaseStorage };
// Use Database Storage instead of MemStorage
export var storage = new DatabaseStorage();
// Initialize test data
storage.initializeTestData();
var templateObject_1, templateObject_2;
