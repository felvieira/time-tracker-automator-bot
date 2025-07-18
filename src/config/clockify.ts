// Função para obter configuração do localStorage ou usar padrões
const getConfigFromStorage = () => {
  try {
    const savedConfig = localStorage.getItem('clockify-config');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
  } catch (error) {
    console.error('Erro ao carregar configuração do localStorage:', error);
  }
  
  // Valores padrão vazios - usuário deve configurar
  return {
    apiKey: '',
    workspaceId: '',
    clientId: '',
    projectId: ''
  };
};

// Função para obter configuração atual (reactive)
export const getClockifyConfig = () => {
  const config = getConfigFromStorage();
  return {
    API_KEY: import.meta.env.VITE_CLOCKIFY_API_KEY || config.apiKey,
    BASE_URL: 'https://api.clockify.me/api/v1',
    WORKSPACE_ID: import.meta.env.VITE_CLOCKIFY_WORKSPACE_ID || config.workspaceId,
    CLIENT_ID: import.meta.env.VITE_CLOCKIFY_CLIENT_ID || config.clientId,
    PROJECT_ID: import.meta.env.VITE_CLOCKIFY_PROJECT_ID || config.projectId,
  };
};

// Configuração padrão para compatibilidade
export const CLOCKIFY_CONFIG = getClockifyConfig();