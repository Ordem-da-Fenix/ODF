/**
 * Módulo para gerenciar gráficos com Chart.js
 * Versão focada na API
 */

import { apiService } from '../../data/api.js';
import { appConfig, appState } from '../../data/config.js';

export class ChartManager {
    constructor() {
        this.chart = null;
        this.ctx = document.getElementById('graficoEnergia').getContext('2d');
        this.metric = 'pressao'; // default: pressao (primeiro dado da API)
        this.compressorId = null;
        this.dados = null;
        this.intervalGrafico = null;
        this.useApi = false;
        this.lastDataUpdate = null;
    }

    async inicializarGrafico() {
        // Verificar se API está disponível
        this.useApi = appState.apiStatus.isOnline;
        
        // Construir dados iniciais
        await this.buildInitialData();
        
        if (this.chart) {
            this.chart.destroy();
        }

        // Criar configuração dinâmica baseada na métrica atual
        const config = this.buildChartConfig();

        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: this.dados,
            options: config
        });

        // Iniciar atualização automática do gráfico
        this.iniciarAtualizacaoAutomatica();
    }

    /**
     * Constrói configuração do gráfico baseada na métrica atual
     */
    buildChartConfig() {
        const metricConfig = this.getMetricConfig(this.metric);
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#374151',
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                title: {
                    display: true,
                    text: metricConfig.title,
                    color: '#374151',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: metricConfig.yAxisLabel,
                        color: '#6b7280',
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    },
                    grid: {
                        color: '#e5e7eb'
                    },
                    ticks: {
                        color: '#6b7280',
                        callback: function(value) {
                            // Temperaturas com 1 casa decimal, outros com 2 casas
                            const casasDecimais = metricConfig.unit === '°C' ? 1 : 2;
                            return value.toFixed(casasDecimais) + ' ' + metricConfig.unit;
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Tempo',
                        color: '#6b7280',
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    },
                    grid: {
                        color: '#e5e7eb'
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            // Temperaturas com 1 casa decimal, outros com 2 casas
                            const casasDecimais = metricConfig.unit === '°C' ? 1 : 2;
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(casasDecimais) + ' ' + metricConfig.unit;
                        }
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 8,
                    radius: 2
                }
            }
        };
    }

    /**
     * Obtém configuração específica para cada métrica
     */
    getMetricConfig(metric) {
        const configs = {
            pressao: {
                title: `Pressão - Últimas ${appConfig.chart.dataPoints}h`,
                yAxisLabel: `Pressão (bar)`, // Sempre usar bar
                unit: 'bar',
                color: appConfig.chart.colors.pressao,
                field: 'pressao'
            },
            temperatura: {
                title: `Temperatura Equipamento - Últimas ${appConfig.chart.dataPoints}h`,
                yAxisLabel: 'Temperatura (°C)',
                unit: '°C',
                color: appConfig.chart.colors.temperatura,
                field: 'temp_equipamento'
            },
            temperaturaAmbiente: {
                title: `Temperatura Ambiente - Últimas ${appConfig.chart.dataPoints}h`,
                yAxisLabel: 'Temperatura (°C)',
                unit: '°C',
                color: appConfig.chart.colors.temperaturaAmbiente,
                field: 'temp_ambiente'
            },
            potencia: {
                title: `Consumo de Energia - Últimas ${appConfig.chart.dataPoints}h`,
                yAxisLabel: 'Potência (kW)',
                unit: 'kW',
                color: appConfig.chart.colors.primary,
                field: 'potencia_kw'
            },
            consumo: {
                title: `Consumo Estimado - Últimas ${appConfig.chart.dataPoints}h`,
                yAxisLabel: 'Consumo (kWh)',
                unit: 'kWh',
                color: appConfig.chart.colors.primary,
                field: 'consumo_estimado'
            },
            umidade: {
                title: `Umidade - Últimas ${appConfig.chart.dataPoints}h`,
                yAxisLabel: 'Umidade (%)',
                unit: '%',
                color: appConfig.chart.colors.umidade || '#3B82F6',
                field: 'umidade'
            },
            corrente: {
                title: `Corrente - Últimas ${appConfig.chart.dataPoints}h`,
                yAxisLabel: 'Corrente (A)',
                unit: 'A',
                color: appConfig.chart.colors.corrente || '#F59E0B',
                field: 'corrente'
            }
        };

        return configs[metric] || configs.pressao;
    }

    /**
     * Muda a métrica exibida no gráfico
     */
    async setMetric(metric) {
        this.metric = metric;
        
        try {
            await this.buildDataForMetric(metric);
            
            if (this.chart) {
                // Atualizar dados e configuração
                this.chart.data = this.dados;
                this.chart.options = this.buildChartConfig();
                this.chart.update('active');
                // Gráfico atualizado
            } else {
                console.warn('⚠️ Chart não inicializado, dados preparados para: ' + metric);
            }
        } catch (error) {
            console.error('❌ Erro em setMetric:', error);
        }
    }

    /**
     * Define o compressor ativo para o gráfico
     */
    setCompressor(compressorId) {
        this.compressorId = parseInt(compressorId);
        // Log removido para reduzir ruído - já logado no app.js
    }

    /**
     * Constrói dados iniciais do gráfico
     */
    async buildInitialData() {
        await this.buildDataForMetric(this.metric);
    }

    /**
     * Constrói dados para uma métrica específica
     */
    async buildDataForMetric(metric) {
        try {
            if (this.useApi && this.compressorId) {
                const response = await apiService.getDadosTempoReal(this.compressorId, appConfig.chart.dataPoints);
                if (response.dados && response.dados.length > 0) {
                    const dadosHistoricos = response.dados.reverse(); // API retorna mais recente primeiro
                    // Log reduzido para performance
                    
                    this.dados = this.processDataForChart(dadosHistoricos, metric);
                    this.lastDataUpdate = Date.now();
                } else {
                    this.dados = this.generateEmptyChart(metric);
                }
            } else {
                this.dados = this.generateEmptyChart(metric);
            }

        } catch (error) {
            console.error('Erro ao construir dados do gráfico:', error);
            this.dados = this.generateEmptyChart(metric);
        }
    }

    /**
     * Processa dados para formato do Chart.js
     */
    processDataForChart(dadosHistoricos, metric) {
        const metricConfig = this.getMetricConfig(metric);
        const labels = [];
        const data = [];

        dadosHistoricos.forEach((item, index) => {
            if (this.useApi) {
                // Dados da API - converter UTC para horário local brasileiro
                // API retorna: "2025-10-21T10:43:40+00:00" (UTC)
                // Convertemos para: "07:43:40" (horário de Brasília UTC-3)
                const timestamp = new Date(item.data_medicao);
                labels.push(timestamp.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'America/Sao_Paulo' // Força conversão para horário brasileiro
                }));

                let value = 0;
                switch (metric) {
                    case 'pressao':
                        value = item.pressao || 0;
                        break;
                    case 'temperatura':
                        value = item.temp_equipamento || 0;
                        break;
                    case 'temperaturaAmbiente':
                        value = item.temp_ambiente || 0;
                        break;
                    case 'potencia':
                        value = item.potencia_kw || 0;
                        break;
                    case 'consumo':
                        // Estimar consumo baseado em pressão e temperatura
                        value = (item.pressao * 2.5) + (item.temp_equipamento * 0.3);
                        break;
                    case 'umidade':
                        value = item.umidade || 0;
                        break;
                    case 'corrente':
                        value = item.corrente || 0;
                        break;
                }
                data.push(value);
            } else {
                // Dados mock
                labels.push(`${index}h`);
                data.push(item.value || Math.random() * 50 + 25);
            }
        });

        // Preencher dados faltantes se necessário
        while (labels.length < appConfig.chart.dataPoints) {
            if (this.useApi) {
                const now = new Date();
                now.setHours(now.getHours() - (appConfig.chart.dataPoints - labels.length));
                labels.unshift(now.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'America/Sao_Paulo' // Horário brasileiro
                }));
            } else {
                labels.unshift(`${appConfig.chart.dataPoints - labels.length}h`);
            }
            data.unshift(0);
        }

        return {
            labels,
            datasets: [{
                label: metricConfig.title.split(' - ')[0],
                data,
                borderColor: metricConfig.color,
                backgroundColor: metricConfig.color + '20', // 20% opacity
                tension: 0.3,
                fill: true,
                pointRadius: 2,
                pointHoverRadius: 6
            }]
        };
    }



    /**
     * Gera gráfico vazio em caso de erro
     */
    generateEmptyChart(metric) {
        const metricConfig = this.getMetricConfig(metric);
        const labels = Array.from({length: appConfig.chart.dataPoints}, (_, i) => `${i}h`);
        const data = Array.from({length: appConfig.chart.dataPoints}, () => 0);

        return {
            labels,
            datasets: [{
                label: 'Sem dados',
                data,
                borderColor: '#9ca3af',
                backgroundColor: 'rgba(156, 163, 175, 0.1)',
                tension: 0.3,
                fill: true
            }]
        };
    }

    iniciarAtualizacaoAutomatica() {
        // Limpar intervalo anterior se existir
        if (this.intervalGrafico) {
            clearInterval(this.intervalGrafico);
        }

        // Atualizar dados do gráfico baseado na configuração
        this.intervalGrafico = setInterval(() => {
            if (this.chart) {
                this.atualizarDadosGrafico();
            }
        }, appConfig.updateInterval.chartData);
    }

    async atualizarDadosGrafico() {
        try {
            if (!this.compressorId) {
                console.log('📊 Nenhum compressor selecionado para atualizar gráfico');
                return;
            }

            let novoValor = null;
            
            if (this.useApi) {
                // Buscar dados mais recentes da API (usar 5 para contornar bug com limit=1)
                try {
                    const response = await apiService.getDadosTempoReal(this.compressorId, 5);
                    if (response.dados && response.dados.length > 0) {
                        const ultimoDado = response.dados[0];
                        
                        switch (this.metric) {
                            case 'pressao':
                                novoValor = ultimoDado.pressao || 0;
                                break;
                            case 'temperatura':
                                novoValor = ultimoDado.temp_equipamento || 0;
                                break;
                            case 'temperaturaAmbiente':
                                novoValor = ultimoDado.temp_ambiente || 0;
                                break;
                            case 'potencia':
                                novoValor = ultimoDado.potencia_kw || 0;
                                break;
                            case 'consumo':
                                novoValor = (ultimoDado.pressao * 2.5) + (ultimoDado.temp_equipamento * 0.3);
                                break;
                            case 'umidade':
                                novoValor = ultimoDado.umidade || 0;
                                break;
                            case 'corrente':
                                novoValor = ultimoDado.corrente || 0;
                                break;
                        }
                    }
                } catch (apiError) {
                    console.warn('Erro na atualização do gráfico via API:', apiError.message);
                    return; // Para de tentar atualizar se API falhou
                }
            }

            // Atualizar o gráfico
            if (this.chart && this.chart.data && this.chart.data.datasets[0]) {
                const dataset = this.chart.data.datasets[0];
                
                // Remover o primeiro ponto e adicionar o novo
                dataset.data.shift();
                dataset.data.push(novoValor);
                
                // Atualizar label do tempo
                const agora = new Date();
                this.chart.data.labels.shift();
                this.chart.data.labels.push(agora.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'America/Sao_Paulo' // Horário brasileiro
                }));
                
                // Atualizar gráfico com animação suave
                this.chart.update('none');
            }

        } catch (error) {
            console.error('Erro ao atualizar dados do gráfico:', error);
        }
    }



    pararAtualizacao() {
        if (this.intervalGrafico) {
            clearInterval(this.intervalGrafico);
            this.intervalGrafico = null;
        }
    }

    destruir() {
        this.pararAtualizacao();
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        this.compressorId = null;
        this.lastDataUpdate = null;
    }

    /**
     * Força recarga dos dados do gráfico
     */
    async recarregarDados() {
        // Recarregando dados do gráfico
        await this.buildDataForMetric(this.metric);
        
        if (this.chart) {
            this.chart.data = this.dados;
            this.chart.update('active');
        }
    }



    /**
     * Obtém estatísticas do gráfico
     */
    getStats() {
        return {
            metric: this.metric,
            compressorId: this.compressorId,
            useApi: this.useApi,
            lastDataUpdate: this.lastDataUpdate,
            hasChart: !!this.chart,
            dataPoints: this.chart?.data?.datasets?.[0]?.data?.length || 0
        };
    }

    /**
     * Exporta dados do gráfico atual
     */
    exportarDados() {
        if (!this.chart || !this.chart.data) {
            console.warn('Nenhum dado disponível para exportar');
            return null;
        }

        const dados = {
            metrica: this.metric,
            compressor: this.compressorId,
            timestamp: new Date().toISOString(),
            labels: [...this.chart.data.labels],
            valores: [...this.chart.data.datasets[0].data],
            fonte: this.useApi ? 'API' : 'mock'
        };

        // Criar e baixar arquivo CSV
        const csv = this.converterParaCSV(dados);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `grafico_${this.metric}_${this.compressorId}_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return dados;
    }

    /**
     * Converte dados para formato CSV
     */
    converterParaCSV(dados) {
        const headers = ['Tempo', 'Valor', 'Métrica', 'Compressor', 'Fonte'];
        const rows = dados.labels.map((label, index) => [
            label,
            dados.valores[index],
            dados.metrica,
            dados.compressor,
            dados.fonte
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    // Getters para uso externo
    get currentMetric() {
        return this.metric;
    }

    get isUsingApi() {
        return this.useApi;
    }

    get activeCompressor() {
        return this.compressorId;
    }
}