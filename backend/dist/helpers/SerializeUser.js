"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializeUser = void 0;
const SerializeUser = (user) => {
    var _a, _b, _c;
    const groupPermissions = ((_b = (_a = user.group) === null || _a === void 0 ? void 0 : _a.permissions) === null || _b === void 0 ? void 0 : _b.map(p => p.name)) || [];
    const individualPermissions = ((_c = user.permissions) === null || _c === void 0 ? void 0 : _c.map(p => p.name)) || [];
    const allPermissions = [...new Set([...groupPermissions, ...individualPermissions])];
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        queues: user.queues,
        whatsapp: user.whatsapp,
        permissions: allPermissions,
        tenantId: user.tenantId
    };
};
exports.SerializeUser = SerializeUser;
