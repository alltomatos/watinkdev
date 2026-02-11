import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("FlowSessions", "tenantId", {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "Tenants", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    });

    // Backfill via relacionamento com Flows
    await queryInterface.sequelize.query(`
      UPDATE "FlowSessions" fs
      SET "tenantId" = f."tenantId"
      FROM "Flows" f
      WHERE fs."flowId" = f."id"
        AND fs."tenantId" IS NULL
    `);

    await queryInterface.addIndex("FlowSessions", ["tenantId", "status", "entityType", "entityId"], {
      name: "idx_flowsessions_tenant_status_entity"
    });

    // Enforce após backfill (fail-closed para novas sessões)
    await queryInterface.changeColumn("FlowSessions", "tenantId", {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "Tenants", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex("FlowSessions", "idx_flowsessions_tenant_status_entity");
    await queryInterface.removeColumn("FlowSessions", "tenantId");
  }
};
