const apenasAdm = (req, res, next) => {
    if (req.usuario?.tipo_usuario !== 'adm') {
        return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
    }
    next();
};

module.exports = apenasAdm;