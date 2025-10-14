/**
 * Módulo para gerenciar a interface de compressores com dados da API
 * Substitui os dados estáticos por dados dinâmicos da API
 */

import { apiService } from '../../data/api.js';
import { appConfig, appState, configUtils } from '../../data/config.js';

export class CompressorInterfaceManager {
    constructor() {
        this.compressorsList = document.getElementById('compressors-list');
        this.resultsCount = document.getElementById('results-count');
        this.compressores = [];
        this.useApi = false;
        
        this.init();
    }

    async init() {
        console.log('🖥️ Inicializando CompressorInterfaceManager...');
        
        // Verificar se API está disponível fazendo nossa própria verificação
        await this.checkApiAvailability();
        
        // Carregar compressores
        await this.loadCompressores();
        
        // Renderizar interface
        this.renderCompressores();
        
        // Configurar atualização automática dos status
        this.setupAutoStatusUpdate();
        
        console.log(`✅ Interface carregada com ${this.compressores.length} compressores`);
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
                console.log('🚀 CompressorInterfaceManager: Modo API ativado');
            } else {
                throw new Error('API não disponível');
            }
        } catch (error) {
            console.error('❌ API obrigatória não disponível. Sistema não pode iniciar.', error.message);
            this.useApi = false;
            appState.apiStatus.isOnline = false;
            appState.apiStatus.mode = 'offline';
        }
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
                                // Buscar dados de sensor em tempo real
                                dadosTempoReal = await apiService.getDadosTempoReal(comp.id_compressor, 1);
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
        if (!this.compressorsList) {
            console.error('Elemento compressors-list não encontrado');
            return;
        }

        // Limpar lista atual
        this.compressorsList.innerHTML = '';

        // Renderizar cada compressor
        this.compressores.forEach(compressor => {
            const compressorElement = this.createCompressorElement(compressor);
            this.compressorsList.appendChild(compressorElement);
        });

        // Atualizar contador
        this.updateResultsCount();

        // Reconfigurar event listeners
        this.setupCompressorEventListeners();

        // Notificar sistema de filtros sobre a atualização
        setTimeout(() => {
            if (window.searchFilterManager) {
                window.searchFilterManager.onCompressorsUpdated();
            }
        }, 100); // Pequeno delay para garantir que o DOM foi atualizado
    }

    /**
     * Cria elemento HTML para um compressor baseado apenas na API
     */
    createCompressorElement(compressor) {
        const div = document.createElement('div');
        div.className = 'compressor flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200';
        
        // Extrair dados da API (sempre)
        const potenciaApi = this.extrairPotenciaApi(compressor.apiData);
        const potencia = potenciaApi !== null ? potenciaApi : this.extrairPotencia(compressor.nome);
        
        const dadosCompressor = {
            id: compressor.id,
            status: compressor.status,
            fabricante: compressor.fabricante,
            setor: compressor.setor,
            nome: compressor.nome,
            potencia: potencia,
            horas: this.calcularHorasOperacao(compressor.dataCadastro),
            alertas: this.hasAlertas(compressor.alertas),
            temperatura: this.extrairTemperatura(compressor.apiData),
            temperaturaAmbiente: this.extrairTemperaturaAmbiente(compressor.apiData),
            pressao: this.extrairPressao(compressor.apiData)
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

        return div;
    }

    /**
     * Constrói informações principais do compressor
     */
    buildCompressorInfo(compressor, dadosCompressor) {
        const parts = [dadosCompressor.setor];
        
        // Adicionar potência (sempre em kW conforme API)
        if (dadosCompressor.potencia) {
            parts.push(`${dadosCompressor.potencia} kW`);
        }
        
        // Adicionar horas de operação formatadas
        if (dadosCompressor.horas) {
            const horasFormatadas = dadosCompressor.horas.toLocaleString('pt-BR');
            parts.push(`${horasFormatadas}h operação`);
        }

        // Adicionar alertas se existirem
        const alertasInfo = this.getAlertasInfo(compressor.alertas);
        if (alertasInfo) {
            parts.push(alertasInfo);
        }

        return parts.join(' • ');
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

        // Temperatura do equipamento (mais relevante)
        let temperatura = dadosCompressor.temperatura !== undefined && dadosCompressor.temperatura !== null 
            ? dadosCompressor.temperatura 
            : (dadosCompressor.temperaturaAmbiente !== undefined && dadosCompressor.temperaturaAmbiente !== null 
                ? dadosCompressor.temperaturaAmbiente 
                : 25);

        items.push(`
            <span class="flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z">
                    </path>
                </svg>
                Temp Equip: ${temperatura.toFixed(1)}°C
            </span>
        `);

        // Temperatura ambiente se disponível e diferente
        if (dadosCompressor.temperaturaAmbiente && dadosCompressor.temperaturaAmbiente !== temperatura) {
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

        // Mostrar pressão se disponível (tanto API quanto mock)
        if (dadosCompressor.pressao !== undefined && dadosCompressor.pressao !== null) {
            items.push(`
                <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    ${dadosCompressor.pressao.toFixed(1)} bar
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
        return 25.0; // Fallback
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
        return null; // Retorna null se não disponível
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
        return 0.0; // Fallback
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
        return null;
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
     * Configura event listeners para os compressores
     */
    setupCompressorEventListeners() {
        const compressorElements = this.compressorsList.querySelectorAll('.compressor');
        
        compressorElements.forEach(element => {
            // Remover listeners anteriores
            element.replaceWith(element.cloneNode(true));
        });

        // Adicionar novos listeners
        const newElements = this.compressorsList.querySelectorAll('.compressor');
        newElements.forEach(element => {
            element.addEventListener('click', () => {
                const compressorId = element.getAttribute('data-id');
                
                // Disparar evento para outros módulos
                window.dispatchEvent(new CustomEvent('compressorSelected', {
                    detail: { compressorId }
                }));
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
                // Atualizar status dos compressores existentes
                response.compressores.forEach(apiComp => {
                    const compressor = this.compressores.find(c => c.id === apiComp.id_compressor);
                    if (compressor) {
                        const novoStatus = apiComp.esta_ligado ? 'online' : 'offline';
                        
                        if (compressor.status !== novoStatus) {
                            compressor.status = novoStatus;
                            compressor.alertas = apiComp.alertas || {};
                            
                            // Atualizar elemento na DOM
                            this.updateCompressorElement(compressor);
                        }
                    }
                });
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
}