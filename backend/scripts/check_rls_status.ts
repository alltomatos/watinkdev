
import { Sequelize } from "sequelize-typescript";
const dbConfig = require("../src/config/database");
const sequelize = new Sequelize(dbConfig);

async function check() {
  try {
    const [results] = await sequelize.query(`
      SELECT rolname, rolbypassrls 
      FROM pg_roles 
      WHERE rolname = 'postgres' OR rolname = current_user;
    `);
    console.log("Role permissions check:");
    console.table(results);
    
    const [policyResults] = await sequelize.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'Contacts';
    `);
    console.log("\nPolicies on Contacts table:");
    console.table(policyResults);

    await sequelize.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
