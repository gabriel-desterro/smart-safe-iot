const jwt = require('jsonwebtoken');
const { Usuario } = require('../models/ligacao');
const bcrypt = require('bcryptjs')

exports.registrar = async (req, res) =>{
    try {
        const { nome, email, senha, tipo_usuario} = req.body;

        if(!nome || !email || !senha){
            return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios'})
        }

        const jaExiste = await Usuario.findOne({ where: { email }});
        if(jaExiste){
            return res.status(409).json({ erro: 'Email já cadastrado'});
        }

        const senha_hash = await bcrypt.hash(senha, 10)

        const novoUsuario = await Usuario.create({
            nome,
            email,
            senha: senha_hash,
            tipo_usuario: tipo_usuario || 'cliente'
        });

        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso',
            usuario: { usuario_id: novoUsuario.usuario_id, nome: novoUsuario.nome, email: novoUsuario.email, tipo_usuario: novoUsuario.tipo_usuario }
        })
    } catch (error) {
        console.error('[ERRO] Registrar:', error.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.'});
    }
}

exports.login = async (req, res) => {
    try {
        const { email, senha } = req.body;
        if(!email || !senha){
            return res.status(400).json({ erro: 'Email e senha são obrigatórios!'})
        }

        const usuario = await Usuario.findOne({ where: { email }});
        if(!usuario){
            return res.status(401).json({ erro: 'Credenciais inválidas.'})
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if(!senhaValida){
            return res.status(401).json({ erro: 'Credenciais inválidas.'})
        }

        const token = jwt.sign(
            { usuario_id: usuario.usuario_id, email: usuario.email, tipo_usuario: usuario.tipo_usuario},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        return res.status(200).json({ mensagem: 'Login realizado com sucesso', token, usuario: { id: usuario.usuario_id, nome: usuario.nome, email: usuario.email, tipo_usuario: usuario.tipo_usuario } });
    } catch (error) {
        console.error('[ERRO] Login:', error.message);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
} //