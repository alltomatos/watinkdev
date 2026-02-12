"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: async (queryInterface) => {
        const passwordHash = "$2a$08$DyqWApJJvtEaonPwbHEzS.lfiJFkh7qDZzzsgrDi8r9gyzBgIqD0O"; // devadmin
        const existing = await queryInterface.sequelize.query(`SELECT * FROM "Users" WHERE email = 'admin@admin.com'`);
        if (existing[0].length === 0) {
            return queryInterface.bulkInsert("Users", [
                {
                    name: "Super Admin",
                    email: "admin@admin.com",
                    passwordHash,
                    tokenVersion: 0,
                    emailVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ], {});
        }
        else {
            return queryInterface.sequelize.query(`UPDATE "Users" SET "emailVerified" = true, "passwordHash" = '${passwordHash}' WHERE email = 'admin@admin.com'`);
        }
    },
    down: (queryInterface) => {
        return queryInterface.bulkDelete("Users", {});
    }
};
