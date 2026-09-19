#include <ESP32Servo.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <WebServer.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include "time.h"

// --- Configurações da Rede Wi-Fi do AMBIENTE (modo STA para alcançar o HiveMQ) ---
const char* ssidSala = "Gabriel_2G";
const char* passwordSala = "gabriel0100";

// --- Configurações da Rede Wi-Fi do ESP32 (AP) ---
const char* ssid = "IOT_eh_o_poder";
const char* password = "senha123"; // Mínimo de 8 caracteres
WebServer server(80); // Servidor na porta 80
bool ledState = false; // Estado inicial do LED
#define LED_BUILTIN 2 // Pino do LED da placa

// Configuração da unidade de cofre
const char* deviceId = "ESP32_COFRE_01";
const char* servidorNode = "http://192.168.1.8:3000";

// --- NTP ---
const char* ntpServer = "pool.ntp.br";
const long  gmtOffset_sec = -10800;
const int   daylightOffset_sec = 0;

// --- MQTT ---
const char* mqttServer = "broker.hivemq.com";
const int   mqttPort = 1883;
const char* mqttTopico = "IOT_eh_o_poder";

WiFiClient wifiClientMQTT;
PubSubClient mqttClient(wifiClientMQTT);

// Configuração do Buzzer
#define BUZZER_PIN 26

// Configuração dos LEDs
#define LED_VERMELHO 33
#define LED_VERDE 32

// Configuração de cartões NFC autorizados
const String uidsAutorizados[] = {"04:5A:BE:36:4F:61:80"};
const int totalUids = std::size(uidsAutorizados);
String uidAtual = "";
bool nfcValidado = false;

