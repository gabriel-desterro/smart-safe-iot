const bcrypt = require('bcryptjs');
const { Usuario } = require('../models/ligacao');

exports.listar = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: ['usuario_id', 'nome', 'email', 'tipo_usuario']
        });
        return res.status(200).json(usuarios);
    } catch (error) {
        console.error('[ERRO] Listar usuários:', error.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

exports. buscarPorId = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.usuario_id, { attributes: ['usuario_id', 'nome', 'email', 'tipo_usuario'] });

        if(!usuario) return res.status(404).json({ erro: 'Usuário não encontrado'});

        return res.status(200).json(usuario);
    } catch (error) {
        console.error('[ERRO] Buscar usuário:', error.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

exports.atualizar = async (req, res) =>{
    try {
        const usuario = await Usuario.findByPk(req.params.usuario_id);

        if(!usuario) return res.status(404).json({ erro: 'Usuário não encontrado'});

        const { nome, email, senha, tipo_usuario } = req.body;

        if(senha) {
            req.body.senha = await bcrypt.hash(senha, 10);
        }

        await usuario.update({ nome, email, senha: req.body.senha, tipo_usuario});

        return res.status(200).json({
            mensagem: 'Usuário atualizado com sucesso.',
            usuario: { id: usuario.usuario_id, nome: usuario.nome, email: usuario.email, tipo_usuario: usuario.tipo_usuario }
        });
    } catch (error) {
        console.error('[ERRO] Atualizar usuário:', error.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

exports.deletar = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.usuario_id);

        if(!usuario) return res.status(404).json({ erro: 'Usuário não encontrado'});

        await usuario.destroy();

        return res.status(200).json({ mensagem: 'Usuário removido com sucesso'})
    } catch (error) {
        console.error('[ERRO] Deletar usuário:', error.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}