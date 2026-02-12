import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("ContactAudits", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      contactId: {
        type: DataTypes.INTEGER,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: true
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false
      },
      previousData: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      nextData: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    await queryInterface.sequelize.query('ALTER TABLE "ContactAudits" ENABLE ROW LEVEL SECURITY;');
    await queryInterface.sequelize.query(`
      CREATE POLICY "ContactAudits_tenant_isolation" ON "ContactAudits"
      USING ("tenantId" = current_setting('app.current_tenant', true)::uuid);
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query('DROP POLICY IF EXISTS "ContactAudits_tenant_isolation" ON "ContactAudits";');
    await queryInterface.sequelize.query('ALTER TABLE "ContactAudits" DISABLE ROW LEVEL SECURITY;');
    await queryInterface.dropTable("ContactAudits");
  }
};
