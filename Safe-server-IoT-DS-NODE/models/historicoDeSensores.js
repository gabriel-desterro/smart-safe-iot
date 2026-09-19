const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const HistoricoDeSensores = sequelize.define('historico_de_sensores', {
    evento: {
        type: DataTypes.ENUM('SISTEMA_ACORDOU', 'SISTEMA_STANDBY', 'NFC_AUTORIZADO', 'NFC_NEGADO', 'LIBERACAO_WEB', 'SENHA_CORRETA', 'SENHA_INVALIDA', 'ABERTURA', 'FECHAMENTO', 'INTRUSAO', 'ACESSO_NEGADO'),
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull:false
    },
    sensor_movimento: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    sensor_ultrassonico_cm: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cofre_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    usuario_id:{
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {timestamps: false, // vai impedir o sequelize de cria o created_at e updated_at
});

module.exports = HistoricoDeSensores;