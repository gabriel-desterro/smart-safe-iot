require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const sequelize = require('./config/database');
const { Usuario, Cofre, HistoricoDeSensores } = require('./models/ligacao');
const { salvarEventoCofre } = require('./controller/mqttController');
const cofreRoutes = require('./routes/cofreRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const historicoRoutes = require('./routes/historicoRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Rotas
app.use('/cofres', cofreRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/historico', historicoRoutes);
app.use('/auth', authRoutes);

// Tratamento de erro status 404
app.use((req, res) => {
    res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
});

// Captura erros não tratados
app.use((erro, req, res, next) => {
    // JSON inválido no body
    if (erro.type === 'entity.parse.failed') {
        return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
    }
    console.error('[ERRO GLOBAL]', erro.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
});

// Conexão e Configuração do Subscriber MQTT
const brokerUrl = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com';
const topico = process.env.MQTT_TOPICO;

const mqttClient = mqtt.connect(brokerUrl);

mqttClient.on('connect', () => {
    console.log(`Conectado ao Broker MQTT: ${brokerUrl}`);
    mqttClient.subscribe(topico, (err) => {
        if (!err) {
            console.log(`Inscrito com sucesso no tópico: [${topico}]`);
        } else {
            console.error(`Erro ao se inscrever no tópico ${topico}:`, err);
        }
    });
});

// escuta as mensagens que o ESP32 publica
mqttClient.on('message', async (topic, message) => {
    console.log(`\n Nova mensagem recebida no tópico [${topic}]`);
    
    const payloadString = message.toString();
    
    await salvarEventoCofre(payloadString);
});

// O { alter: true } ajusta as tabelas no SQLite se você fizer mudanças nos models
sequelize.sync({ force: false })
    .then(() => { 
        console.log('Banco de dados SQLite sincronizado com sucesso!');
        // Inicialização do Servidor Express
        app.listen(PORT, () => {
            console.log("Servidor rodando em http://127.0.0.1:"+PORT);
        });
    })
    .catch(erro => console.error('Erro ao sincronizar o banco de dados:', erro));