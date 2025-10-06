// Elementos do DOM
const modal = document.getElementById('modal-detalhes');
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const spans = document.getElementsByClassName('close');
const loginForm = document.getElementById('loginForm');
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
    pressaoElement.textContent = `${dados.pressao} PSI`;
    temperaturaElement.textContent = `${dados.temperatura} °C`;
}

// Login Modal
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

// Fechar modais ao clicar no X
Array.from(spans).forEach(span => {
    span.addEventListener('click', function() {
        modal.style.display = 'none';
        loginModal.style.display = 'none';
    });
});

// Fechar modais ao clicar fora
window.addEventListener('click', (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
    if (event.target == loginModal) {
        loginModal.style.display = 'none';
    }
});

// Manipular envio do formulário
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData);
    console.log('Dados do formulário:', data);
    // Aqui você pode adicionar a lógica de autenticação
    loginModal.style.display = 'none';
});

// Event Listeners dos compressores
compressores.forEach(compressor => {
    compressor.addEventListener('click', () => {
        const compressorId = compressor.getAttribute('data-id');
        compressorIdElement.textContent = compressorId;
        modal.style.display = 'block';
        
        if (!chart) {
            inicializarGrafico();
        }
        
        // Iniciar atualização em tempo real
        atualizarDadosTempoReal();
        setInterval(atualizarDadosTempoReal, 2000);
    });
});

span.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});

// Atualizar dados do gráfico periodicamente
setInterval(() => {
    if (chart) {
        dadosEnergia.datasets[0].data.shift();
        dadosEnergia.datasets[0].data.push(Math.random() * 100);
        chart.update();
    }
}, 5000);
