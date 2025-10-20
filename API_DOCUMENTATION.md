# 📊 API - Ordem da Fenix - Documentação de Rotas

## 🔧 Informações Gerais
- **Base URL Produção**: `https://ordem-da-fenix-api.fly.dev` 
- **Base URL Desenvolvimento**: `http://localhost:8000`
- **Timezone**: Brasil (UTC-3) - America/Sao_Paulo
- **Formato de dados**: JSON
- **Autenticação**: Não requerida
- **Sistema de Alertas**: 3 níveis com ESP32 integrado
- **Monitoramento**: Alertas pré-calculados pelo ESP32 e sensor tradicional
- **CORS**: Configurado para GitHub Pages e desenvolvimento local

---

## 📡 **SENSORES** - Coleta de Dados Avançada

### 📤 **POST /sensor**
Recebe e armazena dados coletados pelos sensores dos compressores com **7 parâmetros monitorados**.

**Endpoint**: `POST /sensor`

**Body (JSON)** - Todos os campos obrigatórios:
```json
{
  "id_compressor": 1001,
  "ligado": true,
  "pressao": 8.5,
  "temp_equipamento": 75.0,
  "temp_ambiente": 23.0,
  "potencia_kw": 22.0,
  "umidade": 55.0,
  "vibracao": false,
  "data_medicao": "2025-10-17T10:30:00-03:00"  // Opcional
}
```

**Validações**:
- `id_compressor`: Inteiro positivo, deve existir no sistema
- `ligado`: Boolean obrigatório (atualiza status do compressor automaticamente)
- `pressao`: Float ≥ 0 (pressão em bar)
- `temp_equipamento`: Float (temperatura do equipamento em °C)
- `temp_ambiente`: Float (temperatura ambiente em °C)
- `potencia_kw`: Float ≥ 0 (consumo de energia em kW)
- `umidade`: Float 0-100 (percentual de umidade ambiente)
- `vibracao`: Boolean (detecção de vibração anormal)
- `data_medicao`: Opcional, preenchida automaticamente com timezone brasileiro

**Funcionalidades Automáticas**:
- ✅ **Sem Dados de Medição**: NÃO salva dados de sensores
- ✅ **Apenas Alertas**: Atualiza somente os alertas no documento do compressor
- ✅ **3 Níveis**: abaixo_do_normal �, normal 🟢, acima_do_normal �
- ✅ **6 Parâmetros**: potência, pressão, temperatura_ambiente, temperatura_equipamento, umidade, vibração
- ✅ **Integração Completa**: Alertas aplicados diretamente ao compressor

**Respostas**:
```json
// ✅ Sucesso (200)
{
  "status": "sucesso",
  "message": "Dados do sensor salvos com sucesso",
  "firestore_id": "abc123xyz",
  "id_compressor": 1001,
  "data_medicao": "2025-10-17T10:30:00-03:00"
}

// ❌ Compressor não existe (404)
{
  "detail": "Compressor com ID 1001 não encontrado. Cadastre o compressor primeiro."
}

// ❌ Dados inválidos (422)
{
  "detail": [
    {
      "loc": ["body", "umidade"],
      "msg": "ensure this value is less than or equal to 100",
      "type": "value_error.number.not_le"
    }
  ]
}
```

---

### 📥 **GET /dados**
Lista todos os dados de sensores coletados com os 7 parâmetros.

**Endpoint**: `GET /dados`

**Resposta**:
```json
{
  "total": 150,
  "dados": [
    {
      "firestore_id": "abc123xyz",
      "id_compressor": 1001,
      "ligado": true,
      "pressao": 8.5,
      "temp_equipamento": 75.0,
      "temp_ambiente": 23.0,
      "potencia_kw": 22.0,
      "umidade": 55.0,
      "vibracao": false,
      "data_medicao": "2025-10-17T10:30:00-03:00"
    }
    // ... mais registros ordenados por data (mais recente primeiro)
  ]
}
```

---

### 📊 **GET /dados/{id_compressor}**
Busca dados de sensores de um compressor específico com todos os 7 parâmetros.

**Endpoint**: `GET /dados/{id_compressor}`

**Parâmetros**:
- `id_compressor` (path): ID inteiro do compressor
- `limit` (query): Número máximo de registros (1-1000, padrão: 50)

**Exemplo**: `GET /dados/1001?limit=100`

