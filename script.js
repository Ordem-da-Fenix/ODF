// Elementos do DOM
const modal = document.getElementById('modal-detalhes');
const spans = document.getElementsByClassName('close');
const compressores = document.querySelectorAll('.compressor');
const compressorIdElement = document.getElementById('compressor-id');
const pressaoElement = document.getElementById('pressao');
const temperaturaElement = document.getElementById('temperatura');

// Configuração do gráfico
let chart;
const ctx = document.getElementById('graficoEnergia').getContext('2d');

// Dados simulados para o gráfico
let dadosEnergia = {
    labels: Array.from({length: 24}, (_, i) => `${i}h`),
    datasets: [{
        label: 'Consumo de Energia (kWh)',
        data: Array.from({length: 24}, () => Math.random() * 100),
        borderColor: '#2c3e50',
        tension: 0.4,
        fill: false
    }]
};

// Configuração do gráfico
function inicializarGrafico() {
    chart = new Chart(ctx, {
        type: 'line',
        data: dadosEnergia,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Consumo de Energia (kWh)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Hora'
                    }
                }
            }
        }
    });
}

// Funções para simular dados em tempo real
function gerarDadosAleatorios() {
    return {
        pressao: (Math.random() * 50 + 70).toFixed(1),
        temperatura: (Math.random() * 30 + 20).toFixed(1)
    };
}

function atualizarDadosTempoReal() {
    const dados = gerarDadosAleatorios();
    pressaoElement.textContent = `${dados.pressao} bar`;
    temperaturaElement.textContent = `${dados.temperatura} °C`;
}

// Função para fechar modal
function fecharModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restaurar scroll
    
    // Limpar intervalo de atualização
    if (window.intervaloDados) {
        clearInterval(window.intervaloDados);
    }
}

// Fechar modais ao clicar no X
Array.from(spans).forEach(span => {
    span.addEventListener('click', function() {
        fecharModal();
    });
});

// Fechar modais ao clicar fora
window.addEventListener('click', (event) => {
    if (event.target == modal) {
        fecharModal();
    }
});

// Fechar modal com tecla ESC
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (!modal.classList.contains('hidden')) {
            fecharModal();
        }
    }
});

// Manipular envio do formulário
// Não há formulário de login em modo standalone

// Event Listeners dos compressores
compressores.forEach(compressor => {
    compressor.addEventListener('click', () => {
        const compressorId = compressor.getAttribute('data-id');
        compressorIdElement.textContent = compressorId;
        
        // Mostrar modal removendo a classe hidden
        modal.classList.remove('hidden');
        
        // Centralizar o modal (já está centralizado pelo CSS Tailwind)
        document.body.style.overflow = 'hidden'; // Prevenir scroll
        
        if (!chart) {
            // Aguardar um pouco para o modal aparecer antes de inicializar o gráfico
            setTimeout(() => {
                inicializarGrafico();
            }, 100);
        }
        
        // Iniciar atualização em tempo real
        atualizarDadosTempoReal();
        
        // Limpar intervalos anteriores se existirem
        if (window.intervaloDados) {
            clearInterval(window.intervaloDados);
        }
        
        // Criar novo intervalo
        window.intervaloDados = setInterval(atualizarDadosTempoReal, 2000);
    });
});

// Atualizar dados do gráfico periodicamente
setInterval(() => {
    if (chart) {
        dadosEnergia.datasets[0].data.shift();
        dadosEnergia.datasets[0].data.push(Math.random() * 100);
        chart.update();
    }
}, 5000);

// ======================================
// STATUS DA API
// ======================================

/**
 * Atualiza o indicador de status da API
 */
function updateStatusIndicator() {
    const apiStatusIndicator = document.getElementById('api-status-indicator');
    const apiStatusText = document.getElementById('api-status-text');
    
    if (!apiStatusIndicator || !apiStatusText) return;
    
    const status = appState.apiStatus;
    
    switch (status.mode) {
        case 'online':
            apiStatusIndicator.className = 'w-3 h-3 rounded-full bg-green-400';
            apiStatusText.textContent = 'API Online';
            break;
        case 'offline':
            apiStatusIndicator.className = 'w-3 h-3 rounded-full bg-red-400';
            apiStatusText.textContent = 'API Offline';
            break;
        default:
            apiStatusIndicator.className = 'w-3 h-3 rounded-full bg-gray-400';
            apiStatusText.textContent = 'Conectando...';
    }
}

// Atualizar status da API periodicamente
setInterval(updateStatusIndicator, 5000);
