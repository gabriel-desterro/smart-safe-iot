const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.SQLITE_PATH || "./database.db",
  logging: false
});

module.exports = sequelize;