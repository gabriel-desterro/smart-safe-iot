const express = require('express');
const router = express.Router();
const historicoController = require('../controller/historicoController');
const autenticar = require('../middlewares/authMiddleware');

router.get('/', autenticar, historicoController.listar);
router.get('/resumo', autenticar, historicoController.resumo);
router.get('/alertas', autenticar, historicoController.listarAlertas);

module.exports = router;