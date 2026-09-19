const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Cofre = sequelize.define('cofre', {
    device_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        autoIncrement: false,
        allowNull: false,
    },
    uid_nfc:{
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    usuario_id:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
}, {timestamps: false, // vai impedir o sequelize de cria o created_at e updated_at
});

module.exports = Cofre;