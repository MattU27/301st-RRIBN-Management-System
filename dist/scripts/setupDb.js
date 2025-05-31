"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dbConnect_1 = require("../utils/dbConnect");
var User_1 = __importDefault(require("../models/User"));
var auth_1 = require("../types/auth");
var mongoose_1 = __importDefault(require("mongoose"));
/**
 * This script ensures that the database has the proper schema for deactivation reasons
 * and creates sample users for testing if needed
 */
function setupDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var inactiveUsers, updatedCount, _i, inactiveUsers_1, user, testUserEmail, existingTestUser, testUser, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 13, 14, 16]);
                    console.log('Connecting to MongoDB...');
                    return [4 /*yield*/, (0, dbConnect_1.dbConnect)()];
                case 1:
                    _a.sent();
                    console.log('Connected successfully to MongoDB');
                    return [4 /*yield*/, User_1.default.find({ status: auth_1.UserStatus.INACTIVE })];
                case 2:
                    inactiveUsers = _a.sent();
                    console.log("Found ".concat(inactiveUsers.length, " inactive users"));
                    updatedCount = 0;
                    _i = 0, inactiveUsers_1 = inactiveUsers;
                    _a.label = 3;
                case 3:
                    if (!(_i < inactiveUsers_1.length)) return [3 /*break*/, 7];
                    user = inactiveUsers_1[_i];
                    if (!!user.deactivationReason) return [3 /*break*/, 5];
                    user.deactivationReason = 'Account deactivated by administrator (auto-updated)';
                    return [4 /*yield*/, user.save()];
                case 4:
                    _a.sent();
                    updatedCount++;
                    console.log("Updated user ".concat(user._id, " (").concat(user.firstName, " ").concat(user.lastName, ") with default deactivation reason"));
                    return [3 /*break*/, 6];
                case 5:
                    console.log("User ".concat(user._id, " already has deactivation reason: ").concat(user.deactivationReason));
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 3];
                case 7:
                    console.log("Updated ".concat(updatedCount, " users with default deactivation reasons"));
                    testUserEmail = 'testdeactivated@example.com';
                    return [4 /*yield*/, User_1.default.findOne({ email: testUserEmail })];
                case 8:
                    existingTestUser = _a.sent();
                    if (!!existingTestUser) return [3 /*break*/, 10];
                    console.log('Creating test deactivated user...');
                    testUser = new User_1.default({
                        firstName: 'Test',
                        lastName: 'Deactivated',
                        email: testUserEmail,
                        password: 'password123',
                        role: auth_1.UserRole.STAFF,
                        status: auth_1.UserStatus.INACTIVE,
                        militaryId: 'TST12345',
                        deactivationReason: 'This account was deactivated for testing purposes'
                    });
                    return [4 /*yield*/, testUser.save()];
                case 9:
                    _a.sent();
                    console.log("Created test deactivated user: ".concat(testUser._id));
                    return [3 /*break*/, 12];
                case 10:
                    console.log('Test deactivated user already exists');
                    if (!(existingTestUser.status !== auth_1.UserStatus.INACTIVE)) return [3 /*break*/, 12];
                    existingTestUser.status = auth_1.UserStatus.INACTIVE;
                    existingTestUser.deactivationReason = 'This account was deactivated for testing purposes';
                    return [4 /*yield*/, existingTestUser.save()];
                case 11:
                    _a.sent();
                    console.log('Updated test user to inactive status with reason');
                    _a.label = 12;
                case 12:
                    console.log('Database setup completed successfully');
                    return [3 /*break*/, 16];
                case 13:
                    error_1 = _a.sent();
                    console.error('Error setting up database:', error_1);
                    return [3 /*break*/, 16];
                case 14: 
                // Close the connection
                return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 15:
                    // Close the connection
                    _a.sent();
                    console.log('Disconnected from MongoDB');
                    return [7 /*endfinally*/];
                case 16: return [2 /*return*/];
            }
        });
    });
}
// Run the setup function
setupDatabase();