// Configurações do Display
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 oled(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// Configuração para o sensor ultrassônico
int trigPin = 12;
int echoPin = 15;
long distanciaReferencia = -1;    // medida do cofre fechado (calibrada no setup)
const long TOLERANCIA_CM = 2;     // margem de erro aceitável do sensor
volatile unsigned long echoDuration = 0;
volatile unsigned long echoStart = 0;
volatile bool echoReady = false;
unsigned long ultimaLeituraUltrassonico = 0;
const unsigned long INTERVALO_ULTRASSONICO = 200;
long distancia = 999; // começa alto para não disparar alarme
unsigned long ultimoAlarme = 0;
const unsigned long INTERVALO_ALARME = 10000;
unsigned long ultimoLogStandby = 0;
const unsigned long INTERVALO_LOG_STANDBY = 1000;

// Configuração para o servo-motor
int servoPin = 27;
Servo servo;
const int SERVO_TIMER = 3;

// Configuração para o sistema de confirmação de senha
String senha = "1234";
String confirmaSenha = "";
bool senhaValidada = false;
int contador = 0;
bool cofreEmOperacao = false;

// Configuração para o botão de colocar senha
int BUTTON_PIN = 14;
int prev_btn = LOW;

// Configuração para o sistema para controlar tempo de abertura do cofre
unsigned long tempoAbertura = 0; // Salva a hora que confirma a senha correta
const unsigned long TEMPO_ABERTO = 30000; // Tempo de operação 30 segundos (30000 ms)
bool cofreAberto = false;

// Configuração do sensor PIR
const int PIR_PIN = 25; // Pino do sensor de presença
bool sistemaAcordado = false; // Controla se o cofre está ativo ou em standby
unsigned long tempoUltimoMovimento = 0; // Guarda quando houve presença pela última vez
const unsigned long TEMPO_STANBY = 15000; // Tempo para dormir novamente: 15 segundos

// --- Controle de eventos MQTT ---
int tentativasSenha = 0;
bool intrusaoDetectada = false;
bool acessoConcedido = false;
char timestampAbertura[30] = "sem_hora";
char timestampFechamento[30] = "sem_hora";

// --- Página HTML salva na Memória Flash (PROGMEM) ---
// Note que usamos %ESTADO% e %COR% como espaços reservados para mudar o texto depois
const char html_page[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Controle do LED</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f0f0f5; }
    button { font-size: 20px; padding: 15px 40px; margin: 10px; cursor: pointer; border-radius: 8px; border: none; background-color: #007BFF; color: white; }
    button:hover { background-color: #0056b3;}
  </style>
</head>
<body>
  <h1>Painel de Liberação do Cofre</h1>
 
  <h2 style="color: %COR%;">Estado atual: %ESTADO%</h2>


  <a href="/liberar"><button>LIBERAR</button></a>
</body>
</html>
)rawliteral";

void publicarEvento(const char* evento) {  
  if (!mqttClient.connected()) {
    reconnectMQTT(); // ← tenta reconectar antes de desistir
    if (!mqttClient.connected()) return;
  }

  char timestamp[30];
  obterTimestamp(timestamp, sizeof(timestamp));

  String payload = "{";
  payload += "\"device_id\":\"" + String(deviceId) + "\",";
  payload += "\"timestamp\":\"" + String(timestamp) + "\",";
  payload += "\"evento\":\"" + String(evento) + "\",";
  payload += "\"sensores\":{";
  payload += "\"pir_detectou\":" + String(sistemaAcordado ? "true" : "false") + ",";
  payload += "\"ultrassonico_cm\":" + String(distancia);
  payload += "}";
  payload += "}";

  mqttClient.publish(mqttTopico, payload.c_str());
  Serial.println("MQTT publicado: " + payload);
}

// --- Função para processar e enviar a página ---
void enviarPaginaHtml() {
  // Pega o HTML da memória Flash e passa para uma variável manipulável
  String html = String(html_page);
 
  // Verifica o estado do LED e substitui os marcadores no HTML
  if (ledState) {
    html.replace("%ESTADO%", "EM OPERAÇÃO");
    html.replace("%COR%", "green");
  } else {
    html.replace("%ESTADO%", "TRANCADO");
    html.replace("%COR%", "red");
  }
 
  // Envia a página finalizada para o navegador
  server.send(200, "text/html", html);
}

bool validarNfcNoServidor(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[NFC] Sem Wi-Fi — usando validação local.");
    for (int i = 0; i < totalUids; i++) {
      if (uid == uidsAutorizados[i]) return true;
    }
    return false;
  }

  HTTPClient http;
  String url = String(servidorNode) + "/cofres/validar-nfc?uid_nfc=" + uid + "&device_id=" + String(deviceId);
  
  Serial.println("[NFC] Consultando servidor: " + url);
  http.begin(url);
  int httpCode = http.GET();
  http.end();

  Serial.println("[NFC] HTTP Code: " + String(httpCode));
  return httpCode == 200;
}

// Acessou o IP principal (Ex: 192.168.4.1/?uid=SEU_UID_AQUI)
void handleRoot() {
  // Lê o parâmetro uid da URL
  if (server.hasArg("uid")) {
    String uid = server.arg("uid");
    uid.toUpperCase();
    uidAtual = uid;

    // Verifica se o UID está na lista
    /*bool autorizado = false;
    for (int i = 0; i < totalUids; i++) {
      if (uid == uidsAutorizados[i]) {
        autorizado = true;
        break;
      }
    }*/

    bool autorizado = false;
    autorizado = validarNfcNoServidor(uid);

    if (autorizado) {
      nfcValidado = true;
      publicarEvento("NFC_AUTORIZADO");
      
      cofreEmOperacao = false;

      obterTimestamp(timestampAbertura, sizeof(timestampAbertura));

      Serial.print("Acesso autorizado para UID: ");
      Serial.println(uid);
      ledState = false;
      digitalWrite(LED_BUILTIN, LOW);
      enviarPaginaHtml();
    } else {
      nfcValidado = false;
      publicarEvento("NFC_NEGADO");

      Serial.print("Acesso NEGADO para UID: ");
      Serial.println(uid);
      server.send(200, "text/html", R"(
        <html>
          <body style='text-align:center;font-family:Arial;margin-top:80px'>
            <h1 style='color:red'>⛔ Acesso Negado</h1>
            <p>Cartão não autorizado.</p>
          </body>
        </html>
      )");
    }
  } else {
    // Alguém acessou sem cartão (digitando o IP diretamente)
    nfcValidado = false;
    uidAtual = "";
    server.send(200, "text/html", R"(
      <html>
        <body style='text-align:center;font-family:Arial;margin-top:80px'>
          <h1 style='color:orange'>⚠️ Aproxime seu cartão NFC</h1>
          <p>Acesso direto não permitido.</p>
        </body>
      </html>
    )");
  }
}

void handleliberar() {
  if (!nfcValidado) {
    server.send(200, "text/html", R"(
      <html>
        <body style='text-align:center;font-family:Arial;margin-top:80px'>
          <h1 style='color:red'>⛔ NFC não validado</h1>
          <p>Aproxime o cartão novamente.</p>
        </body>
      </html>
    )");
    return;
  }
  ledState = true;
  cofreEmOperacao = true;
  digitalWrite(LED_BUILTIN, HIGH);
  publicarEvento("LIBERACAO_WEB");
  enviarPaginaHtml(); // Envia a página atualizada;
}

void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (mqttClient.connected()) return;

  Serial.print("Conectando ao HiveMQ...");
  String clientId = "ESP32Cofre-" + String(random(0xffff), HEX);

  if (mqttClient.connect(clientId.c_str())) {
    Serial.println(" conectado!");
  } else {
    Serial.print(" falhou, rc=");
    Serial.println(mqttClient.state());
  }
}

