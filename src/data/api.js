/**
 * Serviço de API para integração com backend
 * Base URL: http://localhost:8000
 */

export class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:8000';
        this.isOnline = false;
    }

    /**
     * Verifica se a API está disponível
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.isOnline = true;
                console.log('✅ API conectada com sucesso:', data.status);
                return data;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            this.isOnline = false;
            console.warn('⚠️ API não disponível, usando dados mock:', error.message);
            return false;
        }
    }

    /**
     * GET /compressores/ - Lista todos os compressores
     * @param {boolean} ativoApenas - Filtrar apenas compressores ativos
     * @param {number} limit - Número máximo de registros (1-1000)
     */
    async getCompressores(ativoApenas = null, limit = 50) {
        try {
            let url = `${this.baseUrl}/compressores/`;
            const params = new URLSearchParams();
            
            if (ativoApenas !== null) {
                params.append('ativo_apenas', ativoApenas);
            }
            if (limit && limit !== 50) {
                params.append('limit', limit);
            }
            
            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`📊 Carregados ${data.total} compressores da API`);
            return data;
            
        } catch (error) {
            console.error('Erro ao buscar compressores:', error);
            throw error;
        }
    }

    /**
     * GET /compressores/{id} - Busca compressor específico
     * @param {number} id - ID do compressor
     */
    async getCompressor(id) {
        try {
            const response = await fetch(`${this.baseUrl}/compressores/${id}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Compressor ${id} não encontrado`);
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error(`Erro ao buscar compressor ${id}:`, error);
            throw error;
        }
    }

    /**
     * POST /compressores/ - Cadastra novo compressor
     * @param {Object} compressorData - Dados do compressor
     */
    async criarCompressor(compressorData) {
        try {
            const response = await fetch(`${this.baseUrl}/compressores/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(compressorData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ Compressor ${data.id_compressor} criado com sucesso`);
            return data;
            
        } catch (error) {
            console.error('Erro ao criar compressor:', error);
            throw error;
        }
    }

    /**
     * PUT /compressores/{id} - Atualiza compressor
     * @param {number} id - ID do compressor
     * @param {Object} updateData - Dados para atualizar
     */
    async atualizarCompressor(id, updateData) {
        try {
            const response = await fetch(`${this.baseUrl}/compressores/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ Compressor ${id} atualizado com sucesso`);
            return data;
            
        } catch (error) {
            console.error(`Erro ao atualizar compressor ${id}:`, error);
            throw error;
        }
    }

    /**
     * DELETE /compressores/{id} - Remove compressor
     * @param {number} id - ID do compressor
     */
    async deletarCompressor(id) {
        try {
            const response = await fetch(`${this.baseUrl}/compressores/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`🗑️ Compressor ${id} removido com sucesso`);
            return data;
            
        } catch (error) {
            console.error(`Erro ao deletar compressor ${id}:`, error);
            throw error;
        }
    }

    /**
     * GET /dados - Lista todos os dados de sensores
     */
    async getDados() {
        try {
            const response = await fetch(`${this.baseUrl}/dados`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Erro ao buscar dados de sensores:', error);
            throw error;
        }
    }

    /**
     * GET /dados/{id} - Busca dados de sensor específico
     * @param {number} compressorId - ID do compressor
     * @param {number} limit - Número máximo de registros
     */
    async getDadosTempoReal(compressorId, limit = 50) {
        try {
            const response = await fetch(`${this.baseUrl}/dados/${compressorId}?limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Dados para compressor ${compressorId} não encontrados`);
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error(`Erro ao buscar dados do compressor ${compressorId}:`, error);
            throw error;
        }
    }

    /**
     * POST /sensor - Envia dados do sensor
     * @param {Object} sensorData - Dados do sensor
     */
    async enviarDadosSensor(sensorData) {
        try {
            const response = await fetch(`${this.baseUrl}/sensor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(sensorData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`📊 Dados do sensor enviados para compressor ${sensorData.id_compressor}`);
            return data;
            
        } catch (error) {
            console.error('Erro ao enviar dados do sensor:', error);
            throw error;
        }
    }

    /**
     * GET /configuracoes/ - Busca configurações do sistema
     */
    async getConfiguracoes() {
        try {
            const response = await fetch(`${this.baseUrl}/configuracoes/`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            throw error;
        }
    }

    /**
     * GET /configuracoes/info - Informações do sistema
     */
    async getInfoSistema() {
        try {
            const response = await fetch(`${this.baseUrl}/configuracoes/info`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Erro ao buscar informações do sistema:', error);
            throw error;
        }
    }

    /**
     * Método utilitário para verificar se a API está online
     */
    get online() {
        return this.isOnline;
    }

    /**
     * Método para definir nova base URL (útil para desenvolvimento)
     */
    setBaseUrl(newUrl) {
        this.baseUrl = newUrl;
        this.isOnline = false; // Reset status
        console.log(`🔧 Base URL alterada para: ${newUrl}`);
    }
}

// Instância singleton do serviço
export const apiService = new ApiService();

// Exportar também a classe para casos específicos
export default ApiService;