/**
 * Módulo para gerenciar compressores
 * Versão focada na API
 */

import { apiService } from '../../data/api.js';
import { appConfig, appState, configUtils } from '../../data/config.js';

export class CompressorManager {
    constructor() {
        this.compressores = document.querySelectorAll('.compressor');
        this.modal = document.getElementById('modal-detalhes');
        this.compressorIdElement = document.getElementById('compressor-id');
        this.pressaoElement = document.getElementById('pressao');
        this.temperaturaElement = document.getElementById('temperatura');
        this.tempoFuncionamentoElement = document.getElementById('tempo-funcionamento');
        this.temperaturaAmbienteElement = document.getElementById('temperatura-ambiente');
        this.intervaloDados = null;
        this.useApi = true; // Sempre usar API
        
        this.init();
    }

    async init() {
        await this.checkApiAvailability();
        this.setupEventListeners();
        
        console.log('📋 CompressorManager inicializado - Modo: API');
    }

    /**
     * Verifica se a API está disponível
     */
    async checkApiAvailability() {
        try {
            const health = await apiService.checkHealth();
            if (health) {
                this.useApi = true;
                appState.apiStatus.isOnline = true;
                appState.apiStatus.mode = 'online';
                console.log('🚀 CompressorManager: API ativada');
            } else {
                throw new Error('API não disponível');
            }
        } catch (error) {
            console.error('❌ API não disponível:', error.message);
            this.useApi = false;
            appState.apiStatus.isOnline = false;
            appState.apiStatus.mode = 'offline';
        }
    }

    setupEventListeners() {
        // Usar delegação de eventos para elementos dinâmicos
        const compressorsList = document.getElementById('compressors-list');
        if (compressorsList) {
            compressorsList.addEventListener('click', (event) => {
                // Encontrar o elemento compressor clicado
                const compressorElement = event.target.closest('.compressor');
                if (compressorElement) {
                    const compressorId = compressorElement.getAttribute('data-id');
                    if (compressorId) {
                        this.abrirModal(compressorId);
                    }
                }
            });
            console.log('✅ Event listeners configurados via delegação');
        }
    }

    abrirModal(compressorId) {
        this.compressorIdElement.textContent = compressorId;
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Disparar evento customizado para outros módulos
        window.dispatchEvent(new CustomEvent('compressorSelected', {
            detail: { compressorId }
        }));
        
        // Iniciar atualização em tempo real
        this.atualizarDadosTempoReal();
        
        // Limpar intervalos anteriores
        if (this.intervaloDados) {
            clearInterval(this.intervaloDados);
        }
        
        // Criar novo intervalo baseado na configuração
        this.intervaloDados = setInterval(() => {
            this.atualizarDadosTempoReal();
        }, appConfig.updateInterval.realTimeData);
    }

    fecharModal() {
        this.modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Limpar intervalo de atualização
        if (this.intervaloDados) {
            clearInterval(this.intervaloDados);
            this.intervaloDados = null;
        }
    }

    async atualizarDadosTempoReal() {
        const compressorId = parseInt(this.compressorIdElement.textContent);
        
        try {
            if (this.useApi) {
                const [dadosResponse, compressorResponse] = await Promise.all([
                    apiService.getDadosTempoReal(compressorId, 1),
                    apiService.getCompressor(compressorId)
                ]);

                if (dadosResponse.dados && dadosResponse.dados.length > 0) {
                    const ultimoDado = dadosResponse.dados[0];
                    const dadosAtuais = {
                        pressao: ultimoDado.pressao,
                        temperatura: ultimoDado.temp_equipamento,
                        temperaturaAmbiente: ultimoDado.temp_ambiente,
                        potencia: ultimoDado.potencia_kw,
                        ligado: ultimoDado.ligado,
                        timestamp: ultimoDado.data_medicao
                    };
                    
                    const compressorInfo = compressorResponse.compressor;
                    appState.apiStatus.mode = 'online';
                    
                    this.atualizarInterface(dadosAtuais, compressorInfo);
                    this.atualizarAlertas(dadosAtuais, compressorInfo);
                    
                    // Disparar evento para sistema de notificações
                    window.dispatchEvent(new CustomEvent('compressorDataUpdated', {
                        detail: { 
                            compressorId, 
                            data: dadosAtuais,
                            source: 'api'
                        }
                    }));
                } else {
                    this.mostrarEstadoOffline();
                }
            } else {
                this.mostrarEstadoOffline();
            }

        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            this.mostrarEstadoErro();
        }
    }

