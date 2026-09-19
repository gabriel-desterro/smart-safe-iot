const express = require('express');
const router = express.Router();
const cofreController = require('../controller/cofreController');
const autenticar = require('../middlewares/authMiddleware');
const apenasAdm = require('../middlewares/authApenasAdm');

router.get('/validar-nfc', cofreController.validarNfc); // Validação com ESP32

router.post('/', autenticar, apenasAdm, cofreController.criar); // CRUD ADM
router.get('/', autenticar, apenasAdm, cofreController.listarTodosOsCofres); // CRUD ADM
router.get('/:device_id', autenticar, apenasAdm, cofreController.buscarPorId); // CRUD ADM
router.put('/:device_id', autenticar, apenasAdm, cofreController.atualizar); // CRUD ADM
router.delete('/:device_id', autenticar, apenasAdm, cofreController.deletar); // CRUD ADM

module.exports = router;//