/**
 * Módulo para gerenciar gráficos com Chart.js
 */

export class ChartManager {
    constructor() {
        this.chart = null;
        this.ctx = document.getElementById('graficoEnergia').getContext('2d');
        this.dadosEnergia = {
            labels: Array.from({length: 24}, (_, i) => `${i}h`),
            datasets: [{
                label: 'Consumo de Energia (kWh)',
                data: Array.from({length: 24}, () => Math.random() * 100),
                borderColor: '#ea580c', // Cor laranja da OFtech
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ea580c',
                pointBorderColor: '#c2410c',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        };
        
        this.intervalGrafico = null;
    }

    inicializarGrafico() {
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: this.dadosEnergia,
            options: {
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
                        text: 'Consumo de Energia - Últimas 24 Horas',
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
                            text: 'Consumo de Energia (kWh)',
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
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Hora do Dia',
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
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                }
            }
        });

        // Iniciar atualização automática do gráfico
        this.iniciarAtualizacaoAutomatica();
    }

    iniciarAtualizacaoAutomatica() {
        // Limpar intervalo anterior se existir
        if (this.intervalGrafico) {
            clearInterval(this.intervalGrafico);
        }

        // Atualizar dados do gráfico a cada 5 segundos
        this.intervalGrafico = setInterval(() => {
            if (this.chart) {
                this.atualizarDadosGrafico();
            }
        }, 5000);
    }

    atualizarDadosGrafico() {
        // Remover o primeiro ponto e adicionar um novo
        this.dadosEnergia.datasets[0].data.shift();
        this.dadosEnergia.datasets[0].data.push(Math.random() * 100);
        
        // Atualizar labels para refletir o tempo atual
        const horaAtual = new Date().getHours();
        this.dadosEnergia.labels.shift();
        this.dadosEnergia.labels.push(`${horaAtual}h`);
        
        this.chart.update('none'); // Animação mais suave
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
    }
}