    /**
     * Atualiza a interface com os dados recebidos
     */
    atualizarInterface(dados, compressorInfo = null) {
        // Unidade sempre bar (conforme documentação da API)
        const unidadePressao = appConfig.units.pressao;
        
        // Atualizar valores principais
        this.pressaoElement.textContent = dados.ligado 
            ? `${dados.pressao.toFixed(1)} ${unidadePressao}`
            : `0.0 ${unidadePressao}`;
            
        this.temperaturaElement.textContent = `${dados.temperatura.toFixed(1)} ${appConfig.units.temperatura}`;
        
        // Atualizar temperatura ambiente
        if (this.temperaturaAmbienteElement && dados.temperaturaAmbiente) {
            this.temperaturaAmbienteElement.textContent = `${dados.temperaturaAmbiente.toFixed(1)} ${appConfig.units.temperatura}`;
        }
        
        // Atualizar tempo de funcionamento (apenas para dados mock por enquanto)
        if (!this.useApi) {
            this.atualizarInformacoesAdicionais(this.compressorIdElement.textContent);
        } else if (this.tempoFuncionamentoElement) {
            // Para API, podemos calcular baseado no status
            this.tempoFuncionamentoElement.textContent = dados.ligado ? 'Em operação' : 'Parado';
        }
        
        // Consumo de energia (simulado se não vier da API)
        const consumoElement = document.getElementById('consumo-energia');
        if (consumoElement) {
            if (dados.ligado) {
                // Estimar consumo baseado na pressão e temperatura
                const consumoEstimado = (dados.pressao * 2.5) + (dados.temperatura * 0.3);
                consumoElement.textContent = `${consumoEstimado.toFixed(1)} kW`;
            } else {
                consumoElement.textContent = '0.0 kW';
            }
        }
    }

    /**
     * Atualiza os alertas visuais baseado nos dados
     */
    atualizarAlertas(dados, compressorInfo = null) {
        // Determinar níveis de alerta
        const nivelPressao = configUtils.getAlertLevel('pressao', dados.pressao);
        const nivelTempEquip = configUtils.getAlertLevel('temperatura_equipamento', dados.temperatura);
        const nivelTempAmb = configUtils.getAlertLevel('temperatura_ambiente', dados.temperaturaAmbiente || 25);

        // Aplicar cores nos cards
        this.aplicarCoresAlertas({
            pressao: nivelPressao,
            temperatura: nivelTempEquip,
            temperaturaAmbiente: nivelTempAmb
        });

        // Se temos info do compressor da API, usar alertas dela
        if (compressorInfo && compressorInfo.alertas) {
            this.aplicarAlertasApi(compressorInfo.alertas);
        }
    }

    /**
     * Aplica cores dos alertas nos cards
     */
    aplicarCoresAlertas(alertas) {
        const cards = {
            'card-pressao': alertas.pressao,
            'card-temperatura': alertas.temperatura,
            'card-consumo': alertas.temperaturaAmbiente // usando card de consumo para temp ambiente
        };

        Object.entries(cards).forEach(([cardId, nivel]) => {
            const card = document.getElementById(cardId);
            if (card) {
                const config = configUtils.getAlertConfig('pressao', nivel); // usando config de pressão como base
                
                // Remover classes antigas
                card.classList.remove('border-red-500', 'border-yellow-500', 'border-green-500', 'border-blue-500', 'border-orange-500');
                
                // Aplicar nova cor baseada no nível
                switch (nivel) {
                    case 'critico':
                        card.classList.add('border-red-500');
                        break;
                    case 'alto':
                        card.classList.add('border-orange-500');
                        break;
                    case 'normal':
                        card.classList.add('border-green-500');
                        break;
                    case 'baixo':
                        card.classList.add('border-yellow-500');
                        break;
                    case 'muito_baixo':
                        card.classList.add('border-blue-500');
                        break;
                }
            }
        });
    }

    /**
     * Aplica alertas vindos da API
     */
    aplicarAlertasApi(alertasApi) {
        console.log('Alertas da API:', alertasApi);
        // Implementar lógica específica para alertas da API se necessário
    }

    /**
     * Mostra estado offline
     */
    mostrarEstadoOffline() {
        this.pressaoElement.textContent = '-- bar';
        this.temperaturaElement.textContent = '-- °C';
        if (this.temperaturaAmbienteElement) {
            this.temperaturaAmbienteElement.textContent = '-- °C';
        }
        if (this.tempoFuncionamentoElement) {
            this.tempoFuncionamentoElement.textContent = 'Offline';
        }
    }

