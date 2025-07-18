import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConfigData {
  apiKey: string;
  workspaceId: string;
  clientId: string;
  projectId: string;
}

const ConfigDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfigData>({
    apiKey: '',
    workspaceId: '',
    clientId: '',
    projectId: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    const savedConfig = localStorage.getItem('clockify-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      }
    } else {
      // Usar valores padrão vazios - usuário deve configurar
      setConfig({
        apiKey: '',
        workspaceId: '',
        clientId: '',
        projectId: ''
      });
    }
  };

  const handleSave = () => {
    if (!config.apiKey.trim()) {
      toast({
        title: "Erro",
        description: "API Key é obrigatória",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('clockify-config', JSON.stringify(config));
    
    toast({
      title: "Sucesso",
      description: "Configurações salvas com sucesso! Recarregue a página para aplicar as mudanças.",
    });
    
    setIsOpen(false);
    
    // Disparar evento customizado para notificar outros componentes
    window.dispatchEvent(new CustomEvent('clockify-config-updated'));
  };

  const handleReset = () => {
    const defaultConfig = {
      apiKey: '',
      workspaceId: '',
      clientId: '',
      projectId: ''
    };
    setConfig(defaultConfig);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings size={16} />
          Configurações
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações do Clockify</DialogTitle>
          <p className="text-sm text-gray-600">
            Configure sua API key do Clockify para começar a usar a aplicação.
            <br />
            <a 
              href="https://clockify.me/user/settings" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Obtenha sua API key aqui →
            </a>
          </p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <Input
              id="apiKey"
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="Sua API Key do Clockify"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="workspaceId">Workspace ID</Label>
            <Input
              id="workspaceId"
              value={config.workspaceId}
              onChange={(e) => setConfig({ ...config, workspaceId: e.target.value })}
              placeholder="ID do Workspace"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              value={config.clientId}
              onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              placeholder="ID do Cliente"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="projectId">Project ID</Label>
            <Input
              id="projectId"
              value={config.projectId}
              onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
              placeholder="ID do Projeto"
            />
          </div>
          
          <div className="flex justify-between gap-2 pt-4">
            <Button variant="outline" onClick={handleReset}>
              Resetar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigDialog;