const { Cofre, HistoricoDeSensores, Usuario } = require('../models/ligacao'); // importando direto do arquivo ligacao pois lá as tabelas já tem os relacionamentos

function converterTimestamp(timestampBR) {
    if (!timestampBR || timestampBR === 'sem_hora') return new Date();

    // Separa "26/05/2026" de "14:30:00"
    const [data, hora] = timestampBR.split(' ');
    const [dia, mes, ano] = data.split('/');

    // Monta no formato ISO: "2026-05-26T14:30:00"
    return new Date(`${ano}-${mes}-${dia}T${hora}`);
}

exports.salvarEventoCofre = async (payloadString) => {
    try {
        // Transforma o payload em um objeto JavaScript
        const dados = JSON.parse(payloadString);

        const cofre = await Cofre.findOne({ where: { device_id: dados.device_id }});

        if (!cofre) {
            console.warn(`[AVISO] Cofre "${dados.device_id}" não cadastrado.`);
            return;
        }
        
        const usuario = await Usuario.findByPk(cofre.usuario_id);

        await HistoricoDeSensores.create({
            evento: dados.evento,
            timestamp: converterTimestamp(dados.timestamp),
            sensor_movimento: dados.sensores?.pir_detectou ?? false,
            sensor_ultrassonico_cm: dados.sensores?.ultrassonico_cm ?? 0,
            cofre_id: cofre.device_id,
            usuario_id: cofre.usuario_id  // vem do cadastro, não do ESP32
        });

        console.log(`[SUCESSO] Evento "${dados.evento}" do cofre "${dados.device_id}" salvo no banco! Dono: ${usuario.nome} usuario_id: ${cofre.usuario_id}`);        
    } catch (erro) {
        console.error("[ERRO] Falha ao salvar os dados MQTT no banco:", erro);
    }
}