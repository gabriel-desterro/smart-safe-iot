const express = require('express');
const router = express.Router();
const usuarioController = require('../controller/usuarioController');
const autenticar = require('../middlewares/authMiddleware');
const apenasAdm = require('../middlewares/authApenasAdm');

router.get('/', autenticar, apenasAdm, usuarioController.listar);
router.get('/:usuario_id', autenticar, apenasAdm, usuarioController.buscarPorId);
router.put('/:usuario_id', autenticar, apenasAdm, usuarioController.atualizar);
router.delete('/:usuario_id', autenticar, apenasAdm, usuarioController.deletar);

module.exports = router;