**Resposta**:
```json
{
  "id_compressor": 1001,
  "total": 25,
  "dados": [
    {
      "firestore_id": "abc123xyz",
      "id_compressor": 1001,
      "ligado": true,
      "pressao": 8.5,
      "temp_equipamento": 75.0,
      "temp_ambiente": 23.0,
      "potencia_kw": 22.0,
      "umidade": 55.0,
      "vibracao": false,
      "data_medicao": "2025-10-17T10:30:00-03:00"
    }
    // ... ordenados por data (mais recente primeiro)
  ]
}
```

---

## 🤖 **ESP32** - Sistema de Alertas Inteligente

### 📤 **POST /esp32/alertas**
Atualiza apenas os alertas do compressor baseado nos dados pré-calculados pelo ESP32.

**Endpoint**: `POST /esp32/alertas`

**Body (JSON)** - Todos os campos obrigatórios:
```json
{
  "id_compressor": 1001,
  "alerta_potencia": "normal",
  "alerta_pressao": "acima_do_normal",
  "alerta_temperatura_ambiente": "normal",
  "alerta_temperatura_equipamento": "acima_do_normal",
  "alerta_umidade": "abaixo_do_normal",
  "alerta_vibracao": "normal",
  "data_medicao": "2025-10-20T10:30:00-03:00"  // Opcional
}
```

**Validações**:
- `id_compressor`: Inteiro positivo, deve existir no sistema
- `alerta_potencia`: Enum ("abaixo_do_normal", "normal", "acima_do_normal")
- `alerta_pressao`: Enum ("abaixo_do_normal", "normal", "acima_do_normal")
- `alerta_temperatura_ambiente`: Enum ("abaixo_do_normal", "normal", "acima_do_normal")
- `alerta_temperatura_equipamento`: Enum ("abaixo_do_normal", "normal", "acima_do_normal")
- `alerta_umidade`: Enum ("abaixo_do_normal", "normal", "acima_do_normal")
- `alerta_vibracao`: Enum ("abaixo_do_normal", "normal", "acima_do_normal")
- `data_medicao`: Opcional, preenchida automaticamente com timezone brasileiro

**Funcionalidades**:
- ✅ **Atualização de Alertas**: Campo `alertas` do compressor atualizado
- ✅ **Data de Atualização**: Campo `ultima_atualizacao_alertas` preenchido
- ✅ **Sem Dados de Medição**: NÃO salva dados de sensores
- ✅ **Apenas Alertas**: Atualiza somente os alertas no documento do compressor
- ✅ **3 Níveis**: abaixo_do_normal 🟦, normal 🟢, acima_do_normal 🟠
- ✅ **6 Parâmetros**: potência, pressão, temperatura_ambiente, temperatura_equipamento, umidade, vibração

**Respostas**:
```json
// ✅ Sucesso (200)
{
  "id_compressor": 1001,
  "alertas_atualizados": {
    "potencia": "normal",
    "pressao": "acima_do_normal",
    "temperatura_ambiente": "normal",
    "temperatura_equipamento": "acima_do_normal",
    "umidade": "abaixo_do_normal",
    "vibracao": "normal"
  },
  "data_atualizacao": "2025-10-20T10:30:00-03:00"
}

// ❌ Compressor não existe (404)
{
  "detail": "Compressor com ID 1001 não encontrado. Cadastre o compressor primeiro."
}

// ❌ Dados inválidos (422)
{
  "detail": [
    {
      "loc": ["body", "alerta_potencia"],
      "msg": "value is not a valid enumeration member",
      "type": "type_error.enum"
    }
  ]
}
```

---

## 🏭 **COMPRESSORES** - Gestão de Equipamentos

### 📤 **POST /compressores/**
Cadastra um novo compressor no sistema com status automático via sensor.

**Endpoint**: `POST /compressores/`

**Body (JSON)**:
```json
{
  "id_compressor": 1001,
  "nome_marca": "Atlas Copco GA22",
  "localizacao": "Setor A - Galpão 1",
  "potencia_nominal_kw": 22.0,
  "configuracao": "Compressor Médio-Padrão",
  "data_ultima_manutencao": "2025-10-15T10:00:00-03:00",  // Opcional
  "esta_ligado": false  // Padrão: false (atualizado automaticamente via sensor)
}
```

