/**
 * Mock de dados para simulação da aplicação OFtech
 * Simula dados que viriam de uma API backend
 */

// Lista de compressores com dados completos
export const compressoresMock = [
    {
        id: 1,
        nome: 'Compressor Atlas Copco GA22',
        modelo: 'GA22',
        fabricante: 'Atlas Copco',
        status: 'online',
        localizacao: {
            setor: 'Setor A',
            linha: 'Linha de Produção 1',
            coordenadas: { x: 10, y: 25 }
        },
        especificacoes: {
            potencia: '22 kW',
            pressaoMaxima: 100,
            pressaoMinima: 70,
            temperaturaMaxima: 40,
            temperaturaMinima: 15
        },
        dadosTempoReal: {
            pressao: 85.2,
            temperatura: 28.5,
            consumoEnergia: 18.7,
            horasOperacao: 1247,
            ultimaManutencao: '2024-09-15T10:30:00Z'
        },
        alertas: [],
        historicoEnergia: Array.from({length: 24}, (_, i) => ({
            hora: i,
            consumo: Math.random() * 25 + 15 // 15-40 kWh
        }))
    },
    {
        id: 2,
        nome: 'Compressor Schulz SRP 4020',
        modelo: 'SRP 4020', 
        fabricante: 'Schulz',
        status: 'offline',
        localizacao: {
            setor: 'Setor B',
            linha: 'Linha de Produção 2', 
            coordenadas: { x: 50, y: 15 }
        },
        especificacoes: {
            potencia: '20 HP',
            pressaoMaxima: 90,
            pressaoMinima: 60,
            temperaturaMaxima: 35,
            temperaturaMinima: 10
        },
        dadosTempoReal: {
            pressao: 0,
            temperatura: 22.1,
            consumoEnergia: 0,
            horasOperacao: 892,
            ultimaManutencao: '2024-08-20T14:15:00Z'
        },
        alertas: [
            {
                tipo: 'erro',
                mensagem: 'Compressor desligado - Manutenção programada',
                timestamp: '2024-10-06T08:00:00Z'
            }
        ],
        historicoEnergia: Array.from({length: 24}, () => ({
            hora: 0,
            consumo: 0
        }))
    },
    {
        id: 3,
        nome: 'Compressor Kaeser AS 30',
        modelo: 'AS 30',
        fabricante: 'Kaeser',
        status: 'online',
        localizacao: {
            setor: 'Setor C',
            linha: 'Linha de Produção 3',
            coordenadas: { x: 80, y: 40 }
        },
        especificacoes: {
            potencia: '30 kW',
            pressaoMaxima: 110,
            pressaoMinima: 80,
            temperaturaMaxima: 45,
            temperaturaMinima: 18
        },
        dadosTempoReal: {
            pressao: 92.7,
            temperatura: 31.2,
            consumoEnergia: 26.3,
            horasOperacao: 2156,
            ultimaManutencao: '2024-09-28T16:45:00Z'
        },
        alertas: [
            {
                tipo: 'aviso',
                mensagem: 'Temperatura ligeiramente elevada',
                timestamp: '2024-10-06T10:15:00Z'
            }
        ],
        historicoEnergia: Array.from({length: 24}, (_, i) => ({
            hora: i,
            consumo: Math.random() * 35 + 20 // 20-55 kWh
        }))
    },
    {
        id: 4,
        nome: 'Compressor Chicago CP40',
        modelo: 'CP40',
        fabricante: 'Chicago Pneumatic',
        status: 'manutencao',
        localizacao: {
            setor: 'Setor D',
            linha: 'Backup',
            coordenadas: { x: 30, y: 60 }
        },
        especificacoes: {
            potencia: '40 HP',
            pressaoMaxima: 120,
            pressaoMinima: 85,
            temperaturaMaxima: 50,
            temperaturaMinima: 20
        },
        dadosTempoReal: {
            pressao: 0,
            temperatura: 24.8,
            consumoEnergia: 0,
            horasOperacao: 3421,
            ultimaManutencao: '2024-10-05T09:00:00Z'
        },
        alertas: [
            {
                tipo: 'manutencao',
                mensagem: 'Manutenção preventiva em andamento',
                timestamp: '2024-10-05T09:00:00Z'
            }
        ],
        historicoEnergia: Array.from({length: 24}, () => ({
            hora: 0,
            consumo: 0
        }))
    },
    {
        id: 5,
        nome: 'Compressor Ingersoll Rand R55',
        modelo: 'R55',
        fabricante: 'Ingersoll Rand',
        status: 'online',
        localizacao: {
            setor: 'Setor E',
            linha: 'Linha de Produção 4',
            coordenadas: { x: 70, y: 20 }
        },
        especificacoes: {
            potencia: '55 kW',
            pressaoMaxima: 130,
            pressaoMinima: 95,
            temperaturaMaxima: 55,
            temperaturaMinima: 25
        },
        dadosTempoReal: {
            pressao: 108.3,
            temperatura: 38.9,
            consumoEnergia: 47.2,
            horasOperacao: 1789,
            ultimaManutencao: '2024-09-10T11:20:00Z'
        },
        alertas: [],
        historicoEnergia: Array.from({length: 24}, (_, i) => ({
            hora: i,
            consumo: Math.random() * 60 + 35 // 35-95 kWh
        }))
    }
];

