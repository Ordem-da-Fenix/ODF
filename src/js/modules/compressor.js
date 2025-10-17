/**
 * Módulo para gerenciar compressores
 * Versão focada na API
 */

import { apiService } from '../../data/api.js';
import { appConfig, appState, configUtils } from '../../data/config.js';

export class CompressorManager {
    constructor(apiStatus = true) {
        this.compressores = document.querySelectorAll('.compressor');
        this.modal = document.getElementById('modal-detalhes');
        this.compressorIdElement = document.getElementById('compressor-id');
        this.pressaoElement = document.getElementById('pressao');
        this.temperaturaElement = document.getElementById('temperatura');
        this.tempoFuncionamentoElement = document.getElementById('tempo-funcionamento');
        this.temperaturaAmbienteElement = document.getElementById('temperatura-ambiente');
        this.umidadeElement = document.getElementById('umidade');
        this.vibracaoElement = document.getElementById('vibracao');
        this.intervaloDados = null;
        this.useApi = apiStatus; // Recebe status da API já verificado
        this.alertaCriticoMostrado = false; // Flag para evitar spam de alertas
        
        this.init();
    }

    async init() {
        console.log(`🔧 CompressorManager - Modo: ${this.useApi ? 'API' : 'Offline'}`);
        this.setupEventListeners();
        
        console.log('📋 CompressorManager inicializado');
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
        
        // Criar novo intervalo baseado na configuração do modal (1 minuto)
        this.intervaloDados = setInterval(() => {
            this.atualizarDadosTempoReal();
        }, appConfig.updateInterval.modalData);
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
                let dadosResponse = null;
                let compressorResponse = null;

                try {
                    [dadosResponse, compressorResponse] = await Promise.all([
                        apiService.getDadosTempoReal(compressorId, 5), // Usar 5 para contornar bug da API com limit=1
                        apiService.getCompressor(compressorId)
                    ]);
                } catch (error) {
                    console.warn(`⚠️ Erro ao buscar dados para compressor ${compressorId}:`, error.message);
                    
                    // Se falhar dados de sensores, tentar só info do compressor
                    try {
                        compressorResponse = await apiService.getCompressor(compressorId);
                    } catch (compError) {
                        console.error(`❌ Erro ao buscar info do compressor ${compressorId}:`, compError.message);
                        this.mostrarEstadoErro();
                        return;
                    }
                }

                const compressorInfo = compressorResponse?.compressor;
                
                if (!compressorInfo) {
                    this.mostrarEstadoErro();
                    return;
                }

                // Dados padrão caso não haja dados de sensores
                let dadosAtuais = {
                    pressao: 0.0,
                    temperatura: 0.0,
                    temperaturaAmbiente: 0.0,
                    potencia: 0.0,
                    umidade: 0.0,
                    vibracao: false,
                    ligado: compressorInfo.esta_ligado,
                    timestamp: new Date().toISOString()
                };

                // Se temos dados de sensores, usar eles
                if (dadosResponse?.dados && dadosResponse.dados.length > 0) {
                    const ultimoDado = dadosResponse.dados[0];
                    dadosAtuais = {
                        pressao: ultimoDado.pressao || 0.0,
                        temperatura: ultimoDado.temp_equipamento || 0.0,
                        temperaturaAmbiente: ultimoDado.temp_ambiente || 0.0,
                        potencia: ultimoDado.potencia_kw || 0.0,
                        umidade: ultimoDado.umidade || 0.0,
                        vibracao: ultimoDado.vibracao || false,
                        ligado: compressorInfo.esta_ligado,
                        timestamp: ultimoDado.data_medicao || new Date().toISOString()
                    };
                }
                
                console.log(`🔧 Modal - Compressor ${compressorId}: ligado=${dadosAtuais.ligado}, tem_dados_sensor=${!!dadosResponse?.dados}`);
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
        
        // Atualizar valores principais - sempre mostrar valor real da API
        this.pressaoElement.textContent = `${dados.pressao.toFixed(2)} ${unidadePressao}`; // 2 casas decimais
            
        this.temperaturaElement.textContent = `${dados.temperatura.toFixed(1)} ${appConfig.units.temperatura}`; // 1 casa decimal
        
        // Atualizar temperatura ambiente (sempre mostrar, mesmo se 0.0)
        if (this.temperaturaAmbienteElement) {
            const tempAmbiente = dados.temperaturaAmbiente !== undefined && dados.temperaturaAmbiente !== null 
                ? dados.temperaturaAmbiente 
                : 0.0;
            this.temperaturaAmbienteElement.textContent = `${tempAmbiente.toFixed(1)} ${appConfig.units.temperatura}`; // 1 casa decimal
        }
        
        // Atualizar umidade (NOVIDADE)
        if (this.umidadeElement) {
            const umidade = dados.umidade !== undefined && dados.umidade !== null 
                ? dados.umidade 
                : 0.0;
            this.umidadeElement.textContent = `${umidade.toFixed(2)}${appConfig.units.umidade}`;
        }
        
        // Atualizar vibração (NOVIDADE)
        if (this.vibracaoElement) {
            const vibracao = dados.vibracao !== undefined && dados.vibracao !== null 
                ? dados.vibracao 
                : false;
            
            if (vibracao) {
                this.vibracaoElement.textContent = 'Detectada';
                this.vibracaoElement.className = 'text-2xl font-bold text-red-600';
                // Atualizar card para estado crítico
                const cardVibracao = document.getElementById('card-vibracao');
                if (cardVibracao) {
                    cardVibracao.className = 'bg-white p-6 rounded-lg text-center border border-red-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500';
                }
            } else {
                this.vibracaoElement.textContent = 'Normal';
                this.vibracaoElement.className = 'text-2xl font-bold text-green-600';
                // Atualizar card para estado normal
                const cardVibracao = document.getElementById('card-vibracao');
                if (cardVibracao) {
                    cardVibracao.className = 'bg-white p-6 rounded-lg text-center border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500';
                }
            }
        }
        
        // Atualizar status de funcionamento
        if (this.tempoFuncionamentoElement) {
            if (dados.ligado) {
                this.tempoFuncionamentoElement.textContent = 'Em Operação';
                this.tempoFuncionamentoElement.className = 'text-2xl font-bold text-green-600';
            } else {
                this.tempoFuncionamentoElement.textContent = 'Parado';
                this.tempoFuncionamentoElement.className = 'text-2xl font-bold text-red-600';
            }
        }
        
        // Consumo de energia (usar dados reais da API)
        const consumoElement = document.getElementById('consumo-energia');
        if (consumoElement) {
            // Usar potência real da API em vez de estimativa (2 casas decimais)
            consumoElement.textContent = `${dados.potencia.toFixed(2)} kW`;
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
            'card-consumo': alertas.potencia // card de consumo mostra potência
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
        // Contar alertas críticos para mostrar notificação se necessário
        const alertasCriticos = Object.entries(alertasApi).filter(([key, value]) => 
            value === 'critico' || value === 'muito_alto'
        );
        
        const alertasAltos = Object.entries(alertasApi).filter(([key, value]) => 
            value === 'alto'
        );
        
        // Mostrar notificação apenas para alertas críticos (sem spam)
        if (alertasCriticos.length > 0 && !this.alertaCriticoMostrado) {
            // Usar o sistema de notificação existente
            if (window.notificationManager) {
                const alertaTexto = alertasCriticos.map(([key, value]) => {
                    const nomes = {
                        'potencia': 'Potência',
                        'temperatura_ambiente': 'Temp. Ambiente', 
                        'pressao': 'Pressão',
                        'temperatura_equipamento': 'Temp. Equipamento'
                    };
                    return nomes[key] || key;
                }).join(', ');
                
                window.notificationManager.addNotification({
                    type: 'alert',
                    title: 'Alerta Crítico',
                    message: `${alertaTexto} em níveis críticos`,
                    compressorId: appState.activeCompressor,
                    timestamp: new Date()
                });
            }
            
            this.alertaCriticoMostrado = true;
            
            // Reset flag após 30 segundos para permitir novo alerta se necessário
            setTimeout(() => {
                this.alertaCriticoMostrado = false;
            }, 30000);
        }
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
            this.tempoFuncionamentoElement.className = 'text-2xl font-bold text-gray-500';
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
        if (this.tempoFuncionamentoElement) {
            this.tempoFuncionamentoElement.textContent = 'Erro';
            this.tempoFuncionamentoElement.className = 'text-2xl font-bold text-red-600';
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




}