void obterTimestamp(char* buffer, int tamanho) {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    strftime(buffer, tamanho, "%d/%m/%Y %H:%M:%S", &timeinfo);
  } else {
    strncpy(buffer, "sem_hora", tamanho);
  }
}

void resetarSessao() {
  tentativasSenha = 0;
  intrusaoDetectada = false;
  acessoConcedido = false;
  strncpy(timestampAbertura, "sem_hora", sizeof(timestampAbertura));
  strncpy(timestampFechamento, "sem_hora", sizeof(timestampFechamento));
}

void IRAM_ATTR echoISR() {
  if (digitalRead(echoPin) == HIGH) {
    echoStart = micros();
  } else {
    echoDuration = micros() - echoStart;
    echoReady = true;
  }
}

int equivDisplay(float volt){
  int equivalente = 0;
  if(volt >= 0.00 && volt < 0.33) equivalente = 0;
  if(volt >= 0.33 && volt < 0.66) equivalente = 1;
  if(volt >= 0.66 && volt < 0.99) equivalente = 2;
  if(volt >= 0.99 && volt < 1.32) equivalente = 3;
  if(volt >= 1.32 && volt < 1.65) equivalente = 4;
  if(volt >= 1.65 && volt < 1.98) equivalente = 5;
  if(volt >= 1.98 && volt < 2.31) equivalente = 6;
  if(volt >= 2.31 && volt < 2.64) equivalente = 7;
  if(volt >= 2.64 && volt < 2.97) equivalente = 8;
  if(volt >= 2.97 && volt <= 3.3) equivalente = 9;
  return equivalente;
}

void acionarAlarme() {
  intrusaoDetectada = true;
  obterTimestamp(timestampFechamento, sizeof(timestampFechamento));
  publicarEvento("INTRUSAO");
  nfcValidado = false;  
  oled.clearDisplay();
  oled.setTextSize(2);
  oled.setTextColor(WHITE);
  oled.setCursor(0, 10);
  oled.println("  INVASAO ");
  oled.setCursor(0, 35);
  oled.println(" DETECTADA");
  oled.display();

  // Alerta sonoro 
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(150);
  }
  resetarSessao();
}

