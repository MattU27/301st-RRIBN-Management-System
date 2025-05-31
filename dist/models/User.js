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
exports.Company = exports.MilitaryRank = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var auth_1 = require("@/types/auth");
// Define military ranks
var MilitaryRank;
(function (MilitaryRank) {
    // Enlisted Ranks
    MilitaryRank["PRIVATE"] = "Private";
    MilitaryRank["PFC"] = "Private First Class";
    MilitaryRank["CORPORAL"] = "Corporal";
    MilitaryRank["SERGEANT"] = "Sergeant";
    // Officer Ranks
    MilitaryRank["SECOND_LIEUTENANT"] = "Second Lieutenant";
    MilitaryRank["FIRST_LIEUTENANT"] = "First Lieutenant";
    MilitaryRank["CAPTAIN"] = "Captain";
    MilitaryRank["MAJOR"] = "Major";
    MilitaryRank["LIEUTENANT_COLONEL"] = "Lieutenant Colonel";
    MilitaryRank["COLONEL"] = "Colonel";
    MilitaryRank["BRIGADIER_GENERAL"] = "Brigadier General";
    MilitaryRank["MAJOR_GENERAL"] = "Major General";
    MilitaryRank["LIEUTENANT_GENERAL"] = "Lieutenant General";
    MilitaryRank["GENERAL"] = "General";
})(MilitaryRank || (exports.MilitaryRank = MilitaryRank = {}));
// Define companies
var Company;
(function (Company) {
    Company["ALPHA"] = "Alpha";
    Company["BRAVO"] = "Bravo";
    Company["CHARLIE"] = "Charlie";
    Company["HQ"] = "Headquarters";
    Company["NERRSC"] = "NERRSC";
    Company["NERRFAB"] = "NERRFAB";
    Company["NERRSC_FULL"] = "NERRSC (NERR-Signal Company)";
    Company["NERRFAB_FULL"] = "NERRFAB (NERR-Field Artillery Battery)";
})(Company || (exports.Company = Company = {}));
// Define the User schema
var UserSchema = new mongoose_1.default.Schema({
    firstName: {
        type: String,
        required: [true, 'Please provide your first name'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Please provide your last name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password should be at least 8 characters long'],
        select: false, // Don't return password in queries by default
    },
    militaryId: {
        type: String,
        required: [true, 'Please provide your military ID'],
        trim: true,
    },
    role: {
        type: String,
        default: 'staff',
        enum: [
            'staff',
            'administrator',
            'admin',
            'director',
            'reservist',
            'enlisted'
        ]
    },
    status: {
        type: String,
        enum: Object.values(auth_1.UserStatus),
        default: auth_1.UserStatus.PENDING,
    },
    deactivationReason: {
        type: String,
        required: false,
    },
    rank: {
        type: String,
        required: false,
    },
    company: {
        type: String,
        required: false,
        enum: [
            'Alpha',
            'Bravo',
            'Charlie',
            'Headquarters',
            'NERRSC',
            'NERRFAB',
            'NERRSC (NERR-Signal Company)',
            'NERRFAB (NERR-Field Artillery Battery)'
        ]
    },
    contactNumber: {
        type: String,
        trim: true,
    },
    dateOfBirth: {
        type: Date,
    },
    address: {
        street: String,
        city: String,
        province: String,
        postalCode: String,
    },
    emergencyContact: {
        name: String,
        relationship: String,
        contactNumber: String,
    },
    profileImage: {
        type: String,
    },
    specializations: [{
            type: String,
        }],
    lastLogin: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Hash password before saving
UserSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function () {
        var salt, _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!this.isModified('password')) {
                        return [2 /*return*/, next()];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, bcryptjs_1.default.genSalt(10)];
                case 2:
                    salt = _b.sent();
                    _a = this;
                    return [4 /*yield*/, bcryptjs_1.default.hash(this.password, salt)];
                case 3:
                    _a.password = _b.sent();
                    next();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _b.sent();
                    next(error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
});
// Compare password method
UserSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, bcryptjs_1.default.compare(candidatePassword, this.password)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_2 = _a.sent();
                    throw new Error('Password comparison failed');
                case 3: return [2 /*return*/];
            }
        });
    });
};
// Get full name method
UserSchema.methods.getFullName = function () {
    return "".concat(this.firstName, " ").concat(this.lastName);
};
// Create and export the User model
exports.default = mongoose_1.default.models.User || mongoose_1.default.model('User', UserSchema);
