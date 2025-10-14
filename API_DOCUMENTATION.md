# 📊 API - Ordem da Fenix - Documentação de Rotas

## 🔧 Informações Gerais
- **Base URL**: `http://localhost:8000` (desenvolvimento)
- **Timezone**: Brasil (UTC-3)
- **Formato de dados**: JSON
- **Autenticação**: Não requerida (desenvolvimento)
- **Sistema de Alertas**: 5 níveis integrados aos compressores
- **Monitoramento**: Tempo real com alertas automáticos

---

## 📡 **SENSORES** - Coleta de Dados

### 📤 **POST /sensor**
Recebe e armazena dados coletados pelos sensores dos compressores.

**Endpoint**: `POST /sensor`

**Body (JSON)**:
```json
{
  "id_compressor": 1001,
  "ligado": true,
  "pressao": 8.5,
  "temp_equipamento": 77.0,
  "temp_ambiente": 20.0,
  "potencia_kw": 22.0,
  "data_medicao": "2024-10-13T10:30:00-03:00"  // Opcional
}
```

**Validações**:
- `id_compressor`: Inteiro positivo, deve existir no sistema
- `ligado`: Boolean obrigatório
- `pressao`: Float ≥ 0 (em bar)
- `temp_equipamento`: Float (temperatura em °C)
- `temp_ambiente`: Float (temperatura em °C)
- `potencia_kw`: Float ≥ 0 (consumo de energia em kW)
- `data_medicao`: Opcional, preenchida automaticamente se omitida

**Funcionalidade Adicional**:
- **Sistema de Alertas**: Automaticamente avalia os dados e atualiza os alertas do compressor
- **5 Níveis**: muito_baixo 🔵, baixo 🟡, normal 🟢, alto 🟠, critico 🔴
- **4 Parâmetros**: pressão, temperatura_equipamento, temperatura_ambiente, potencia
- **Compressores Médios**: Baseado em especificações industriais (15-37 kW)
- **Integração**: Alertas são salvos nas informações do compressor, não nos dados do sensor

**Respostas**:
```json
// ✅ Sucesso (200)
{
  "status": "sucesso",
  "message": "Dados do sensor salvos com sucesso",
  "firestore_id": "abc123xyz",
  "id_compressor": 1001,
  "data_medicao": "2024-10-13T10:30:00-03:00"
}

// ❌ Compressor não existe (404)
{
  "detail": "Compressor com ID 1001 não encontrado. Cadastre o compressor primeiro."
}

// ❌ Dados inválidos (422)
{
  "detail": [
    {
      "loc": ["body", "pressao"],
      "msg": "ensure this value is greater than or equal to 0",
      "type": "value_error.number.not_ge"
    }
  ]
}
```

---

### 📥 **GET /dados**
Lista todos os dados de sensores coletados.

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
      "temp_equipamento": 65.2,
      "temp_ambiente": 23.8,
      "data_medicao": "2024-10-13T10:30:00-03:00"
    }
    // ... mais registros
  ]
}
```

---

### 📊 **GET /dados/{id_compressor}**
Busca dados de sensores de um compressor específico.

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
      "temp_equipamento": 65.2,
      "temp_ambiente": 23.8,
      "data_medicao": "2024-10-13T10:30:00-03:00"
    }
    // ... ordenados por data (mais recente primeiro)
  ]
}
```

---

## 🏭 **COMPRESSORES** - Gestão de Equipamentos

### 📤 **POST /compressores/**
Cadastra um novo compressor no sistema.

**Endpoint**: `POST /compressores/`

**Body (JSON)**:
```json
{
  "id_compressor": 1001,
  "nome_marca": "Atlas Copco GA22",
  "localizacao": "Setor A - Galpão 1",
  "potencia_nominal_kw": 22.0,
  "configuracao": "Compressor Médio-Padrão",
  "data_ultima_manutencao": "2024-09-15T10:00:00-03:00",  // Opcional
  "esta_ligado": false  // Padrão: false
}
```

