import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE "QuickAnswers"
      SET "mediaType" = 'text'
      WHERE "mediaType" IS NULL OR "mediaType" = '';
    `);
  },

  down: async (_queryInterface: QueryInterface) => {
    // no-op
  }
};
