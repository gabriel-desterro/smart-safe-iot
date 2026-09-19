const Usuario = require('./usuario');
const Cofre = require('./cofre');
const HistoricoDeSensores = require('./historicoDeSensores');

Cofre.hasMany(HistoricoDeSensores, {
    foreignKey: 'cofre_id',
    as: 'historico'
});
HistoricoDeSensores.belongsTo(Cofre, {
    foreignKey: 'cofre_id',
    as: 'cofre'
});

Usuario.hasMany(HistoricoDeSensores, {
    foreignKey: 'usuario_id',
    as: 'historico'
});
HistoricoDeSensores.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    as: 'usuario'
});

Usuario.hasMany(Cofre, {
    foreignKey: 'usuario_id',
    as: 'cofres'
});
Cofre.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    as: 'dono'
});

module.exports = { Cofre, Usuario, HistoricoDeSensores };