**Validações**:
- `id_compressor`: Inteiro positivo único
- `nome_marca`: String 1-100 caracteres
- `localizacao`: String 1-200 caracteres
- `potencia_nominal_kw`: Float 15-37 kW (faixa média)
- `configuracao`: String (padrão: "Compressor Médio-Padrão")
- `data_ultima_manutencao`: Opcional (datetime)
- `esta_ligado`: Boolean (padrão: false, atualizado via sensor automaticamente)

**Campos Automáticos**:
- `data_cadastro`: Preenchido automaticamente
- `data_ultima_atualizacao`: Atualizado quando sensor envia dados
- `alertas`: Gerados automaticamente via sistema de 7 parâmetros
- `ultima_atualizacao_alertas`: Timestamp da última avaliação

**Respostas**:
```json
// ✅ Sucesso (200)
{
  "status": "sucesso",
  "message": "Compressor cadastrado com sucesso",
  "firestore_id": "def456abc",
  "id_compressor": 1001,
  "data_cadastro": "2025-10-17T10:30:00-03:00"
}

// ❌ ID já existe (400)
{
  "detail": "Já existe um compressor com ID '1001'"
}
```

---

### 📥 **GET /compressores/**
Lista todos os compressores cadastrados.

**Endpoint**: `GET /compressores/`

**Parâmetros (Query)**:
- `ativo_apenas`: Boolean (true/false) - Filtrar apenas ligados/desligados
- `limit`: Inteiro 1-1000 (padrão: 50) - Número máximo de registros

**Exemplos**:
- `GET /compressores/` - Todos os compressores
- `GET /compressores/?ativo_apenas=true` - Apenas ligados
- `GET /compressores/?ativo_apenas=false&limit=10` - Apenas desligados, máximo 10

**Resposta**:
```json
{
  "total": 5,
  "compressores": [
    {
      "firestore_id": "def456abc",
      "id_compressor": 1001,
      "nome_marca": "Atlas Copco GA22",
      "localizacao": "Setor A - Galpão 1",
      "potencia_nominal_kw": 22.0,
      "configuracao": "Compressor Médio-Padrão",
      "data_ultima_manutencao": "2025-10-15T10:00:00-03:00",
      "esta_ligado": true,
      "data_cadastro": "2025-10-17T08:30:00-03:00",
      "data_ultima_atualizacao": "2025-10-17T10:30:00-03:00",  // Via sensor
      "alertas": {
        "pressao": "normal",
        "temperatura_equipamento": "normal",
        "temperatura_ambiente": "normal",
        "potencia": "normal",
        "umidade": "alto",
        "vibracao": "normal"
      },
      "ultima_atualizacao_alertas": "2025-10-17T10:30:00-03:00"
    }
    // ... mais compressores com alertas dos 7 parâmetros
  ]
}
```

---

### 📊 **GET /compressores/{id_compressor}**
Obtém informações detalhadas de um compressor específico.

**Endpoint**: `GET /compressores/{id_compressor}`

**Parâmetros**:
- `id_compressor` (path): ID inteiro do compressor

**Exemplo**: `GET /compressores/1001`

**Resposta**:
```json
{
  "compressor": {
    "firestore_id": "def456abc",
    "id_compressor": 1001,
    "nome_marca": "Atlas Copco GA55",
    "localizacao": "Setor A - Galpão 1",
    "data_ultima_manutencao": "2024-09-15T10:00:00-03:00",
    "esta_ligado": true,
    "data_cadastro": "2024-10-13T10:30:00-03:00",
    "alertas": {
      "pressao": "normal",
      "temperatura_equipamento": "alto",
      "temperatura_ambiente": "baixo"
    },
    "ultima_atualizacao_alertas": "2024-10-13T17:45:30-03:00"
  }
}
```

---

### ✏️ **PUT /compressores/{id_compressor}**
Atualiza informações de um compressor existente. O sistema automaticamente preserva os alertas e dados dos sensores associados.

**Endpoint**: `PUT /compressores/{id_compressor}`

**Body (JSON)** - Todos os campos são opcionais:
```json
{
  "nome_marca": "Atlas Copco GA30",
  "localizacao": "Setor B - Galpão 2",
  "potencia_nominal_kw": 30.0,
  "configuracao": "Compressor Grande-Eficiente",
  "data_ultima_manutencao": "2025-11-01T14:00:00-03:00",
  "esta_ligado": true
}
```

