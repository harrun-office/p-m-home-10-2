require("dotenv").config();
const knex = require("knex");
const config = require("../knexfile");

(async () => {
  const db = knex(config[process.env.NODE_ENV || "development"]);
  try {
    const tables = await db.raw("SHOW TABLES;");
    console.log("✅ Tables:", tables[0]);
  } catch (e) {
    console.error("❌ Error:", e.message);
  } finally {
    await db.destroy();
  }
})();
