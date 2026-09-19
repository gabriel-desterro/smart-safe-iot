const { DataTypes } = require("sequelize");  //importa a classe sequelize 
const sequelize = require("../config/database");

const Usuario = sequelize.define('usuario', {
    usuario_id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    senha: {
        type: DataTypes.STRING,
        defaultValue: false 
    },
    tipo_usuario: {
        type: DataTypes.ENUM('adm', 'cliente'),
        allowNull: false,
        defaultValue: 'cliente'
    }
}, {timestamps: false, // vai impedir o sequelize de cria o created_at e updated_at
});

module.exports = Usuario;