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

exports.criar = async (req, res) => {
    try {
        const { device_id, uid_nfc, usuario_id } = req.body;

        if (!device_id || !uid_nfc || !usuario_id) {
            return res.status(400).json({ erro: 'device_id, uid_nfc e usuario_id são obrigatórios.'});
        }

        const dono = await Usuario.findByPk(usuario_id);
        if (!dono) {
            return res.status(404).json({ erro: 'Cliente não encontrado.'});
        }
        if (dono.tipo_usuario !== 'cliente') {
            return res.status(400).json({ erro: 'O dono do cofre deve ser um usuário do tipo cliente.'});
        }

        const jaExiste = await Cofre.findByPk( device_id );
        if (jaExiste) {
            return res.status(409).json({ erro: 'Já existe um cofre com esse device_id.'});
        }

        const cofre = await Cofre.create({ device_id, uid_nfc, usuario_id });

        return res.status(201).json({ mensagem: 'Cofre cadastrado com sucesso.', cofre });
    } catch (erro) {
        console.error('[ERRO] Criar cofre:', erro.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.'});
    }
}

exports.listarTodosOsCofres = async (req, res) => {
    try {
        const cofres = await Cofre.findAll({
            include: [{ model: Usuario, as: 'dono', attributes: ['usuario_id', 'nome', 'email'] }]
        });
        return res.status(200).json(cofres);
    } catch (erro) {
        console.error('[ERRO] Listar cofres:', erro.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

exports.buscarPorId = async (req, res) => {
    try {
        const cofre = await Cofre.findByPk(
            req.params.device_id,
            {include: [{ model: Usuario, as: 'dono', attributes: ['usuario_id', 'nome', 'email'] }]
        });

        if (!cofre) {
            return res.status(404).json({ erro: 'Cofre não encontrado.' });
        }

        return res.status(200).json(cofre);
    } catch (erro) {
        console.error('[ERRO] Buscar cofre:', erro.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

exports.atualizar = async (req, res) => {
    try {
        const cofre = await Cofre.findByPk(req.params.device_id);

        if (!cofre) {
            return res.status(404).json({ erro: 'Cofre não encontrado.' });
        }

        const { uid_nfc, usuario_id } = req.body;
        await cofre.update({ uid_nfc, usuario_id });

        return res.status(200).json({ mensagem: 'Cofre atualizado com sucesso.', cofre });
    } catch (erro) {
        console.error('[ERRO] Atualizar cofre:', erro.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

exports.deletar = async (req, res) => {
    try {
        const cofre = await Cofre.findByPk(req.params.device_id);

        if (!cofre) {
            return res.status(404).json({ erro: 'Cofre não encontrado.' });
        }

        await cofre.destroy();
        return res.status(200).json({ mensagem: 'Cofre removido com sucesso.' });
    } catch (erro) {
        console.error('[ERRO] Deletar cofre:', erro.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

exports.validarNfc = async (req, res) => {
    try {
        const { uid_nfc, device_id } = req.query;

        const cofre = await Cofre.findByPk(device_id);

        if (!cofre || cofre.uid_nfc !== uid_nfc.toUpperCase()) {
            return res.status(401).json({ autorizado: false });
        }

        return res.status(200).json({ autorizado: true });

    } catch (erro) {
        console.error('[ERRO] Validar NFC GET:', erro.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}