// Usuários mock removidos - sistema standalone sem autenticação

// Configurações simuladas do sistema
export const configSistemaMock = {
    empresa: {
        nome: 'OFtech Sistemas Industriais',
        cnpj: '12.345.678/0001-99',
        endereco: 'Rua Industrial, 123 - São Paulo/SP'
    },
    limites: {
        pressaoMinima: 60,
        pressaoMaxima: 130,
        temperaturaMinima: 10,
        temperaturaMaxima: 60
    },
    intervalos: {
        atualizacaoTempoReal: 2000,
        atualizacaoGrafico: 5000,
        salvarHistorico: 60000
    },
    notificacoes: {
        email: true,
        sms: false,
        push: true
    }
};

// Dados de relatórios simulados
export const relatoriosMock = {
    consumoMensal: {
        janeiro: 15420,
        fevereiro: 14230,
        marco: 16800,
        abril: 15900,
        maio: 17200,
        junho: 16100,
        julho: 15800,
        agosto: 16400,
        setembro: 15600,
        outubro: 12300 // Mês atual parcial
    },
    eficiencia: {
        mediaGeral: 87.5,
        porCompressor: {
            1: 92.3,
            2: 0, // Offline
            3: 88.7, 
            4: 0, // Manutenção
            5: 85.1
        }
    },
    alertasUltimos30Dias: [
        {
            compressorId: 2,
            tipo: 'erro',
            mensagem: 'Falha no motor principal',
            timestamp: '2024-10-01T14:30:00Z',
            resolvido: true
        },
        {
            compressorId: 5,
            tipo: 'aviso',
            mensagem: 'Temperatura acima do normal',
            timestamp: '2024-09-28T10:15:00Z',
            resolvido: true
        },
        {
            compressorId: 3,
            tipo: 'aviso',
            mensagem: 'Pressão instável detectada',
            timestamp: '2024-09-25T16:45:00Z',
            resolvido: true
        }
    ]
};

// Funções para simular chamadas de API
export const apiMock = {
    // Simular busca de compressores
    async getCompressores() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: compressoresMock,
                    timestamp: new Date().toISOString()
                });
            }, Math.random() * 1000 + 500); // 500-1500ms de delay
        });
    },

    // Simular busca de compressor específico
    async getCompressor(id) {
        return new Promise(resolve => {
            setTimeout(() => {
                const compressor = compressoresMock.find(c => c.id === parseInt(id));
                resolve({
                    success: !!compressor,
                    data: compressor || null,
                    timestamp: new Date().toISOString()
                });
            }, Math.random() * 500 + 200);
        });
    },

    // Autenticação removida no modo standalone

    // Simular atualização de dados em tempo real
    async getDadosTempoReal(compressorId) {
        return new Promise(resolve => {
            setTimeout(() => {
                const compressor = compressoresMock.find(c => c.id === parseInt(compressorId));
                
                if (compressor && compressor.status === 'online') {
                    // Simular variação nos dados
                    const specs = compressor.especificacoes;
                    const variacao = 0.1; // 10% de variação
                    
                    const novosDados = {
                        pressao: Math.random() * (specs.pressaoMaxima - specs.pressaoMinima) + specs.pressaoMinima,
                        temperatura: Math.random() * (specs.temperaturaMaxima - specs.temperaturaMinima) + specs.temperaturaMinima,
                        consumoEnergia: Math.random() * parseFloat(specs.potencia) * 1.2,
                        timestamp: new Date().toISOString()
                    };

                    resolve({
                        success: true,
                        data: novosDados
                    });
                } else {
                    resolve({
                        success: false,
                        data: {
                            pressao: 0,
                            temperatura: 20 + Math.random() * 5,
                            consumoEnergia: 0,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            }, 100);
        });
    }
};

// Status possíveis dos compressores
export const statusCompressor = {
    ONLINE: 'online',
    OFFLINE: 'offline', 
    MANUTENCAO: 'manutencao',
    ERRO: 'erro'
};

// Tipos de alerta
export const tiposAlerta = {
    INFO: 'info',
    AVISO: 'aviso', 
    ERRO: 'erro',
    MANUTENCAO: 'manutencao'
};