    /**
     * Mostra estado de erro
     */
    mostrarEstadoErro() {
        this.pressaoElement.textContent = 'Erro';
        this.temperaturaElement.textContent = 'Erro';
        if (this.temperaturaAmbienteElement) {
            this.temperaturaAmbienteElement.textContent = 'Erro';
        }
    }

    /**
     * Método auxiliar para buscar dados do compressor
     */
    async getCompressorData(id) {
        const compressorId = parseInt(id);
        
        try {
            if (this.useApi) {
                const response = await apiService.getCompressor(compressorId);
                return response.compressor || null;
            } else {
                throw new Error('API não disponível');
            }
        } catch (error) {
            console.error('Erro ao buscar compressor:', error);
            return null;
        }
    }

    /**
     * Carrega lista de compressores da API
     */
    async loadCompressores() {
        try {
            if (this.useApi) {
                const response = await apiService.getCompressores();
                appState.cache.compressores = response.compressores;
                appState.cache.lastUpdate = Date.now();
                return response.compressores;
            } else {
                throw new Error('API não disponível');
            }
        } catch (error) {
            console.error('Erro ao carregar compressores:', error);
            throw error;
        }
    }

    atualizarInformacoesAdicionais(compressorId) {
        // Buscar elemento do compressor para pegar dados adicionais
        const compressorElement = document.querySelector(`[data-id="${compressorId}"]`);
        if (compressorElement) {
            const tempoFuncionamento = compressorElement.getAttribute('data-tempo-funcionamento');
            const tempAmbiente = compressorElement.getAttribute('data-temp-ambiente');
            
            if (this.tempoFuncionamentoElement) {
                this.tempoFuncionamentoElement.textContent = tempoFuncionamento || '--';
            }
            
            if (this.temperaturaAmbienteElement) {
                const temp = parseFloat(tempAmbiente);
                if (!isNaN(temp)) {
                    // Simular pequenas variações na temperatura ambiente
                    const variacao = (Math.random() - 0.5) * 0.5; // ±0.25°C
                    const novaTemp = temp + variacao;
                    this.temperaturaAmbienteElement.textContent = `${novaTemp.toFixed(1)} °C`;
                    
                    // Atualizar o atributo no elemento também
                    compressorElement.setAttribute('data-temp-ambiente', novaTemp.toFixed(1));
                } else {
                    this.temperaturaAmbienteElement.textContent = '-- °C';
                }
            }
            
            // Atualizar tempo de funcionamento se estiver online
            if (compressorElement.getAttribute('data-status') === 'online' && tempoFuncionamento !== 'Parado') {
                this.atualizarTempoFuncionamento(compressorElement);
            }
        }
    }
    
    atualizarTempoFuncionamento(compressorElement) {
        const tempoAtual = compressorElement.getAttribute('data-tempo-funcionamento');
        if (tempoAtual && tempoAtual !== 'Parado') {
            // Extrair horas e minutos do formato "8h 23m"
            const match = tempoAtual.match(/(\d+)h (\d+)m/);
            if (match) {
                let horas = parseInt(match[1]);
                let minutos = parseInt(match[2]);
                
                // Incrementar minutos aleatoriamente (simular tempo passando)
                if (Math.random() > 0.8) { // 20% de chance de incrementar
                    minutos++;
                    if (minutos >= 60) {
                        minutos = 0;
                        horas++;
                    }
                    
                    const novoTempo = `${horas}h ${minutos}m`;
                    compressorElement.setAttribute('data-tempo-funcionamento', novoTempo);
                    
                    if (this.tempoFuncionamentoElement) {
                        this.tempoFuncionamentoElement.textContent = novoTempo;
                    }
                }
            }
        }
    }

    // Getters para ser usado por outros módulos
    get isModalOpen() {
        return !this.modal.classList.contains('hidden');
    }

    get isUsingApi() {
        return this.useApi;
    }

    get currentCompressorId() {
        return this.compressorIdElement.textContent;
    }

    /**
     * Força reconexão com API
     */
    async reconnectApi() {
        console.log('🔄 Tentando reconectar com API...');
        await this.checkApiAvailability();
        return this.useApi;
    }

    /**
     * Alterna modo de operação (API/Mock) - útil para testes
     */
    async toggleMode() {
        if (this.useApi) {
            this.useApi = false;
            appState.apiStatus.mode = 'fallback';
            console.log('📦 Alternado para modo mock');
        } else {
            await this.checkApiAvailability();
            console.log(`🔄 Tentando modo API: ${this.useApi ? 'sucesso' : 'falhou'}`);
        }
        return this.useApi;
    }
}