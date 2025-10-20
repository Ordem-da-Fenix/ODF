/**
 * Módulo para gerenciar a interface de compressores com dados da API
 * Substitui os dados estáticos por dados dinâmicos da API
 */

import { apiService } from '../../data/api.js';
import { appConfig, appState, configUtils } from '../../data/config.js';
import { router } from './router.js';

export class CompressorInterfaceManager {
    constructor(apiStatus = true) {
        // Múltiplos containers para diferentes layouts
        this.compressorsList = document.getElementById('compressors-list');
        this.compressorsListDesktop = document.getElementById('compressors-list-desktop');
        this.compressorsListMobile = document.getElementById('compressors-list-mobile');
        this.resultsCount = document.getElementById('results-count');
        this.compressores = [];
        this.useApi = apiStatus; // Recebe status da API já verificado
        this.alertasAnteriores = null; // Cache para monitorar mudanças nos alertas
        this.isMobile = window.innerWidth < 1024; // Breakpoint lg do Tailwind

        this.init();
    }

    async init() {
        console.log('🖥️ Inicializando CompressorInterfaceManager...');

        // Status da API já foi verificado no app.js - não precisamos verificar novamente
        console.log(`🔧 Modo de operação: ${this.useApi ? 'API' : 'Offline'}`);

        // Carregar compressores
        await this.loadCompressores();

        // Renderizar interface
        this.renderCompressores();

        // Configurar atualização automática dos status
        this.setupAutoStatusUpdate();

        // Listener para redimensionamento
        this.setupResizeListener();

        console.log(`✅ Interface carregada com ${this.compressores.length} compressores`);
    }

    /**
     * Configura listener para redimensionamento da janela
     */
    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const wasMobile = this.isMobile;
                this.isMobile = window.innerWidth < 1024;
                