**Validações**:
- `id_compressor`: Inteiro positivo único
- `nome_marca`: String 1-100 caracteres
- `localizacao`: String 1-200 caracteres
- `potencia_nominal_kw`: Float 15-37 kW (faixa média)
- `configuracao`: String (padrão: "Compressor Médio-Padrão")
- `data_ultima_manutencao`: Opcional
- `esta_ligado`: Boolean (padrão: false)

**Respostas**:
```json
// ✅ Sucesso (200)
{
  "status": "sucesso",
  "message": "Compressor cadastrado com sucesso",
  "firestore_id": "def456abc",
  "id_compressor": 1001,
  "data_cadastro": "2024-10-13T10:30:00-03:00"
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

**💡 Nota para Frontend**: O sistema frontend implementa filtros avançados adicionais:
- **Status**: Online/Offline (usa campo `esta_ligado`)
- **Fabricante**: Extraído de `nome_marca` (Atlas Copco, Schulz, Kaeser, etc.)
- **Setor**: Extraído de `localizacao` (Setor A, B, C, etc.)
- **Potência**: Filtro por kW mínimo (extraído de `nome_marca` ou `potencia_nominal_kw`)
- **Alertas**: Filtra por presença de alertas (campo `alertas`)

**Resposta**:
```json
{
  "total": 5,
  "compressores": [
    {
      "firestore_id": "def456abc",
      "id_compressor": 1001,
      "nome_marca": "Atlas Copco GA55",
      "localizacao": "Setor A - Galpão 1",
      "data_ultima_manutencao": "2024-09-15T10:00:00-03:00",
      "esta_ligado": true,
      "data_cadastro": "2024-10-13T10:30:00-03:00",
      "data_ultima_atualizacao": "2024-10-13T15:45:00-03:00",  // Se foi atualizado
      "alertas": {
        "pressao": "normal",
        "temperatura_equipamento": "alto",
        "temperatura_ambiente": "baixo",
        "potencia": "normal"
      },
      "ultima_atualizacao_alertas": "2024-10-13T17:45:30-03:00"
    }
    // ... mais compressores
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
      "temperatura_equipamento": "normal",
      "temperatura_ambiente": "normal",
      "potencia": "normal"
      "temperatura_equipamento": "alto",
      "temperatura_ambiente": "baixo"
    },
    "ultima_atualizacao_alertas": "2024-10-13T17:45:30-03:00"
  }
}
```

---

### ✏️ **PUT /compressores/{id_compressor}**
Atualiza informações de um compressor existente.

**Endpoint**: `PUT /compressores/{id_compressor}`

**Body (JSON)** - Todos os campos são opcionais:
```json
{
  "nome_marca": "Atlas Copco GA75",
  "localizacao": "Setor B - Galpão 2",
  "data_ultima_manutencao": "2024-10-01T14:00:00-03:00",
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
    "nome_marca": "Atlas Copco GA75",  // Atualizado
    "localizacao": "Setor B - Galpão 2",  // Atualizado
    "data_ultima_manutencao": "2024-10-01T14:00:00-03:00",
    "esta_ligado": true,  // Atualizado
    "data_cadastro": "2024-10-13T10:30:00-03:00",
    "data_ultima_atualizacao": "2024-10-13T16:15:00-03:00"  // Automático
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
    "potencia"
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

### 🎯 **5 Níveis de Alerta**
O sistema utiliza uma escala de 5 níveis com "normal" no centro:

| Nível | Emoji | Cor | Descrição | Ação Recomendada |
|-------|-------|-----|-----------|-------------------|
| **muito_baixo** | 🔵 | Azul | Valores muito abaixo do ideal | Verificar funcionamento |
| **baixo** | 🟡 | Amarelo | Valores abaixo do normal | Monitorar operação |
| **normal** | 🟢 | Verde | Operação dentro dos parâmetros | Nenhuma ação necessária |
| **alto** | 🟠 | Laranja | Valores acima do normal | Atenção necessária |
| **critico** | 🔴 | Vermelho | Valores críticos | Intervenção imediata |

### 📐 **Limites por Parâmetro**

#### Pressão (bar)
- 🔵 **muito_baixo**: 0.0 - 5.0
- 🟡 **baixo**: 5.0 - 7.0
- 🟢 **normal**: 7.0 - 10.0
- 🟠 **alto**: 10.0 - 11.0
- 🔴 **critico**: 11.0+

#### Temperatura do Equipamento (°C)
- 🔵 **muito_baixo**: 0.0 - 60.0
- 🟡 **baixo**: 60.0 - 71.0
- 🟢 **normal**: 71.0 - 82.0
- 🟠 **alto**: 82.0 - 107.0
- 🔴 **critico**: 107.0+ (desligamento automático: 110°C)

#### Temperatura Ambiente (°C)
- 🔵 **muito_baixo**: -10.0 - 0.0
- 🟡 **baixo**: 0.0 - 10.0
- 🟢 **normal**: 10.0 - 29.0
- 🟠 **alto**: 29.0 - 46.0
- 🔴 **critico**: 46.0+

#### Potência/Consumo (kW)
- 🔵 **muito_baixo**: 0.0 - 10.0
- 🟡 **baixo**: 10.0 - 15.0
- 🟢 **normal**: 15.0 - 37.0
- 🟠 **alto**: 37.0 - 45.0
- 🔴 **critico**: 45.0+

### 🔄 **Funcionamento do Sistema**
1. **Coleta**: Sensor envia dados via `POST /sensor`
2. **Avaliação**: Sistema calcula alertas baseado nos limites
3. **Atualização**: Alertas são salvos nas informações do compressor
4. **Consulta**: Próxima consulta ao compressor retorna alertas atualizados

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
- **5 Níveis Visuais**: Use emojis/cores para interface (🔵🟡🟢🟠🔴)
- **Timestamp**: Campo `ultima_atualizacao_alertas` mostra quando foram atualizados
- **Limites Industriais**: Baseados em compressores médios (15-37 kW) para uso industrial

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

# Enviar dados sensor (4 parâmetros)
curl -X POST "http://localhost:8000/sensor" \
  -H "Content-Type: application/json" \
  -d '{"id_compressor": 1001, "ligado": true, "pressao": 8.5, "temp_equipamento": 77.0, "temp_ambiente": 20.0, "potencia_kw": 22.0}'
```

### Com JavaScript (Fetch):
```javascript
// Buscar compressores ativos COM alertas
const compressores = await fetch('http://localhost:8000/compressores/?ativo_apenas=true')
  .then(res => res.json());

// Exemplo de compressor com alertas (4 parâmetros):
compressores.compressores.forEach(comp => {
  console.log(`Compressor ${comp.id_compressor}:`);
  console.log(`- Pressão: ${comp.alertas.pressao} �`);
  console.log(`- Temp. Equipamento: ${comp.alertas.temperatura_equipamento} 🟢`);
  console.log(`- Temp. Ambiente: ${comp.alertas.temperatura_ambiente} 🟢`);
  console.log(`- Potência: ${comp.alertas.potencia} �`);
});

// Enviar dados do sensor (atualiza alertas automaticamente)
const response = await fetch('http://localhost:8000/sensor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id_compressor: 1001,
    ligado: true,
    pressao: 8.5,  // Normal (7.0-10.0)
    temp_equipamento: 77.0,  // Normal (71.0-82.0)
    temp_ambiente: 20.0,  // Normal (10.0-29.0)
    potencia_kw: 22.0  // Normal (15.0-37.0)
  })
});

// Buscar configurações de alertas
const config = await fetch('http://localhost:8000/configuracoes/')
  .then(res => res.json());
console.log('Limites:', config.configuracao.limites_pressao);
```

### 🎨 **Exemplo de Interface com Alertas**:
```javascript
function renderizarAlertas(alertas) {
  const emojis = {
    'muito_baixo': '🔵',
    'baixo': '🟡', 
    'normal': '🟢',
    'alto': '🟠',
    'critico': '🔴'
  };
  
  return Object.entries(alertas).map(([param, nivel]) => 
    `${emojis[nivel]} ${param}: ${nivel}`
  ).join('\n');
}

// Usar nos dados do compressor (4 parâmetros)
const compressor = await fetch('/compressores/1001').then(r => r.json());
console.log(renderizarAlertas(compressor.compressor.alertas));
// Output: � pressao: normal
//         🟢 temperatura_equipamento: normal
//         � temperatura_ambiente: normal
//         🟢 potencia: normal
```

---

---

## 🆕 **NOVIDADES NA VERSÃO 2.0.0 - Industrial**

### ✨ **Sistema de Alertas Expandido - 4 Parâmetros**
- **4 parâmetros monitorados**: pressão, temperatura_equipamento, temperatura_ambiente, **potencia**
- **5 níveis**: muito_baixo, baixo, normal, alto, critico
- **Avaliação automática** a cada envio de dados do sensor
- **Integração completa** nas informações dos compressores
- **Limites industriais** baseados em compressores médios (15-37 kW)

### 🏭 **Especificações Industriais**
- **Compressores Médios**: Faixa 15-37 kW para uso industrial
- **Limites Reais**: Baseados em especificações de Atlas Copco, Schulz, Ingersoll Rand
- **Monitoramento de Potência**: Novo parâmetro `potencia_kw` para eficiência energética
- **Configurações Otimizadas**: Limites ajustados para ambiente industrial real

### 🔄 **Fluxo Atualizado**
1. `POST /sensor` → Sistema calcula alertas para **4 parâmetros** automaticamente
2. `GET /compressores/{id}` → Retorna dados COM alertas dos 4 parâmetros atualizados
3. `GET /configuracoes/` → Consulta limites industriais e configurações

### 🎯 **Para Desenvolvedores**
- Campo `alertas` com **4 parâmetros** sempre presente
- Campo `potencia_kw` obrigatório no modelo SensorData
- Campo `potencia_nominal_kw` nos compressores (15-37 kW)
- Campo `ultima_atualizacao_alertas` para controle temporal
- Emojis sugeridos para interface: 🔵🟡🟢🟠🔴
- Sistema totalmente automatizado com parâmetros industriais

### 🖥️ **Integração com Frontend OFtech**
A API está **100% compatível** com o sistema frontend desenvolvido:

#### ✅ **Módulos Integrados**
```javascript
// ApiService - Integração completa
const compressores = await apiService.getCompressores();
const healthCheck = await apiService.checkHealth();
const sensorData = await apiService.enviarDadosSensor(dados);