**Resposta**:
```json
{
  "status": "sucesso",
  "message": "Compressor atualizado com sucesso",
  "compressor": {
    "firestore_id": "def456abc",
    "id_compressor": 1001,
    "nome_marca": "Atlas Copco GA30",  // Atualizado
    "localizacao": "Setor B - Galpão 2",  // Atualizado
    "potencia_nominal_kw": 30.0,  // Atualizado
    "configuracao": "Compressor Grande-Eficiente",  // Atualizado
    "data_ultima_manutencao": "2025-11-01T14:00:00-03:00",
    "esta_ligado": true,  // Atualizado
    "data_cadastro": "2025-10-17T10:30:00-03:00",
    "data_ultima_atualizacao": "2025-10-17T16:15:00-03:00",  // Automático
    "alertas": {
      "pressao": "normal",
      "temperatura_equipamento": "normal",
      "temperatura_ambiente": "normal",
      "potencia": "normal",
      "umidade": "normal",
      "vibracao": "normal"
    },
    "ultima_atualizacao_alertas": "2025-10-17T15:30:00-03:00"
  }
}
```

---

### 🗑️ **DELETE /compressores/{id_compressor}**
Remove um compressor do sistema.

**Endpoint**: `DELETE /compressores/{id_compressor}`

**Parâmetros**:
- `id_compressor` (path): ID inteiro do compressor

**Exemplo**: `DELETE /compressores/1001`

**Resposta**:
```json
{
  "status": "sucesso",
  "message": "Compressor '1001' excluído com sucesso"
}
```

---

## ⚙️ **CONFIGURAÇÕES** - Sistema de Alertas

### 📋 **GET /configuracoes/**
Obtém a configuração fixa do sistema de monitoramento e alertas.

**Endpoint**: `GET /configuracoes/`

**Resposta**:
```json
{
  "status": "sucesso",
  "message": "Configuração obtida com sucesso",
  "configuracao": {
    "limites_pressao": {
      "muito_baixo": {"min": 0.0, "max": 4.0},
      "baixo": {"min": 4.0, "max": 6.0},
      "normal": {"min": 6.0, "max": 8.0},
      "alto": {"min": 8.0, "max": 9.0},
      "critico": {"min": 9.0, "max": null}
    },
    "limites_temp_equipamento": {
      "muito_baixo": {"min": 0.0, "max": 15.0},
      "baixo": {"min": 15.0, "max": 25.0},
      "normal": {"min": 25.0, "max": 70.0},
      "alto": {"min": 70.0, "max": 85.0},
      "critico": {"min": 85.0, "max": null}
    },
    "limites_temp_ambiente": {
      "muito_baixo": {"min": 0.0, "max": 10.0},
      "baixo": {"min": 10.0, "max": 18.0},
      "normal": {"min": 18.0, "max": 28.0},
      "alto": {"min": 28.0, "max": 35.0},
      "critico": {"min": 35.0, "max": null}
    }
  },
  "niveis_alerta": {
    "muito_baixo": {"cor": "azul", "descricao": "Valor muito baixo - verificar funcionamento"},
    "baixo": {"cor": "amarelo", "descricao": "Valor baixo - monitorar operação"},
    "normal": {"cor": "verde", "descricao": "Operação dentro dos parâmetros normais"},
    "alto": {"cor": "laranja", "descricao": "Valor alto - atenção necessária"},
    "critico": {"cor": "vermelho", "descricao": "Valor crítico - intervenção imediata"}
  }
}
```

---

### 📊 **GET /configuracoes/info**
Informações detalhadas sobre o sistema de monitoramento.

**Endpoint**: `GET /configuracoes/info`

**Resposta**:
```json
{
  "projeto": "Monitoramento de Compressores Industriais",
  "versao": "1.0",
  "data_criacao": "2025-10-13",
  "tipo_configuracao": "Fixa - Compressor de Teste",
  "funcionalidades": {
    "monitoramento_tempo_real": "Avaliação contínua de parâmetros",
    "alertas_integrados": "Alertas incluídos nos dados do compressor",
    "configuracao_fixa": "Limites pré-definidos para teste"
  },
  "parametros_monitorados": [
    "pressao",
    "temperatura_equipamento", 
    "temperatura_ambiente",
    "potencia_kw",
    "umidade",
    "vibracao",
    "ligado"
  ],
  "niveis_alerta": [
    "muito_baixo",
    "baixo", 
    "normal",
    "alto",
    "critico"
  ]
}
```