void setup() {
  Serial.begin(115200);

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  pinMode(LED_VERMELHO, OUTPUT);
  pinMode(LED_VERDE, OUTPUT);

  pinMode(PIR_PIN, INPUT);

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  delay(2000);

  // Inicia o Ponto de Acesso
  Serial.println("\nIniciando AP...");
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(ssid, password);
  /*Serial.print("AP ativo. IP do cofre: ");
  Serial.println(WiFi.softAPIP());*/

  WiFi.begin(ssidSala, passwordSala);
  Serial.print("Conectando ao Wi-Fi");
  unsigned long t = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t < 10000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\nConectado! IP STA: ");
    Serial.println(WiFi.localIP());
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    Serial.print("Sincronizando NTP");
    struct tm timeinfo;
    unsigned long nt = millis();
    while (!getLocalTime(&timeinfo) && millis() - nt < 8000) {
      delay(500);
      Serial.print(".");
    }
    Serial.println(getLocalTime(&timeinfo) ? "\nNTP OK!" : "\nNTP falhou.");
  } else {
    Serial.println("\nSem Wi-Fi — MQTT desativado.");
  }

  mqttClient.setBufferSize(512);
  mqttClient.setServer(mqttServer, mqttPort);

  //
  Serial.print("Conecte-se à rede 'IOT_eh_o_poder' e acesse o IP: ");
  Serial.println(WiFi.softAPIP());


  // Conecta os caminhos (URLs) às suas respectivas funções
  server.on("/", handleRoot);
  server.on("/liberar", handleliberar);
  // Inicia o servidor web
  server.begin();

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  servo.attach(servoPin, 500, 2400);
  servo.write(0);
  delay(300);
  servo.detach();

  Serial.println("Calibrando sensor... mantenha o cofre FECHADO.");
  delay(2000);

  long soma = 0;
  for (int i = 0; i < 5; i++) {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    long dur = pulseIn(echoPin, HIGH, 10000);
    soma += (dur / 2) * 0.0343;
    delay(200);
  }
  distanciaReferencia = soma / 5;
  Serial.print("Distância de referência: ");
  Serial.print(distanciaReferencia);
  Serial.println(" cm");
  attachInterrupt(digitalPinToInterrupt(echoPin), echoISR, CHANGE);
 
  if(!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)){
    Serial.println(F("failed to start SSD1306 OLED"));
    while(1);
  }
}

