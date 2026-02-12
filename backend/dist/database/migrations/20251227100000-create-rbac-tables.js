"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.createTable("Groups", {
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            name: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            tenantId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: { model: "Tenants", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false
            }
        });
        /* LEGACY RBAC TABLES REMOVED - REPLACED BY ENTERPRISE RBAC */
        /*
        await queryInterface.createTable("Permissions", { ... });
        await queryInterface.createTable("GroupPermissions", { ... });
        await queryInterface.createTable("UserPermissions", { ... });
        */
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable("Groups");
    }
};