---

## 🚨 **SISTEMA DE ALERTAS** - Especificação Técnica

### 🎯 **3 Níveis de Alerta Simplificados**
O sistema utiliza uma escala de 3 níveis com "normal" no centro:

| Nível | Emoji | Cor | Descrição | Ação Recomendada |
|-------|-------|-----|-----------|-------------------|
| **abaixo_do_normal** | � | Azul | Valores abaixo do esperado | Verificar funcionamento |
| **normal** | 🟢 | Verde | Operação dentro dos parâmetros | Nenhuma ação necessária |
| **acima_do_normal** | 🟠 | Laranja | Valores acima do esperado | Monitoramento necessário |

### 🤖 **Sistema Duplo de Alertas**

#### **Sensor Tradicional (POST /sensor)**
- **Automático**: Sistema calcula alertas baseado em valores recebidos
- **7 parâmetros monitorados**: pressão, temperatura_equipamento, temperatura_ambiente, potencia_kw, umidade, vibracao, ligado
- **Salva dados**: Armazena dados de medição + gera alertas automaticamente
- **Atualiza status**: Atualiza `esta_ligado` do compressor

#### **ESP32 (POST /esp32/alertas)**
- **Pré-calculado**: ESP32 envia alertas já calculados
- **6 parâmetros de alerta**: potência, pressão, temperatura_ambiente, temperatura_equipamento, umidade, vibração
- **Apenas alertas**: NÃO salva dados de medição
- **Atualização direta**: Atualiza somente os alertas do compressor

### 🔄 **Funcionamento do Sistema**
1. **Sensor Tradicional**: Envia dados → Sistema calcula alertas → Salva dados + alertas
2. **ESP32**: Calcula alertas localmente → Envia apenas alertas → Atualiza compressor
3. **Consulta**: `GET /compressores/{id}` retorna alertas atualizados de qualquer fonte

---

## 🩺 **MONITORAMENTO** - Health Check

### 💓 **GET /health**
Health check elaborado da aplicação.

**Endpoint**: `GET /health`

**Resposta**:
```json
{
  "status": "healthy",
  "timestamp": "13/10/2024 10:30:00",
  "timezone": "America/Sao_Paulo (UTC-3)",
  "services": {
    "api": "online",
    "database": "online",
    "logging": "active",
    "alertas": "active"
  },
  "endpoints": {
    "compressores": "✅ CRUD completo + alertas",
    "sensores": "✅ Coleta de dados + avaliação",
    "configuracoes": "✅ Sistema de alertas",
    "health": "✅ Monitoramento"
  },
  "version": "1.0.0"
}
```

---

### 🏓 **GET /ping**
Verificação rápida de conectividade.

**Endpoint**: `GET /ping`

**Resposta**:
```json
{
  "message": "pong",
  "status": "ok"
}
```

---

## 📋 **CÓDIGOS DE STATUS HTTP**

### ✅ **Sucessos**
- `200` - OK (operação realizada com sucesso)

### ❌ **Erros do Cliente**
- `400` - Bad Request (dados inválidos, duplicatas)
- `404` - Not Found (recurso não encontrado)
- `422` - Unprocessable Entity (validação Pydantic falhou)

### ⚠️ **Erros do Servidor**
- `500` - Internal Server Error (erro interno, problemas de banco)
- `503` - Service Unavailable (banco de dados indisponível)
- `504` - Gateway Timeout (timeout nas operações)

---

## 🎯 **EXEMPLOS DE USO PARA WEBSITE**

### 🔄 **Fluxo Típico de Uso**

1. **Cadastrar Compressor**:
```javascript
POST /compressores/
{
  "id_compressor": 1001,
  "nome_marca": "Atlas Copco",
  "localizacao": "Galpão A",
  "esta_ligado": false
}
```

2. **Ligar Compressor** (atualizar status):
```javascript
PUT /compressores/1001
{
  "esta_ligado": true
}
```