void loop() {
  reconnectMQTT();
  mqttClient.loop();
  server.handleClient(); // Fica escutando as requisições dos celulares

  bool presenca = digitalRead(PIR_PIN);

  int btn = digitalRead(BUTTON_PIN);

  if (presenca) {
    if (!sistemaAcordado) {
      Serial.println("Movimento detectado! Sistema acordado.");
      digitalWrite(LED_VERMELHO, HIGH);
      digitalWrite(LED_VERDE, LOW);
      sistemaAcordado = true;
      publicarEvento("SISTEMA_ACORDOU");
      oled.clearDisplay();
      oled.display();
    }
    tempoUltimoMovimento = millis();
  }

  if ((sistemaAcordado && (millis() - tempoUltimoMovimento >= TEMPO_STANBY)) && !cofreEmOperacao) {
    sistemaAcordado = false;
    cofreAberto = false;
    senhaValidada = false;
    confirmaSenha = "";
    contador = 0;
    nfcValidado = false;
    uidAtual = "";
    digitalWrite(LED_VERMELHO, LOW);
    digitalWrite(LED_VERDE, LOW);
    servo.attach(servoPin, 500, 2400);
    delay(50);
    servo.write(0);
    delay(500);
    servo.detach();
    oled.clearDisplay();
    oled.display();
    Serial.println("Sem movimento. Sistema em standby.");
    publicarEvento("SISTEMA_STANDBY");
  }

  if ((sistemaAcordado && !presenca && millis() - ultimoLogStandby >= INTERVALO_LOG_STANDBY) && !ledState) {
    ultimoLogStandby = millis();
    long tempoRestante = TEMPO_STANBY - (millis() - tempoUltimoMovimento);
    if (tempoRestante > 0) {
      Serial.print("Standby em: ");
      Serial.print(tempoRestante / 1000);
      Serial.println("s");
    }
  }

  if (!sistemaAcordado) {
    prev_btn = btn;
    return;
  }

  if(ledState && cofreEmOperacao){
    float pot = analogRead(34);
    float volt = pot * 0.0008058;
    int numDisplay = equivDisplay(volt);

    if (prev_btn == LOW && btn == HIGH) {
      confirmaSenha += numDisplay;
      contador++;
      Serial.println(numDisplay);
      delay(200);
    }

    if (contador == 4) {
      if (senha == confirmaSenha) {
        Serial.println("Senha correta! Abrindo cofre.");
        publicarEvento("SENHA_CORRETA");
        servo.attach(servoPin, 500, 2400);
        delay(50);
        servo.write(90);
        digitalWrite(LED_VERDE, HIGH);
        digitalWrite(LED_VERMELHO, LOW);
        publicarEvento("ABERTURA");
        tentativasSenha++;
        acessoConcedido = true;
        senhaValidada = true;
        cofreAberto = true;
        tempoAbertura = millis(); // Registra a hora atual em que o cofre abriu
        contador = 0;
        confirmaSenha = "";
      } else {
        Serial.println("Senha inválida.");
        tentativasSenha++;
        publicarEvento("SENHA_INVALIDA");
        contador = 0;
        confirmaSenha = "";

        if (tentativasSenha >= 3) {
          publicarEvento("ACESSO_NEGADO"); // ← aqui
          tentativasSenha = 0;
        }
      }
    }

    oled.clearDisplay();
    oled.setTextSize(8);
    oled.setTextColor(WHITE);
    oled.setCursor(45,2);
    oled.println(numDisplay);
    oled.display();
  } 
  
  if (!ledState && !cofreAberto) {
    if (millis() - ultimoAlarme > INTERVALO_ALARME) {
      oled.clearDisplay();
      oled.display();
    }
  }

  //Verifica se o cofre está aberto E já se passaram 30 segundos
  if (cofreAberto && (millis() - tempoAbertura >= TEMPO_ABERTO)) {
    servo.attach(servoPin, 500, 2400);
    delay(50);
    servo.write(0);
    delay(500);
    servo.detach();
    digitalWrite(LED_VERDE, LOW);
    digitalWrite(LED_VERMELHO, HIGH);
    cofreAberto = false;
    senhaValidada = false;
    ledState = false;
    nfcValidado = false;
    uidAtual = "";
    digitalWrite(LED_BUILTIN, LOW);
    Serial.println("Tempo esgotado! O cofre foi trancado automaticamente.");
    publicarEvento("FECHAMENTO");

    obterTimestamp(timestampFechamento, sizeof(timestampFechamento));
    resetarSessao();
  }

  if (millis() - ultimaLeituraUltrassonico >= INTERVALO_ULTRASSONICO) {
    ultimaLeituraUltrassonico = millis();
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
  }

  // ─── LEITURA DO ECO (via ISR) ───
  if (echoReady) {
    echoReady = false;
    long calc = (echoDuration / 2) * 0.0343;
    if (calc > 0 && calc <= 400) {
      distancia = calc;
    }
  }

  if (!senhaValidada && distanciaReferencia > 0 && distancia < 900) {
    long variacao = abs(distancia - distanciaReferencia);
    if (variacao > TOLERANCIA_CM && millis() - ultimoAlarme >= INTERVALO_ALARME) {
      ultimoAlarme = millis();
      Serial.println("INVASÃO DETECTADA! Cofre aberto sem autorização.");
      acionarAlarme();
      ledState = false;
    }
  }

  prev_btn = btn;
}