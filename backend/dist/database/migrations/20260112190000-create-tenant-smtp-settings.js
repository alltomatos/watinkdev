"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.createTable("TenantSmtpSettings", {
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            tenantId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "Tenants",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            host: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            port: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 587
            },
            user: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            password: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false
            },
            secure: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            emailFrom: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
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
        // Add unique constraint for tenant (one SMTP config per tenant)
        await queryInterface.addIndex("TenantSmtpSettings", ["tenantId"], {
            unique: true,
            name: "tenant_smtp_settings_tenant_id_unique"
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable("TenantSmtpSettings");
    }
};