3. **Enviar Dados do Sensor** (simulação ou IoT):
```javascript
POST /sensor
{
  "id_compressor": 1001,
  "ligado": true,
  "pressao": 8.5,  // Será avaliado: normal (7.0-10.0)
  "temp_equipamento": 77.0,  // Será avaliado: normal (71.0-82.0)
  "temp_ambiente": 20.0,  // Será avaliado: normal (10.0-29.0)
  "potencia_kw": 22.0  // Será avaliado: normal (15.0-37.0)
}
// Sistema automaticamente atualiza alertas do compressor
```

4. **Visualizar Alertas Gerados**:
```javascript
GET /compressores/1001  // Compressor específico COM ALERTAS
{
  "id_compressor": 1001,
  "nome_marca": "Atlas Copco GA22",
  "alertas": {
    "pressao": "normal",
    "temperatura_equipamento": "normal",
    "temperatura_ambiente": "normal",
    "potencia": "normal"
  },
  "ultima_atualizacao_alertas": "2024-01-15T10:30:00",
  // ... outros dados
}
```

5. **Buscar Dados para Dashboard**:
```javascript
GET /dados/1001?limit=100  // Últimas 100 medições
GET /compressores/?ativo_apenas=true  // Compressores ativos COM alertas
GET /configuracoes/  // Configurações de alertas
```

### 📊 **Para Dashboard em Tempo Real**
- Consultar `/health` para status geral do sistema
- Consultar `/compressores/?ativo_apenas=true` para compressores ativos **COM ALERTAS**
- Consultar `/dados/{id}?limit=10` para últimas medições de cada compressor
- Consultar `/configuracoes/` para entender os níveis de alerta
- Enviar dados via `/sensor` quando receber de dispositivos IoT (atualiza alertas automaticamente)

### 🚨 **Para Monitoramento de Alertas**
- **4 Parâmetros Monitorados**: pressão, temperatura_equipamento, temperatura_ambiente, potencia
- **Alertas Integrados**: Cada compressor possui campo `alertas` com status atual dos 4 parâmetros
- **Atualização Automática**: Alertas são recalculados a cada `POST /sensor`
- **3 Níveis Visuais**: Use emojis/cores para interface (�🟠)
- **Timestamp**: Campo `ultima_atualizacao_alertas` mostra quando foram atualizados
- **Sistema Duplo**: Sensor tradicional (automático) + ESP32 (pré-calculado)
- **Simplicidade**: 3 níveis mais intuitivos para monitoramento industrial

### 🏷️ **Headers Recomendados**
```
Content-Type: application/json
Accept: application/json
```

---

## 🚀 **Como Testar**

### Com cURL:
```bash
# Health check
curl -X GET "http://localhost:8000/health"

# Listar compressores
curl -X GET "http://localhost:8000/compressores/"

# Criar compressor
curl -X POST "http://localhost:8000/compressores/" \
  -H "Content-Type: application/json" \
  -d '{"id_compressor": 1001, "nome_marca": "Test", "localizacao": "Test Location"}'

# Enviar dados sensor (7 parâmetros)
curl -X POST "http://localhost:8000/sensor" \
  -H "Content-Type: application/json" \
  -d '{"id_compressor": 1001, "ligado": true, "pressao": 8.5, "temp_equipamento": 77.0, "temp_ambiente": 20.0, "potencia_kw": 22.0, "umidade": 45.0, "vibracao": false}'
```

### Com JavaScript (Fetch):
```javascript
// Buscar compressores ativos COM alertas
const compressores = await fetch('http://localhost:8000/compressores/?ativo_apenas=true')
  .then(res => res.json());

// Exemplo de compressor com alertas (7 parâmetros):
compressores.compressores.forEach(comp => {
  console.log(`Compressor ${comp.id_compressor}:`);
  console.log(`- Pressão: ${comp.alertas.pressao} 🟢`);
  console.log(`- Temp. Equipamento: ${comp.alertas.temperatura_equipamento} 🟢`);
  console.log(`- Temp. Ambiente: ${comp.alertas.temperatura_ambiente} 🟢`);
  console.log(`- Potência: ${comp.alertas.potencia} 🟢`);
  console.log(`- Umidade: ${comp.alertas.umidade} 🟡`);
  console.log(`- Vibração: ${comp.alertas.vibracao} 🟢`);
});

// Enviar dados do sensor (atualiza alertas automaticamente) - 7 parâmetros
const response = await fetch('http://localhost:8000/sensor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id_compressor: 1001,
    ligado: true,
    pressao: 8.5,  // Normal (7.0-10.0)
    temp_equipamento: 77.0,  // Normal (71.0-82.0)
    temp_ambiente: 20.0,  // Normal (10.0-29.0)
    potencia_kw: 22.0,  // Normal (15.0-37.0)
    umidade: 45.0,  // Normal (40.0-60.0)
    vibracao: false  // Normal (false)
  })
});

// Buscar configurações de alertas
const config = await fetch('http://localhost:8000/configuracoes/')
  .then(res => res.json());
console.log('Limites:', config.configuracao.limites_pressao);
```

