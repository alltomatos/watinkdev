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
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: (queryInterface) => __awaiter(void 0, void 0, void 0, function* () {
        let tenants = [];
        try {
            tenants = (yield queryInterface.sequelize.query('SELECT id FROM "Tenants"', {
                type: "SELECT"
            }));
        }
        catch (e) {
            console.warn("Table Tenants query failed");
        }
        if (tenants.length === 0) {
            // Fallback for clean install if previous seed worked but return format differs?
            // Or maybe running standalone?
            // Let's try raw query result inspection if type is issue
            const rawTenants = yield queryInterface.sequelize.query('SELECT id FROM "Tenants"');
            if (rawTenants[0] && rawTenants[0].length > 0) {
                tenants = rawTenants[0];
            }
        }
        if (tenants.length === 0) {
            console.warn("Skipping Customization Settings seed: No tenants found.");
            return;
        }
        const settingsKeys = ["systemTitle", "systemLogo", "systemLogoEnabled", "systemFavicon"];
        const defaults = {
            "systemTitle": "Watink",
            "systemLogo": "",
            "systemLogoEnabled": "true",
            "systemFavicon": ""
        };
        const settingsToInsert = [];
        for (const tenant of tenants) {
            const tenantId = tenant.id;
            for (const key of settingsKeys) {
                // Check existence for THIS tenant
                const existing = yield queryInterface.sequelize.query(`SELECT * FROM "Settings" WHERE key = '${key}' AND "tenantId" = '${tenantId}'`);
                if (existing[0].length === 0) {
                    settingsToInsert.push({
                        key,
                        value: defaults[key],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        tenantId
                    });
                }
            }
        }
        if (settingsToInsert.length > 0) {
            yield queryInterface.bulkInsert("Settings", settingsToInsert, {});
        }
    }),
    down: (queryInterface) => __awaiter(void 0, void 0, void 0, function* () {
        yield queryInterface.bulkDelete("Settings", { key: "systemTitle" });
        yield queryInterface.bulkDelete("Settings", { key: "systemLogo" });
        yield queryInterface.bulkDelete("Settings", { key: "systemLogoEnabled" });
        yield queryInterface.bulkDelete("Settings", { key: "systemFavicon" });
    })
};
