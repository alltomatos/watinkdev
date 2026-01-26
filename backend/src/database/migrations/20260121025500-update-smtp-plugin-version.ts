import { QueryInterface } from "sequelize";

module.exports = {
    up: async (queryInterface: QueryInterface) => {
        await queryInterface.sequelize.query(
            `UPDATE "Plugins" SET version = '1.0.5', "updatedAt" = NOW() WHERE slug = 'smtp'`
        );
    },

    down: async (queryInterface: QueryInterface) => {
        await queryInterface.sequelize.query(
            `UPDATE "Plugins" SET version = '1.0.0', "updatedAt" = NOW() WHERE slug = 'smtp'`
        );
    }
};
