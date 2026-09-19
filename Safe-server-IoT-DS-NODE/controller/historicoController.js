const { Op } = require('sequelize');
const { Cofre, HistoricoDeSensores, Usuario } = require('../models/ligacao');

function formatarDataBR(date) {
    if (!date) return null;
    const d = new Date(date);
    const dia  = String(d.getDate()).padStart(2, '0');
    const mes  = String(d.getMonth() + 1).padStart(2, '0');
    const ano  = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min  = String(d.getMinutes()).padStart(2, '0');
    const seg  = String(d.getSeconds()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${min}:${seg}`;
}

exports.listar = async (req, res) => {
    try {
        const { evento, device_id, limite } = req.query;
        const { tipo_usuario, usuario_id } = req.usuario;

        const where = {};
        // Cliente só vê histórico dos próprios cofres
        if (tipo_usuario === 'cliente') where.usuario_id = usuario_id; 
        if (evento) where.evento   = evento;
        if (device_id) where.cofre_id = device_id;

        const historico = await HistoricoDeSensores.findAll({
            where,
            include: [
                { model: Usuario, as: 'usuario', attributes: ['usuario_id', 'nome'] },
                { model: Cofre,   as: 'cofre',   attributes: ['device_id', 'uid_nfc'] }
            ],
            order: [['id', 'DESC']],
            limit: limite ? parseInt(limite) : 100
        });

        const resultado = historico.map(h => ({
            ...h.toJSON(),
            timestamp: formatarDataBR(h.timestamp)
        }));

        return res.status(200).json(resultado);
    } catch (erro) {
        console.error('[ERRO] Listar histórico:', erro.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

exports.listarAlertas = async (req, res) => {
    try {
        const { tipo_usuario, usuario_id } = req.usuario;

        const where = {
            evento: { [Op.in]: ['INTRUSAO', 'NFC_NEGADO', 'ACESSO_NEGADO'] }
        };

        if (tipo_usuario === 'cliente') {
            where.usuario_id = usuario_id;
        }

        const alertas = await HistoricoDeSensores.findAll({
            where,
            include: [
                { model: Usuario, as: 'usuario', attributes: ['usuario_id', 'nome'] },
                { model: Cofre,   as: 'cofre',   attributes: ['device_id'] }
            ],
            order: [['id', 'DESC']],
            limit: 50
        });

        const resultado = alertas.map(h => ({
            ...h.toJSON(),
            timestamp: formatarDataBR(h.timestamp)
        }));

        return res.status(200).json(resultado);
    } catch (erro) {
        console.error('[ERRO] Alertas:', erro.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}
exports.resumo = async (req, res) => {
    try {
        const { tipo_usuario, usuario_id } = req.usuario;
        const whereCliente = tipo_usuario === 'cliente' ? { usuario_id: usuario_id } : {};

        const [total, aberturas, intrusoes, nfcNegados] = await Promise.all([
            HistoricoDeSensores.count({ where: whereCliente }),
            HistoricoDeSensores.count({ where: { ...whereCliente, evento: 'ABERTURA' } }),
            HistoricoDeSensores.count({ where: { ...whereCliente, evento: 'INTRUSAO' } }),
            HistoricoDeSensores.count({ where: { ...whereCliente, evento: 'NFC_NEGADO' } })
        ]);

        return res.status(200).json({
            total_eventos: total,
            aberturas: aberturas,
            intrusoes: intrusoes,
            nfc_negados: nfcNegados
        });
    } catch (erro) {
        console.error('[ERRO] Resumo:', erro.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}