### 🎨 **Exemplo de Interface com Alertas (3 Níveis)**:
```javascript
function renderizarAlertas(alertas) {
  const emojis = {
    'abaixo_do_normal': '�',
    'normal': '�',
    'acima_do_normal': '�'
  };
  
  return Object.entries(alertas).map(([param, nivel]) => 
    `${emojis[nivel]} ${param}: ${nivel}`
  ).join('\n');
}

// Usar nos dados do compressor (6 parâmetros)
const compressor = await fetch('/compressores/1001').then(r => r.json());
console.log(renderizarAlertas(compressor.compressor.alertas));
// Output: 🟢 pressao: normal
//         🟢 temperatura_equipamento: normal
//         🟢 temperatura_ambiente: normal
//         🟢 potencia: normal
//         � umidade: abaixo_do_normal
//         🟢 vibracao: normal

// Enviar alertas do ESP32 (apenas alertas, sem dados)
const responseESP32 = await fetch('http://localhost:8000/esp32/alertas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id_compressor: 1001,
    alerta_potencia: "normal",
    alerta_pressao: "acima_do_normal",
    alerta_temperatura_ambiente: "normal",
    alerta_temperatura_equipamento: "normal",
    alerta_umidade: "abaixo_do_normal",
    alerta_vibracao: "normal"
  })
});
```

---

---

## 🆕 **NOVIDADES NA VERSÃO 2.0.0 - Industrial Plus**

### ✨ **Sistema de Alertas Expandido - 3 Níveis Simplificados**
- **Sistema Duplo**: Sensor tradicional (cálculo automático) + ESP32 (alertas pré-calculados)
- **3 níveis**: abaixo_do_normal, normal, acima_do_normal
- **Integração ESP32** para alertas em tempo real calculados no dispositivo
- **Compatibilidade total** com sensores tradicionais
- **6 parâmetros de alerta ESP32**: potência, pressão, temperatura_ambiente, temperatura_equipamento, umidade, vibração
- **7 parâmetros sensor tradicional**: + dados de medição completos

### 🏭 **Especificações Industriais Avançadas**
- **Compressores Médios**: Faixa 15-37 kW para uso industrial
- **Limites Reais**: Baseados em especificações de Atlas Copco, Schulz, Ingersoll Rand
- **Monitoramento de Potência**: Parâmetro `potencia_kw` para eficiência energética
- **Controle Ambiental**: Parâmetro `umidade` para condições do ambiente
- **Detecção de Vibração**: Parâmetro `vibracao` para manutenção preditiva
- **Configurações Otimizadas**: Limites ajustados para ambiente industrial real

### 🔄 **Fluxo Atualizado**
1. `POST /sensor` → Sistema calcula alertas para **7 parâmetros** automaticamente
2. `GET /compressores/{id}` → Retorna dados COM alertas dos 7 parâmetros atualizados
3. `GET /configuracoes/` → Consulta limites industriais e configurações
4. **Atualizações automáticas** → Status do compressor atualizado via dados de sensor

### 🎯 **Para Desenvolvedores**
- Campo `alertas` com **4 parâmetros** sempre presente
- Campo `potencia_kw` obrigatório no modelo SensorData
- Campo `potencia_nominal_kw` nos compressores (15-37 kW)
- Campo `ultima_atualizacao_alertas` para controle temporal
- Emojis sugeridos para interface: �🟠 (3 níveis)
- Sistema totalmente automatizado com ESP32 + sensor tradicional

---

**🔧 Desenvolvido por: Ordem da Fenix**  
**📅 Versão: 2.0.0**  
**🕒 Atualizado em: 20/10/2025**  
**🚨 Sistema de Alertas: ESP32 + Sensor Tradicional (3 Níveis)**