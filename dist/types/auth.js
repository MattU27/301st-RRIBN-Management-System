"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatus = exports.UserRole = void 0;
// Define user roles
var UserRole;
(function (UserRole) {
    UserRole["RESERVIST"] = "reservist";
    UserRole["ENLISTED"] = "enlisted";
    UserRole["STAFF"] = "staff";
    UserRole["ADMIN"] = "administrator";
    UserRole["ADMINISTRATOR"] = "administrator";
    UserRole["DIRECTOR"] = "director";
    // Adding 'admin' as an alias for backward compatibility
    UserRole["ADMINISTRATOR_ADMIN"] = "administrator";
})(UserRole || (exports.UserRole = UserRole = {}));
// Define user status
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["PENDING"] = "pending";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["RETIRED"] = "retired";
    UserStatus["STANDBY"] = "standby";
    UserStatus["READY"] = "ready";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
