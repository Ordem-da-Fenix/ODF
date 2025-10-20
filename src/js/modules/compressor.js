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
        this.correnteElement = document.getElementById('corrente');
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
        // Escutar eventos do router para atualizar dados do compressor
        window.addEventListener('routeChanged', (event) => {
            const { route, view, compressorId } = event.detail;
            
            if (view === 'compressor-details' && compressorId) {
                console.log(`🔧 Router: Navegando para compressor ${compressorId}`);
                this.inicializarDetalhes(compressorId);
            }
        });
        
        // Escutar evento de compressor selecionado (compatibilidade)
        window.addEventListener('compressorSelected', (event) => {
            const { compressorId } = event.detail;
            if (compressorId) {
                console.log(`🔧 Evento compressorSelected: ${compressorId}`);
                this.inicializarDetalhes(compressorId);
            }
        });
        
        console.log('🔧 CompressorManager: Event listeners configurados para router');
    }

    abrirModal(compressorId) {
        // DEPRECATED: Modal não é mais usado
        // Este método é mantido para compatibilidade, mas não faz mais nada
        console.log(`🔧 CompressorManager.abrirModal(${compressorId}) - DEPRECATED`);
    }

    /**
     * Inicializa a view de detalhes do compressor
     * Chamado pelo router quando navega para /compressor/:id
     */
    inicializarDetalhes(compressorId) {
        console.log(`🔧 Inicializando detalhes do compressor: ${compressorId}`);
        
        // Verificar se o ID é válido
        if (!compressorId || isNaN(parseInt(compressorId))) {
            console.error(`❌ ID inválido: ${compressorId}`);
            return;
        }
        
        // Atualizar elemento HTML com o ID
        if (this.compressorIdElement) {
            this.compressorIdElement.textContent = compressorId;
        }
        
        // Limpar intervalo anterior se existir
        if (this.intervaloDados) {
            clearInterval(this.intervaloDados);
            this.intervaloDados = null;
        }
        
        // Iniciar atualização em tempo real
        this.atualizarDadosTempoReal();
        
        // Configurar intervalo de atualização
        this.intervaloDados = setInterval(() => {
            this.atualizarDadosTempoReal();
        }, appConfig.updateInterval.modalData);
        
        console.log(`✅ Detalhes do compressor ${compressorId} inicializados`);
    }

    fecharModal() {
        // DEPRECATED: Modal não é mais usado
        // Apenas limpar intervalo de dados se existir
        if (this.intervaloDados) {
            clearInterval(this.intervaloDados);
            this.intervaloDados = null;
        }
        
        console.log('🔧 CompressorManager.fecharModal() - DEPRECATED');
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
                
                // Salvar info do compressor para uso posterior
                this.compressorInfo = compressorInfo;
                
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
        
        // Atualizar vibração usando alertas da API
        const infoCompressor = compressorInfo || this.compressorInfo;
        if (this.vibracaoElement && infoCompressor && infoCompressor.alertas) {
            const alertaVibracao = infoCompressor.alertas.vibracao || 'normal';
            
            if (alertaVibracao === 'detectada') {
                this.vibracaoElement.textContent = 'Detectada';
                this.vibracaoElement.className = 'text-2xl font-bold text-red-600';
                // Atualizar card para estado crítico
                const cardVibracao = document.getElementById('card-vibracao');
                if (cardVibracao) {
                    cardVibracao.className = 'bg-red-50 p-6 rounded-lg text-center border border-red-300';
                }
            } else {
                this.vibracaoElement.textContent = 'Normal';
                this.vibracaoElement.className = 'text-2xl font-bold text-gray-600';
                // Atualizar card para estado normal
                const cardVibracao = document.getElementById('card-vibracao');
                if (cardVibracao) {
                    cardVibracao.className = 'bg-gray-50 p-6 rounded-lg text-center border border-gray-300';
                }
            }
        }
        
        // Atualizar corrente (NOVIDADE)
        if (this.correnteElement) {
            const corrente = dados.corrente !== undefined && dados.corrente !== null 
                ? dados.corrente 
                : 0.0;
            this.correnteElement.textContent = `${corrente.toFixed(2)} A`;
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
            // Usar potência direta da API (já vem calculada)
            consumoElement.textContent = `${dados.potencia.toFixed(3)} kW`;
        }
        
        // Atualizar também elementos do dashboard se estiver na página de detalhes
        this.atualizarDashboard(dados, compressorInfo);
    }

    /**
     * Atualiza elementos do dashboard quando estiver na página de detalhes
     */
    atualizarDashboard(dados, compressorInfo = null) {
        // Atualizar temperatura ambiente no dashboard
        const tempAmbienteDashboard = document.getElementById('temperatura-ambiente-dashboard');
        if (tempAmbienteDashboard) {
            const tempAmbiente = dados.temperaturaAmbiente !== undefined && dados.temperaturaAmbiente !== null 
                ? dados.temperaturaAmbiente 
                : 0.0;
            tempAmbienteDashboard.textContent = `${tempAmbiente.toFixed(1)} °C`;
        }
        
        // Atualizar status de funcionamento no dashboard
        const funcionamentoDashboard = document.getElementById('funcionamento-dashboard');
        if (funcionamentoDashboard) {
            if (dados.ligado) {
                funcionamentoDashboard.textContent = '🟢 Ligado';
                funcionamentoDashboard.className = 'text-2xl font-bold text-green-600';
            } else {
                funcionamentoDashboard.textContent = '🔴 Desligado';
                funcionamentoDashboard.className = 'text-2xl font-bold text-red-600';
            }
        }
        
        // Atualizar outros elementos principais no dashboard se necessário
        const pressaoDashboard = document.getElementById('pressao');
        const temperaturaDashboard = document.getElementById('temperatura');
        const umidadeDashboard = document.getElementById('umidade');
        const correnteDashboard = document.getElementById('corrente');
        const consumoDashboard = document.getElementById('consumo-energia');
        
        if (pressaoDashboard) {
            pressaoDashboard.textContent = `${dados.pressao.toFixed(1)} bar`;
        }
        
        if (temperaturaDashboard) {
            temperaturaDashboard.textContent = `${dados.temperatura.toFixed(1)} °C`;
        }
        
        if (umidadeDashboard) {
            const umidade = dados.umidade !== undefined && dados.umidade !== null ? dados.umidade : 0.0;
            umidadeDashboard.textContent = `${umidade.toFixed(1)}%`;
        }
        
        if (correnteDashboard) {
            const corrente = dados.corrente !== undefined && dados.corrente !== null ? dados.corrente : 0.0;
            correnteDashboard.textContent = `${corrente.toFixed(1)} A`;
        }
        
        if (consumoDashboard) {
            consumoDashboard.textContent = `${dados.potencia.toFixed(3)} kW`;
        }
    }

    /**
     * Atualiza os alertas visuais baseado nos dados
     */
    atualizarAlertas(dados, compressorInfo = null) {
        // Se temos info do compressor da API com alertas, usar diretamente
        if (compressorInfo && compressorInfo.alertas) {
            console.log('📊 Alertas da API:', compressorInfo.alertas);
            
            // Aplicar cores nos cards usando alertas da API
            this.aplicarCoresAlertas({
                pressao: compressorInfo.alertas.pressao,
                temperatura: compressorInfo.alertas.temperatura_equipamento,
                temperaturaAmbiente: compressorInfo.alertas.temperatura_ambiente
            });

            // Atualizar seção de alertas abaixo do gráfico
            this.atualizarSecaoAlertas(dados, compressorInfo.alertas);
            
            // Aplicar alertas da API (notificações, etc.)
            this.aplicarAlertasApi(compressorInfo.alertas);
        } else {
            // Fallback para quando não há alertas da API (modo offline ou erro)
            console.log('⚠️ Alertas não disponíveis da API, usando valores padrão');
            
            // Usar valores normais como fallback
            const alertasPadrao = {
                pressao: 'normal',
                temperatura_equipamento: 'normal',
                temperatura_ambiente: 'normal',
                umidade: 'normal',
                corrente: 'normal',
                vibracao: 'normal'
            };
            
            this.aplicarCoresAlertas({
                pressao: alertasPadrao.pressao,
                temperatura: alertasPadrao.temperatura_equipamento,
                temperaturaAmbiente: alertasPadrao.temperatura_ambiente
            });
            
            this.atualizarSecaoAlertas(dados, alertasPadrao);
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
                    case 'detectada':
                    case 'critico':
                        card.classList.add('border-red-500');
                        break;
                    case 'acima_do_normal':
                    case 'alto':
                        card.classList.add('border-orange-500');
                        break;
                    case 'normal':
                        card.classList.add('border-green-500');
                        break;
                    case 'abaixo_do_normal':
                    case 'baixo':
                        card.classList.add('border-yellow-500');
                        break;
                    case 'muito_baixo':
                        card.classList.add('border-blue-500');
                        break;
                    default:
                        card.classList.add('border-green-500'); // padrão
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

    /**
     * Atualiza a seção de alertas abaixo do gráfico
     */
    atualizarSecaoAlertas(dados, alertasApi) {
        // Usar alertas diretamente da API (já calculados no backend)
        this.atualizarAlertaIndividual('pressao', dados.pressao, alertasApi.pressao || 'normal', 'bar');
        this.atualizarAlertaIndividual('temperatura', dados.temperatura, alertasApi.temperatura_equipamento || 'normal', '°C');
        this.atualizarAlertaIndividual('temperatura-ambiente', dados.temperaturaAmbiente || 25, alertasApi.temperatura_ambiente || 'normal', '°C');
        this.atualizarAlertaIndividual('umidade', dados.umidade || 0, alertasApi.umidade || 'normal', '%');
        this.atualizarAlertaIndividual('corrente', dados.corrente || 0, alertasApi.corrente || 'normal', 'A');
        
        // Vibração - usar diretamente o valor da API ("detectada" ou "normal")
        const alertaVibracao = alertasApi.vibracao || 'normal';
        this.atualizarAlertaVibracao(alertaVibracao);
    }

    /**
     * Atualiza um alerta individual
     */
    atualizarAlertaIndividual(tipo, valor, nivel, unidade) {
        const alertaEl = document.getElementById(`alerta-${tipo}`);
        const textoEl = document.getElementById(`alerta-${tipo}-texto`);
        const valorEl = document.getElementById(`alerta-${tipo}-valor`);
        
        if (!alertaEl || !textoEl || !valorEl) return;

        // Mapear níveis da API para cores e textos
        const configuracoes = {
            'detectada': { 
                cor: 'border-red-500 bg-red-50', 
                emoji: '🔴', 
                texto: 'Detectada',
                textClass: 'text-red-800',
                valueClass: 'text-red-500'
            },
            'critico': { 
                cor: 'border-red-500 bg-red-50', 
                emoji: '🔴', 
                texto: 'Crítico',
                textClass: 'text-red-800',
                valueClass: 'text-red-500'
            },
            'alto': { 
                cor: 'border-orange-500 bg-orange-50', 
                emoji: '🟠', 
                texto: 'Alto',
                textClass: 'text-orange-800',
                valueClass: 'text-orange-500'
            },
            'acima_do_normal': { 
                cor: 'border-orange-500 bg-orange-50', 
                emoji: '🟠', 
                texto: 'Acima do Normal',
                textClass: 'text-orange-800',
                valueClass: 'text-orange-500'
            },
            'normal': { 
                cor: 'border-green-500 bg-green-50', 
                emoji: '🟢', 
                texto: 'Normal',
                textClass: 'text-green-800',
                valueClass: 'text-green-500'
            },
            'abaixo_do_normal': { 
                cor: 'border-yellow-500 bg-yellow-50', 
                emoji: '🟡', 
                texto: 'Abaixo do Normal',
                textClass: 'text-yellow-800',
                valueClass: 'text-yellow-500'
            },
            'baixo': { 
                cor: 'border-yellow-500 bg-yellow-50', 
                emoji: '🟡', 
                texto: 'Baixo',
                textClass: 'text-yellow-800',
                valueClass: 'text-yellow-500'
            },
            'muito_baixo': { 
                cor: 'border-blue-500 bg-blue-50', 
                emoji: '🔵', 
                texto: 'Muito Baixo',
                textClass: 'text-blue-800',
                valueClass: 'text-blue-500'
            }
        };

        const config = configuracoes[nivel] || configuracoes['normal'];

        // Atualizar classes do container
        alertaEl.className = `p-4 rounded-lg border-l-4 ${config.cor}`;
        
        // Atualizar emoji
        const emojiEl = alertaEl.querySelector('.text-2xl');
        if (emojiEl) emojiEl.textContent = config.emoji;
        
        // Atualizar texto
        textoEl.textContent = config.texto;
        textoEl.className = `text-sm ${config.textClass}`;
        
        // Atualizar valor
        valorEl.textContent = `${valor.toFixed(1)} ${unidade}`;
        valorEl.className = `text-xs ${config.valueClass} mt-1`;
    }

    /**
     * Atualiza o alerta de vibração (caso especial)
     */
    atualizarAlertaVibracao(alertaVibracao) {
        const alertaEl = document.getElementById('alerta-vibracao');
        const textoEl = document.getElementById('alerta-vibracao-texto');
        const valorEl = document.getElementById('alerta-vibracao-valor');
        
        if (!alertaEl || !textoEl || !valorEl) return;

        if (alertaVibracao === 'detectada') {
            alertaEl.className = 'p-4 rounded-lg border-l-4 border-red-500 bg-red-50';
            const emojiEl = alertaEl.querySelector('.text-2xl');
            if (emojiEl) emojiEl.textContent = '⚠️';
            textoEl.textContent = 'Detectada';
            textoEl.className = 'text-sm text-red-800';
            valorEl.textContent = 'Vibração anormal detectada';
            valorEl.className = 'text-xs text-red-500 mt-1';
        } else {
            alertaEl.className = 'p-4 rounded-lg border-l-4 border-green-500 bg-green-50';
            const emojiEl = alertaEl.querySelector('.text-2xl');
            if (emojiEl) emojiEl.textContent = '✅';
            textoEl.textContent = 'Normal';
            textoEl.className = 'text-sm text-green-800';
            valorEl.textContent = 'Sem anomalias detectadas';
            valorEl.className = 'text-xs text-green-500 mt-1';
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