// CompressorInterfaceManager - Renderização automática
interface.extrairEficiencia(compressor);  // Usa campo 'eficiencia' da API
interface.extrairTemperatura(compressor); // Usa 'temp_equipamento'
interface.extrairPressao(compressor);     // Usa 'pressao'

// Sistema de Alertas - Mapeamento direto
alertas.pressao → 🔵🟡🟢🟠🔴
alertas.temperatura_equipamento → Visual status
alertas.temperatura_ambiente → Monitoramento ambiental
alertas.potencia → Eficiência energética
```

#### 🔄 **Fluxo de Dados Automático**
1. **Health Check**: `/health` → Detecta API disponível
2. **Carregamento**: `/compressores/` → Popula interface dinamicamente  
3. **Monitoramento**: `/dados/{id}` → Atualizações em tempo real
4. **Fallback**: Dados mock se API indisponível

#### 📊 **Compatibilidade de Campos**
| Campo API | Campo Frontend | Uso |
|-----------|---------------|-----|
| `id_compressor` | `id` | Identificação única |
| `nome_marca` | `nome` | Exibição nos cards |
| `esta_ligado` | `status` | Online/Offline |
| `localizacao` | `setor` (extraído) | Filtros por setor |
| `alertas.*` | Indicadores visuais | Sistema de alertas |
| `temp_equipamento` | `temperatura` | Monitoramento |
| `pressao` | `pressao` | Dados técnicos |

---

## 🛠️ **IMPLEMENTAÇÃO PRÁTICA - Dicas do Desenvolvimento**

### 📋 **Checklist de Integração**

#### ✅ **1. Health Check Automático**
```javascript
// Verificação inicial (implementado em app.js)
async function verificarAPI() {
  try {
    const health = await fetch('http://localhost:8000/health');
    return health.ok;
  } catch {
    return false; // Fallback para mock
  }
}
```

#### ✅ **2. Carregamento Dinâmico de Dados**
```javascript
// CompressorInterfaceManager (implementado)
const response = await apiService.getCompressores();
// Sistema extrai automaticamente:
// - Setor de localizacao: "Setor A - Linha 1" → "Setor A"  
// - Potência de nome_marca: "Atlas Copco GA22" → 22 kW
// - Fabricante de nome_marca: "Atlas Copco GA22" → "Atlas Copco"
```

#### ✅ **3. Sistema de Alertas Visual**
```javascript
// Mapeamento implementado (compressor-interface.js)
const statusConfig = {
  'muito_baixo': { color: 'bg-blue-500', emoji: '🔵' },
  'baixo': { color: 'bg-yellow-500', emoji: '🟡' },  
  'normal': { color: 'bg-green-500', emoji: '🟢' },
  'alto': { color: 'bg-orange-500', emoji: '🟠' },
  'critico': { color: 'bg-red-500', emoji: '🔴' }
};
```

#### ✅ **4. Filtros Inteligentes**
```javascript
// SearchFilterManager (implementado)
// Filtra por atributos data-* extraídos automaticamente:
element.setAttribute('data-fabricante', this.extrairFabricante(compressor.nome_marca));
element.setAttribute('data-setor', this.extrairSetor(compressor.localizacao)); 
element.setAttribute('data-alertas', this.hasAlertas(compressor.alertas));
```

#### ✅ **5. Event Delegation para Modais**
```javascript
// CompressorManager (implementado) 
// Funciona com elementos criados dinamicamente da API
document.addEventListener('click', (e) => {
  if (e.target.closest('.compressor-card')) {
    const id = e.target.closest('.compressor-card').dataset.compressorId;
    abrirModal(id);
  }
});
```

### 🚀 **Performance e Otimização**

#### ⚡ **Atualizações em Tempo Real**
- **Health Check**: A cada 30s (`appConfig.updateInterval.healthCheck`)
- **Dados de Compressores**: A cada 6s (`appConfig.updateInterval.statusUpdate`)  
- **Gráficos**: A cada 5s (`appConfig.updateInterval.charts`)
- **Dados de Sensores**: A cada 2s (`appConfig.updateInterval.realTimeData`)

#### 📊 **Gestão de Estado**
```javascript
// config.js - Estado centralizado (implementado)
export const appState = {
  apiStatus: { isOnline: false, lastCheck: null },
  currentMode: 'mock', // 'api' | 'hybrid' | 'mock'  
  compressores: [],
  healthCheckInterval: null
};
```

### 🔧 **Troubleshooting**

#### ❌ **Problemas Comuns e Soluções**

1. **API não conecta**: Sistema usa fallback para mock automaticamente
2. **Filtros não funcionam**: Event delegation implementado para elementos dinâmicos  
3. **Modais não abrem**: Event delegation no documento, não nos elementos
4. **Dados não aparecem**: Métodos de extração com fallbacks seguros implementados
5. **CORS**: Use servidor local (python -m http.server) não file://

#### 🏥 **Debug e Logs**
```javascript
// Logs detalhados implementados em todos os módulos
console.log('🖥️ Inicializando CompressorInterfaceManager...');
console.log(`✅ ${compressores.length} compressores carregados da API`);
console.log('🔍 SearchFilter: Atualizando filtros após mudança na interface');
console.log('📊 ChartManager: Dados atualizados em tempo real');
```

---

**🔧 Desenvolvido por: Ordem da Fenix**  
**📅 Versão: 2.0.0**  
**🕒 Atualizado em: 14/10/2025**  
**🚨 Sistema de Alertas: Ativo com 4 Parâmetros**  
**🔗 Frontend Integrado: Sistema híbrido API + Mock implementado**