                // Re-renderizar se o layout mudou
                if (wasMobile !== this.isMobile) {
                    console.log(`📱 Layout alterado: ${this.isMobile ? 'Mobile' : 'Desktop'}`);
                    this.renderCompressores();
                }
            }, 250);
        });
    }



    /**
     * Carrega compressores da API com dados em tempo real
     */
    async loadCompressores() {
        try {
            if (this.useApi) {
                console.log('📡 Carregando compressores da API...');
                const response = await apiService.getCompressores();

                if (response && response.compressores) {
                    // Para cada compressor, buscar dados em tempo real
                    this.compressores = await Promise.all(
                        response.compressores.map(async (comp) => {
                            let dadosTempoReal = null;

                            try {
                                // Buscar dados de sensor em tempo real (usar 5 para contornar bug da API com limit=1)
                                dadosTempoReal = await apiService.getDadosTempoReal(comp.id_compressor, 5);
                            } catch (error) {
                                console.warn(`⚠️ Dados em tempo real não disponíveis para compressor ${comp.id_compressor}:`, error.message);
                            }

                            return {
                                id: comp.id_compressor,
                                nome: comp.nome_marca,
                                fabricante: this.extrairFabricante(comp.nome_marca),
                                setor: this.extrairSetor(comp.localizacao),
                                status: comp.esta_ligado ? 'online' : 'offline',
                                localizacao: comp.localizacao,
                                dataUltimaManutencao: comp.data_ultima_manutencao,
                                dataCadastro: comp.data_cadastro,
                                alertas: comp.alertas || {},
                                apiData: dadosTempoReal ? dadosTempoReal.dados : null,
                                compressorInfo: comp
                            };
                        })
                    );

                    console.log(`✅ ${this.compressores.length} compressores carregados da API`);

                    // Monitorar mudanças nos alertas e gerar notificações
                    this.monitorarAlertasComNotificacao(this.compressores);
                } else {
                    throw new Error('Resposta da API inválida');
                }
            } else {
                throw new Error('API não disponível');
            }
        } catch (error) {
            console.error('❌ Erro crítico ao carregar compressores da API:', error.message);
            this.compressores = [];
        }
    }

    /**
     * Renderiza lista de compressores na interface
     */
    renderCompressores() {
        // Detectar tamanho da tela atual
        this.isMobile = window.innerWidth < 1024;
        
        console.log(`📱 Renderizando ${this.compressores.length} compressores (Mobile: ${this.isMobile})`);

        // Limpar todas as listas
        if (this.compressorsList) this.compressorsList.innerHTML = '';
        if (this.compressorsListDesktop) this.compressorsListDesktop.innerHTML = '';
        if (this.compressorsListMobile) this.compressorsListMobile.innerHTML = '';

        // Escolher container apropriado
        const targetContainer = this.isMobile ? this.compressorsListMobile : this.compressorsListDesktop;
        
        if (!targetContainer) {
            // Fallback para lista tradicional
            console.warn('⚠️ Container apropriado não encontrado, usando fallback');
            if (this.compressorsList) {
                this.compressorsList.style.display = 'block';
            }
            return this.renderCompressoresFallback();
        }

        // Renderizar cada compressor
        this.compressores.forEach(compressor => {
            const compressorElement = this.createCompressorElement(compressor, this.isMobile);
            targetContainer.appendChild(compressorElement);
        });

        // Ocultar indicador de scroll se houver poucos itens no mobile
        if (this.isMobile && this.compressores.length <= 1) {
            const scrollIndicator = document.querySelector('.flex.justify-center.mt-2');
            if (scrollIndicator) {
                scrollIndicator.style.display = 'none';
            }
        }

        // Atualizar contador
        this.updateResultsCount();

        // Reconfigurar event listeners
        this.setupCompressorEventListeners();

        // Notificar sistema de filtros sobre a atualização
        setTimeout(() => {
            if (window.searchFilterManager) {
                window.searchFilterManager.onCompressorsUpdated();
            }
        }, 100);
    }

    /**
     * Renderiza compressores no modo fallback (lista tradicional)
     */
    renderCompressoresFallback() {
        if (!this.compressorsList) return;

        this.compressores.forEach(compressor => {
            const compressorElement = this.createCompressorElement(compressor, false);
            this.compressorsList.appendChild(compressorElement);
        });

        this.updateResultsCount();
        this.setupCompressorEventListeners();
    }

    /**
     * Cria elemento HTML para um compressor baseado apenas na API
     */
    createCompressorElement(compressor, isMobile = false) {
        const div = document.createElement('div');
        
        // Classes base
        const baseClasses = 'compressor border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md';
        
        // Classes específicas para mobile/desktop
        if (isMobile) {
            div.className = `${baseClasses} flex-shrink-0 w-72 sm:w-80 p-4 bg-white shadow-sm`;
        } else {
            div.className = `${baseClasses} flex items-center p-4`;
        }

        // Extrair dados da API (sempre)
        const potenciaAtual = this.extrairPotenciaApi(compressor.apiData);
        const potenciaNominal = compressor.compressorInfo?.potencia_nominal_kw || this.extrairPotencia(compressor.nome);

        const dadosCompressor = {
            id: compressor.id,
            status: compressor.status,
            fabricante: compressor.fabricante,
            nome: compressor.nome,
            potenciaAtual: potenciaAtual,
            potenciaNominal: potenciaNominal,
            horas: this.calcularHorasOperacao(compressor.dataCadastro),
            alertas: this.hasAlertas(compressor.alertas),
            temperatura: this.extrairTemperatura(compressor.apiData),
            temperaturaAmbiente: this.extrairTemperaturaAmbiente(compressor.apiData),
            pressao: this.extrairPressao(compressor.apiData),
            potenciaAtual: this.extrairPotenciaApi(compressor.apiData),
            umidade: this.extrairUmidade(compressor.apiData),
            vibracao: this.extrairVibracao(compressor.apiData)
        };

        // Definir todos os atributos necessários para o sistema de filtros
        div.setAttribute('data-id', dadosCompressor.id);
        div.setAttribute('data-status', dadosCompressor.status);
        div.setAttribute('data-fabricante', dadosCompressor.fabricante);
        div.setAttribute('data-setor', dadosCompressor.setor);
        div.setAttribute('data-potencia', dadosCompressor.potencia !== undefined ? dadosCompressor.potencia : 0);
        div.setAttribute('data-horas', dadosCompressor.horas || 0);
        div.setAttribute('data-alertas', dadosCompressor.alertas);
        div.setAttribute('data-temperatura', dadosCompressor.temperatura !== undefined ? dadosCompressor.temperatura : 25);
        div.setAttribute('data-pressao', dadosCompressor.pressao !== undefined ? dadosCompressor.pressao : 0);

        // Status indicator
        const statusConfig = this.getStatusConfig(compressor.status, compressor.alertas);

        if (isMobile) {
            // Layout vertical para mobile (card format)
            div.innerHTML = `
                <div class="flex flex-col h-full">
                    <!-- Header do Card -->
                    <div class="flex items-center mb-3">
                        <span class="w-3 h-3 ${statusConfig.bgColor} rounded-full mr-2 ${statusConfig.animation}"></span>
                        <span class="text-sm font-semibold text-gray-800 truncate">${dadosCompressor.nome}</span>
                    </div>
                    
                    <!-- Métricas principais -->
                    <div class="flex-1">
                        <div class="grid grid-cols-2 gap-2 mb-3">
                            ${this.buildMobileMetrics(compressor, dadosCompressor)}
                        </div>
                        
                        <!-- Status info -->
                        <div class="text-xs text-gray-600 space-y-1">
                            ${this.buildMobileStatusInfo(compressor, dadosCompressor)}
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="mt-3 pt-2 border-t border-gray-100">
                        <div class="text-xs text-gray-500">
                            ${this.buildCompressorInfo(compressor, dadosCompressor)}
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Layout horizontal para desktop (original)
            div.innerHTML = `
                <span class="w-3 h-3 ${statusConfig.bgColor} rounded-full mr-3 ${statusConfig.animation}"></span>
                <div class="flex-1">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <span class="text-lg font-medium text-gray-800">${dadosCompressor.nome}</span>
                            <div class="text-sm text-gray-500 mt-1">
                                ${this.buildCompressorInfo(compressor, dadosCompressor)}
                            </div>
                            <div class="flex items-center gap-4 mt-2 text-xs text-gray-600">
                                ${this.buildStatusInfo(compressor, dadosCompressor)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        return div;
    }

    /**
     * Constrói métricas para layout mobile (formato de grid)
     */
    buildMobileMetrics(compressor, dadosCompressor) {
        const metrics = [];

        // Pressão
        if (dadosCompressor.pressao !== undefined && dadosCompressor.pressao !== null) {
            const nivel = this.calcularNivelAlerta('pressao', dadosCompressor.pressao);
            const cor = appConfig.alertas.pressao[nivel]?.cor || 'gray';
            metrics.push(`
                <div class="text-center">
                    <div class="text-xs text-gray-500">Pressão</div>
                    <div class="text-sm font-semibold text-${cor}-600">${dadosCompressor.pressao.toFixed(1)}bar</div>
                </div>
            `);
        }

        // Temperatura
        if (dadosCompressor.temperatura !== undefined && dadosCompressor.temperatura !== null) {
            const nivel = this.calcularNivelAlerta('temp_equipamento', dadosCompressor.temperatura);
            const cor = nivel === 'normal' ? 'green' : (nivel === 'critico' ? 'red' : 'orange');
            metrics.push(`
                <div class="text-center">
                    <div class="text-xs text-gray-500">Temp.</div>
                    <div class="text-sm font-semibold text-${cor}-600">${dadosCompressor.temperatura.toFixed(1)}°C</div>
                </div>
            `);
        }

        // Potência
        if (dadosCompressor.potenciaAtual !== undefined && dadosCompressor.potenciaAtual !== null) {
            metrics.push(`
                <div class="text-center">
                    <div class="text-xs text-gray-500">Potência</div>
                    <div class="text-sm font-semibold text-oftech-orange">${dadosCompressor.potenciaAtual.toFixed(1)}kW</div>
                </div>
            `);
        }

        // Umidade (se disponível)
        if (dadosCompressor.umidade !== undefined && dadosCompressor.umidade !== null) {
            const nivel = this.calcularNivelAlerta('umidade', dadosCompressor.umidade);
            const emoji = appConfig.alertas.umidade[nivel]?.emoji || '💧';
            metrics.push(`
                <div class="text-center">
                    <div class="text-xs text-gray-500">Umidade</div>
                    <div class="text-sm font-semibold text-blue-600">${emoji} ${dadosCompressor.umidade.toFixed(1)}%</div>
                </div>
            `);
        }

        return metrics.join('');
    }

    /**
     * Constrói informações de status para mobile (formato compacto)
     */
    buildMobileStatusInfo(compressor, dadosCompressor) {
        const items = [];

        // Status de funcionamento
        if (compressor.status === 'ligado') {
            items.push('<span class="text-green-600">● Operando</span>');
        } else {
            items.push('<span class="text-red-600">● Parado</span>');
        }

        // Vibração (se crítica)
        if (dadosCompressor.vibracao === true) {
            items.push('<span class="text-red-600">⚠️ Vibração</span>');
        }

        // Alertas gerais
        const alertasInfo = this.getAlertasInfo(compressor.alertas);
        if (alertasInfo) {
            items.push(`<span class="text-orange-600">${alertasInfo}</span>`);
        }

        return items.join('<br>');
    }

    /**
     * Constrói informações principais do compressor
     */
    buildCompressorInfo(compressor, dadosCompressor) {
        const parts = [];

        // Adicionar potência nominal (sempre em kW conforme API)
        if (dadosCompressor.potenciaNominal) {
            parts.push(`⚡ ${dadosCompressor.potenciaNominal} kW nominal`);
        }

        // Adicionar horas de operação formatadas
        if (dadosCompressor.horas) {
            const horasFormatadas = dadosCompressor.horas.toLocaleString('pt-BR');
            parts.push(`🕒 ${horasFormatadas}h operação`);
        }

        // Criar linha separada para os alertas se existirem
        const alertasInfo = this.getAlertasInfo(compressor.alertas);
        
        let result = parts.join(' • ');
        
        // Adicionar alertas em nova linha se existirem
        if (alertasInfo) {
            result += `<br><small class="text-sm mt-1 block">${alertasInfo}</small>`;
        }

        return result;
    }

    /**
     * Constrói informações de status
     */
    buildStatusInfo(compressor, dadosCompressor) {
        const items = [];

        // Status de funcionamento
        if (compressor.status === 'online') {
            const tempo = this.useApi ? 'Em operação' : (dadosCompressor.tempoFuncionamento || 'Funcionando');
            items.push(`
                <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    ${tempo}
                </span>
            `);
        } else {
            items.push(`
                <span class="flex items-center gap-1 text-red-600">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Status: Parado
                </span>
            `);
        }

        // Temperatura do equipamento
        if (dadosCompressor.temperatura !== undefined && dadosCompressor.temperatura !== null) {
            items.push(`
                <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z">
                        </path>
                    </svg>
                    Equip: ${dadosCompressor.temperatura.toFixed(1)}°C
                </span>
            `);
        }

        // Temperatura ambiente - sempre mostrar se disponível
        if (dadosCompressor.temperaturaAmbiente !== undefined && dadosCompressor.temperaturaAmbiente !== null) {
            items.push(`
                <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
                    </svg>
                    Amb: ${dadosCompressor.temperaturaAmbiente.toFixed(1)}°C
                </span>
            `);
        }

        // Pressão
        if (dadosCompressor.pressao !== undefined && dadosCompressor.pressao !== null) {
            items.push(`
                <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    ${dadosCompressor.pressao.toFixed(2)} bar
                </span>
            `);
        }

        // Potência atual (da API de sensores)
        if (dadosCompressor.potenciaAtual !== undefined && dadosCompressor.potenciaAtual !== null) {
            items.push(`
                <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    ${dadosCompressor.potenciaAtual.toFixed(2)} kW atual
                </span>
            `);
        }

        // Umidade (NOVIDADE)
        if (dadosCompressor.umidade !== undefined && dadosCompressor.umidade !== null) {
            const nivelUmidade = this.calcularNivelAlerta('umidade', dadosCompressor.umidade);
            const emoji = appConfig.alertas.umidade[nivelUmidade]?.emoji || '💧';
            items.push(`
                <span class="flex items-center gap-1">
                    <span class="text-xs">${emoji}</span>
                    ${dadosCompressor.umidade.toFixed(2)}%
                </span>
            `);
        }

        // Vibração (NOVIDADE)
        if (dadosCompressor.vibracao !== undefined && dadosCompressor.vibracao !== null) {
            const nivelVibracao = dadosCompressor.vibracao ? 'critico' : 'normal';
            const emoji = appConfig.alertas.vibracao[nivelVibracao]?.emoji || '🟢';
            const texto = appConfig.alertas.vibracao[nivelVibracao]?.texto || 'Normal';
            items.push(`
                <span class="flex items-center gap-1">
                    <span class="text-xs">${emoji}</span>
                    ${texto}
                </span>
            `);
        }

        return items.join('');
    }

    /**
     * Obtém configuração visual do status
     */
    getStatusConfig(status, alertas) {
        // Verificar se há alertas críticos
        const hasCriticalAlert = Object.values(alertas || {}).some(alert =>
            alert === 'critico' || alert === 'alto'
        );

        if (hasCriticalAlert) {
            return {
                bgColor: 'bg-red-500',
                animation: status === 'online' ? 'animate-pulse' : ''
            };
        }

        switch (status) {
            case 'online':
                return {
                    bgColor: 'bg-green-500',
                    animation: 'animate-pulse'
                };
            case 'offline':
                return {
                    bgColor: 'bg-red-500',
                    animation: ''
                };
            default:
                return {
                    bgColor: 'bg-gray-500',
                    animation: ''
                };
        }
    }

    /**
     * Obtém informações de alertas formatadas
     */
    getAlertasInfo(alertas) {
        if (!alertas || Object.keys(alertas).length === 0) {
            return null;
        }

        const alertasCriticos = Object.entries(alertas).filter(([key, value]) =>
            value === 'critico' || value === 'alto'
        );

        if (alertasCriticos.length > 0) {
            return `<span class="text-red-600">${alertasCriticos.length} ${alertasCriticos.length === 1 ? 'alerta' : 'alertas'}</span>`;
        }

        const alertasAvisos = Object.entries(alertas).filter(([key, value]) =>
            value === 'baixo' || value === 'muito_baixo'
        );

        if (alertasAvisos.length > 0) {
            return `<span class="text-yellow-600">${alertasAvisos.length} ${alertasAvisos.length === 1 ? 'aviso' : 'avisos'}</span>`;
        }

        return null;
    }

    /**
     * Verifica se há alertas
     */
    hasAlertas(alertas) {
        if (!alertas) return 'false';
        return Object.values(alertas).some(alert =>
            alert !== 'normal' && alert !== null
        ) ? 'true' : 'false';
    }

    /**
     * Extrai fabricante do nome
     */
    extrairFabricante(nome) {
        const fabricantes = ['Atlas Copco', 'Schulz', 'Kaeser', 'Chicago Pneumatic', 'Ingersoll Rand'];
        return fabricantes.find(f => nome.includes(f)) || 'Outros';
    }

    /**
     * Extrai setor da localização
     */
    extrairSetor(localizacao) {
        if (!localizacao) return 'Setor A';

        // Tentar encontrar padrão "Setor X"
        const matchSetor = localizacao.match(/Setor\s+([A-Z\d]+)/i);
        if (matchSetor) {
            return `Setor ${matchSetor[1].toUpperCase()}`;
        }

        // Tentar encontrar padrão "Galpão X"
        const matchGalpao = localizacao.match(/Galpão\s+(\d+)/i);
        if (matchGalpao) {
            return `Galpão ${matchGalpao[1]}`;
        }

        // Tentar encontrar linha de produção
        const matchLinha = localizacao.match(/Linha\s+(?:de\s+)?(?:Produção\s+)?(\d+)/i);
        if (matchLinha) {
            return `Linha ${matchLinha[1]}`;
        }

        // Se contém palavras-chave, usar como setor
        if (localizacao.toLowerCase().includes('produção')) return 'Produção';
        if (localizacao.toLowerCase().includes('backup')) return 'Backup';
        if (localizacao.toLowerCase().includes('principal')) return 'Principal';

        // Fallback baseado no ID ou primeira palavra
        const firstWord = localizacao.split(/[\s\-_]+/)[0];
        return firstWord || 'Setor A';
    }



    /**
     * Extrai temperatura do equipamento dos dados da API
     */
    extrairTemperatura(apiData) {
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
            const ultimoDado = apiData[0]; // Pegar o dado mais recente
            if (ultimoDado.temp_equipamento !== undefined && ultimoDado.temp_equipamento !== null) {
                return parseFloat(ultimoDado.temp_equipamento);
            }
        }
        return 0.0; // Padronização: sem dados = 0.0
    }

    /**
     * Extrai temperatura ambiente dos dados da API
     */
    extrairTemperaturaAmbiente(apiData) {
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
            const ultimoDado = apiData[0]; // Pegar o dado mais recente
            if (ultimoDado.temp_ambiente !== undefined && ultimoDado.temp_ambiente !== null) {
                return parseFloat(ultimoDado.temp_ambiente);
            }
        }
        return 0.0; // Padronização: sem dados = 0.0
    }

    /**
     * Extrai pressão dos dados da API
     */
    extrairPressao(apiData) {
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
            const ultimoDado = apiData[0]; // Pegar o dado mais recente
            if (ultimoDado.pressao !== undefined && ultimoDado.pressao !== null) {
                return parseFloat(ultimoDado.pressao);
            }
        }
        return 0.0; // Padronização: sem dados = 0.0
    }

    /**
     * Extrai potência dos dados da API
     */
    extrairPotenciaApi(apiData) {
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
            const ultimoDado = apiData[0]; // Pegar o dado mais recente
            if (ultimoDado.potencia_kw !== undefined && ultimoDado.potencia_kw !== null) {
                return parseFloat(ultimoDado.potencia_kw);
            }
        }
        return 0.0; // Padronização: sem dados = 0.0
    }

    /**
     * Extrai umidade dos dados da API (NOVIDADE)
     */
    extrairUmidade(apiData) {
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
            const ultimoDado = apiData[0];
            if (ultimoDado.umidade !== undefined && ultimoDado.umidade !== null) {
                return parseFloat(ultimoDado.umidade);
            }
        }
        return 0.0; // Padronização: sem dados = 0.0
    }

    /**
     * Extrai vibração dos dados da API (NOVIDADE)
     */
    extrairVibracao(apiData) {
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
            const ultimoDado = apiData[0];
            if (ultimoDado.vibracao !== undefined && ultimoDado.vibracao !== null) {
                return Boolean(ultimoDado.vibracao);
            }
        }
        return false; // Padronização: sem dados = false (normal)
    }

    /**
     * Extrai potência do nome (fallback quando API não disponível)
     */
    extrairPotencia(nome) {
        const match = nome.match(/(\d+)\s*(kW|HP|cv)/i);
        if (match) {
            const valor = parseInt(match[1]);
            const unidade = match[2].toLowerCase();

            // Converter HP para kW se necessário (1 HP = 0.746 kW)
            if (unidade === 'hp' || unidade === 'cv') {
                return Math.round(valor * 0.746);
            }
            return valor;
        }

        // Se não encontrar no nome, identificar baseado em modelos conhecidos
        const nomeMinusculo = nome.toLowerCase();

        // Atlas Copco
        if (nomeMinusculo.includes('ga22')) return 22;
        if (nomeMinusculo.includes('ga55')) return 55;
        if (nomeMinusculo.includes('ga75')) return 75;

        // Kaeser
        if (nomeMinusculo.includes('as 30') || nomeMinusculo.includes('as30')) return 30;
        if (nomeMinusculo.includes('as 25') || nomeMinusculo.includes('as25')) return 25;

        // Schulz (SRP modelos em HP -> kW)
        if (nomeMinusculo.includes('srp 4020')) return 15; // 20 HP = ~15 kW
        if (nomeMinusculo.includes('srp 3015')) return 11; // 15 HP = ~11 kW

        // Chicago Pneumatic (modelos em HP)
        if (nomeMinusculo.includes('cp40')) return 30; // 40 HP = ~30 kW
        if (nomeMinusculo.includes('cp30')) return 22; // 30 HP = ~22 kW

        // Ingersoll Rand
        if (nomeMinusculo.includes('r55')) return 55;
        if (nomeMinusculo.includes('r37')) return 37;

        // Fallback: estimativa conservadora
        return Math.floor(Math.random() * 20) + 15; // 15-35 kW
    }

    /**
     * Calcula horas de operação aproximadas
     */
    calcularHorasOperacao(dataCadastro) {
        if (!dataCadastro) return Math.floor(Math.random() * 3000) + 500;

        const cadastro = new Date(dataCadastro);
        const agora = new Date();
        const diasOperacao = Math.floor((agora - cadastro) / (1000 * 60 * 60 * 24));

        // Assumir ~12h de operação por dia
        return Math.floor(diasOperacao * 12 * 0.8); // 80% de uptime
    }

    /**
     * Calcula nível de alerta para um parâmetro (NOVIDADE)
     */
    calcularNivelAlerta(parametro, valor) {
        const limites = appConfig.alertas[parametro];
        if (!limites) return 'normal';

        // Para vibração (boolean)
        if (parametro === 'vibracao') {
            return valor ? 'critico' : 'normal';
        }

        // Para parâmetros numéricos
        for (const [nivel, config] of Object.entries(limites)) {
            if (valor >= config.min && (config.max === 999 || valor < config.max)) {
                return nivel;
            }
        }

        return 'normal';
    }

    /**
     * Configura event listeners para os compressores
     */
    setupCompressorEventListeners() {
        // Buscar elementos compressor em todos os containers
        const containers = [
            this.compressorsList,
            this.compressorsListDesktop, 
            this.compressorsListMobile
        ].filter(container => container); // Filtrar apenas containers válidos

        containers.forEach(container => {
            const compressorElements = container.querySelectorAll('.compressor');

            compressorElements.forEach(element => {
                // Remover listeners anteriores
                element.replaceWith(element.cloneNode(true));
            });

            // Adicionar novos listeners
            const newElements = container.querySelectorAll('.compressor');
            newElements.forEach(element => {
                element.addEventListener('click', () => {
                    const compressorId = element.getAttribute('data-id');
                    
                    // Navegar para página de detalhes usando router
                    router.navigate(`/compressor/${compressorId}`);
                    
                    console.log(`🔗 Navegando para compressor ${compressorId}`);
                });

                // Adicionar também evento para teclado (acessibilidade)
                element.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const compressorId = element.getAttribute('data-id');
                        router.navigate(`/compressor/${compressorId}`);
                    }
                });
            });
        });
    }

    /**
     * Atualiza contador de resultados
     */
    updateResultsCount() {
        if (this.resultsCount) {
            const total = this.compressores.length;
            this.resultsCount.textContent = `Mostrando ${total} ${total === 1 ? 'compressor' : 'compressores'}`;
        }
    }

    /**
     * Configura atualização automática de status
     */
    setupAutoStatusUpdate() {
        setInterval(async () => {
            if (this.useApi) {
                await this.updateCompressorStatus();
            }
        }, appConfig.updateInterval.realTimeData * 3); // A cada 6 segundos
    }

    /**
     * Atualiza status dos compressores
     */
    async updateCompressorStatus() {
        try {
            const response = await apiService.getCompressores();

            if (response && response.compressores) {
                // Criar lista atualizada para monitoramento
                const compressoresAtualizados = [];

                // Atualizar status dos compressores existentes
                response.compressores.forEach(apiComp => {
                    const compressor = this.compressores.find(c => c.id === apiComp.id_compressor);
                    if (compressor) {
                        const novoStatus = apiComp.esta_ligado ? 'online' : 'offline';

                        // Atualizar dados do compressor
                        compressor.status = novoStatus;
                        compressor.alertas = apiComp.alertas || {};
                        compressor.compressorInfo = apiComp;

                        // Adicionar à lista para monitoramento
                        compressoresAtualizados.push(compressor);

                        // Atualizar elemento na DOM
                        this.updateCompressorElement(compressor);
                    }
                });

                // Monitorar mudanças nos alertas
                if (compressoresAtualizados.length > 0) {
                    this.monitorarAlertasComNotificacao(compressoresAtualizados);
                }
            }
        } catch (error) {
            console.warn('Erro ao atualizar status dos compressores:', error);
        }
    }

    /**
     * Atualiza elemento específico na DOM
     */
    updateCompressorElement(compressor) {
        const element = document.querySelector(`[data-id="${compressor.id}"]`);
        if (element) {
            // Atualizar atributo de status
            element.setAttribute('data-status', compressor.status);

            // Atualizar indicador visual
            const statusIndicator = element.querySelector('.w-3.h-3');
            if (statusIndicator) {
                const statusConfig = this.getStatusConfig(compressor.status, compressor.alertas);
                statusIndicator.className = `w-3 h-3 ${statusConfig.bgColor} rounded-full mr-3 ${statusConfig.animation}`;
            }
        }
    }

    /**
     * Recarrega compressores da API
     */
    async reloadCompressores() {
        console.log('🔄 Recarregando compressores...');
        await this.loadCompressores();
        this.renderCompressores();
    }

    /**
     * Obtém compressor por ID
     */
    getCompressor(id) {
        return this.compressores.find(c => c.id == id);
    }

    /**
     * Getter para lista de compressores
     */
    getCompressores() {
        return [...this.compressores];
    }

    /**
     * Monitora mudanças nos alertas e gera notificações
     */
    monitorarAlertasComNotificacao(novosCompressores) {
        // Se não temos dados anteriores, salvar estado inicial E verificar alertas críticos atuais
        if (!this.alertasAnteriores) {
            this.alertasAnteriores = new Map();
            novosCompressores.forEach(comp => {
                this.alertasAnteriores.set(comp.id, { ...comp.alertas });
                
                // Verificar se há alertas críticos na inicialização
                this.verificarAlertasCriticosIniciais(comp);
            });
            return;
        }

        // Verificar mudanças nos alertas
        novosCompressores.forEach(compressor => {
            const alertasAntigos = this.alertasAnteriores.get(compressor.id);
            const alertasNovos = compressor.alertas;

            if (alertasAntigos && alertasNovos) {
                this.detectarMudancasAlertas(compressor, alertasAntigos, alertasNovos);
            }

            // Atualizar cache
            this.alertasAnteriores.set(compressor.id, { ...alertasNovos });
        });
    }

    /**
     * Detecta mudanças específicas nos alertas e gera notificações
     */
    detectarMudancasAlertas(compressor, alertasAntigos, alertasNovos) {
        const parametros = {
            'potencia': 'Potência',
            'temperatura_ambiente': 'Temp. Ambiente',
            'pressao': 'Pressão',
            'temperatura_equipamento': 'Temp. Equipamento'
        };

        Object.keys(parametros).forEach(param => {
            const antigoNivel = alertasAntigos[param];
            const novoNivel = alertasNovos[param];

            // Se mudou o nível de alerta
            if (antigoNivel !== novoNivel) {
                this.gerarNotificacaoAlerta(compressor, parametros[param], antigoNivel, novoNivel);
            }
        });
    }

    /**
     * Gera notificação para mudança de alerta
     */
    gerarNotificacaoAlerta(compressor, parametro, nivelAnterior, nivelNovo) {
        // Definir prioridade e tipo da notificação
        const prioridades = {
            'critico': { tipo: 'error', prioridade: 5 },
            'alto': { tipo: 'warning', prioridade: 4 },
            'normal': { tipo: 'success', prioridade: 2 },
            'baixo': { tipo: 'info', prioridade: 3 },
            'muito_baixo': { tipo: 'warning', prioridade: 4 }
        };

        const configNovo = prioridades[nivelNovo] || { tipo: 'info', prioridade: 2 };
        const configAnterior = prioridades[nivelAnterior] || { tipo: 'info', prioridade: 2 };

        // Só notificar se for mudança significativa (piora ou melhora importante)
        const mudancaSignificativa = configNovo.prioridade >= 4 ||
            (configAnterior.prioridade >= 4 && configNovo.prioridade <= 2);

        if (mudancaSignificativa && window.notificationManager) {
            const emoji = {
                'critico': '🚨',
                'alto': '⚠️',
                'normal': '✅',
                'baixo': '⚡',
                'muito_baixo': '⚡'
            };

            const titulo = configNovo.prioridade >= 4 ? 'Alerta Detectado' : 'Sistema Normalizado';
            const mensagem = `${parametro}: ${nivelAnterior} → ${nivelNovo}`;

            window.notificationManager.addNotification({
                type: configNovo.tipo,
                title: `${emoji[nivelNovo]} ${titulo}`,
                message: `${compressor.nome} - ${mensagem}`,
                compressorId: compressor.id,
                timestamp: new Date()
            });

            console.log(`🔔 Notificação: ${compressor.nome} - ${parametro}: ${nivelAnterior} → ${nivelNovo}`);
        }
    }

    /**
     * Verifica alertas críticos na inicialização do sistema
     */
    verificarAlertasCriticosIniciais(compressor) {
        if (!window.notificationManager) return;

        const parametros = {
            'potencia': 'Potência',
            'temperatura_ambiente': 'Temp. Ambiente',
            'pressao': 'Pressão',
            'temperatura_equipamento': 'Temp. Equipamento'
        };

        // Contar alertas críticos e altos
        const alertasCriticos = Object.entries(compressor.alertas || {}).filter(([key, value]) => 
            value === 'critico'
        );
        
        const alertasAltos = Object.entries(compressor.alertas || {}).filter(([key, value]) => 
            value === 'alto'
        );

        // Notificar sobre alertas críticos encontrados na inicialização
        if (alertasCriticos.length > 0) {
            const alertasTexto = alertasCriticos.map(([key]) => parametros[key] || key).join(', ');
            
            window.notificationManager.addNotification({
                type: 'error',
                title: '🚨 Alertas Críticos Detectados',
                message: `${compressor.nome} - ${alertasTexto} em nível crítico`,
                compressorId: compressor.id,
                timestamp: new Date()
            });
            
            console.log(`🚨 Alerta crítico inicial: ${compressor.nome} - ${alertasTexto}`);
        }
        
        // Notificar sobre alertas altos encontrados na inicialização
        else if (alertasAltos.length > 0) {
            const alertasTexto = alertasAltos.map(([key]) => parametros[key] || key).join(', ');
            
            window.notificationManager.addNotification({
                type: 'warning',
                title: '⚠️ Alertas Altos Detectados',
                message: `${compressor.nome} - ${alertasTexto} em nível alto`,
                compressorId: compressor.id,
                timestamp: new Date()
            });
            
            console.log(`⚠️ Alerta alto inicial: ${compressor.nome} - ${alertasTexto}`);
        }
    }

    /**
     * Método para testar notificações (desenvolvimento)
     */
    testarNotificacao() {
        if (this.compressores.length > 0 && window.notificationManager) {
            const compressor = this.compressores[0];
            window.notificationManager.addNotification({
                type: 'warning',
                title: '⚠️ Teste de Alerta',
                message: `${compressor.nome} - Temperatura: normal → alto`,
                compressorId: compressor.id,
                timestamp: new Date()
            });
            console.log('🧪 Notificação de teste enviada');
        }
    }

}