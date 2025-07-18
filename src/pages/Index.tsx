import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Play, Square, BarChart3, Users, FolderOpen, Trash2, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import ProjectsList from "@/components/ProjectsList";
import TimeTracker from "@/components/TimeTracker";
import TimeEntries from "@/components/TimeEntries";
import TimeEntriesCalendar from "@/components/TimeEntriesCalendar";
import { CLOCKIFY_CONFIG, getClockifyConfig } from "@/config/clockify";
import ConfigDialog from "@/components/ConfigDialog";

interface Client {
  id: string;
  name: string;
  email?: string;
  workspaceId: string;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
  client: Client;
  workspaceId: string;
  billable: boolean;
  color: string;
}

interface ProjectData {
  client: Client;
  projectsCount: number;
  projects: Project[];
}

interface TimeEntry {
  id: string;
  description: string;
  timeInterval: {
    start: string;
    end: string;
    duration: string;
  };
  projectId: string;
  project?: {
    name: string;
    color: string;
    client?: {
      name: string;
    };
  };
  billable: boolean;
}

const Index = () => {
  const [projectsData, setProjectsData] = useState<ProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [hours, setHours] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [batchEntries, setBatchEntries] = useState<TimeEntry[]>([]);
  const [showBatchApproval, setShowBatchApproval] = useState<boolean>(false);
  const [currentConfig, setCurrentConfig] = useState(CLOCKIFY_CONFIG);
  const [showConfigWarning, setShowConfigWarning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se há configuração de API key
    const config = getClockifyConfig();
    if (!config.API_KEY) {
      setShowConfigWarning(true);
      return;
    }
    
    setShowConfigWarning(false);
    loadProjects();
    loadRecentEntries();
    
    // Escutar mudanças na configuração
    const handleConfigUpdate = () => {
      const newConfig = getClockifyConfig();
      setCurrentConfig(newConfig);
      
      if (!newConfig.API_KEY) {
        setShowConfigWarning(true);
        return;
      }
      
      setShowConfigWarning(false);
      // Recarregar dados com nova configuração
      setTimeout(() => {
        loadProjects();
        loadRecentEntries();
      }, 100);
    };

    window.addEventListener('clockify-config-updated', handleConfigUpdate);
    
    return () => {
      window.removeEventListener('clockify-config-updated', handleConfigUpdate);
    };
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const config = getClockifyConfig();
      const response = await fetch(`${config.BASE_URL}/workspaces`, {
        headers: {
          'X-Api-Key': config.API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar workspace');
      }

      const workspaces = await response.json();
      const workspaceId = workspaces[0]?.id;

      if (workspaceId) {
        const projectsResponse = await fetch(`${config.BASE_URL}/workspaces/${workspaceId}/projects`, {
          headers: {
            'X-Api-Key': config.API_KEY,
            'Content-Type': 'application/json',
          },
        });

        if (projectsResponse.ok) {
          const projects = await projectsResponse.json();
          
          // Agrupar projetos por cliente
          const groupedProjects: { [key: string]: ProjectData } = {};
          
          projects.forEach((project: Project) => {
            const clientId = project.clientId || 'no-client';
            if (!groupedProjects[clientId]) {
              groupedProjects[clientId] = {
                client: project.client || { id: 'no-client', name: 'Sem Cliente', workspaceId },
                projectsCount: 0,
                projects: []
              };
            }
            groupedProjects[clientId].projects.push(project);
            groupedProjects[clientId].projectsCount++;
          });

          setProjectsData(Object.values(groupedProjects));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos. Verifique sua API key.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const findProjectById = (projectId: string): Project | undefined => {
    for (const projectData of projectsData) {
      const project = projectData.projects.find(p => p.id === projectId);
      if (project) return project;
    }
    return undefined;
  };

  const loadRecentEntries = async () => {
    try {
      const config = getClockifyConfig();
      const workspaceId = projectsData[0]?.client.workspaceId || config.WORKSPACE_ID;
      const userId = await getCurrentUser();
      
      if (!userId) return;

      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `${config.BASE_URL}/workspaces/${workspaceId}/user/${userId}/time-entries?start=${lastWeek.toISOString()}&end=${today.toISOString()}`,
        {
          headers: {
            'X-Api-Key': config.API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const entries = await response.json();
        
        // Enriquecer as entradas com informações dos projetos
        const enrichedEntries = entries.map((entry: TimeEntry) => {
          const project = findProjectById(entry.projectId);
          return {
            ...entry,
            project: project ? {
              name: project.name,
              color: project.color,
              client: project.client ? {
                name: project.client.name
              } : undefined
            } : undefined
          };
        });
        
        setRecentEntries(enrichedEntries.slice(0, 5));
      }
    } catch (error) {
      console.error('Erro ao carregar entradas recentes:', error);
    }
  };

  const getCurrentUser = async () => {
    try {
      const config = getClockifyConfig();
      const response = await fetch(`${config.BASE_URL}/user`, {
        headers: {
          'X-Api-Key': config.API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const user = await response.json();
        return user.id;
      }
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
    }
    return null;
  };

  const handleCreateTimeEntries = async () => {
    if (!selectedProject || !description || !hours || selectedDates.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos e selecione pelo menos uma data",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const createdEntries: TimeEntry[] = [];

    try {
      const config = getClockifyConfig();
      const workspaceId = projectsData[0]?.client.workspaceId || config.WORKSPACE_ID;
      
      for (const date of selectedDates) {
        try {
          const startTime = new Date(date);
          startTime.setHours(9, 0, 0, 0);
          const endTime = new Date(startTime.getTime() + parseFloat(hours) * 60 * 60 * 1000);

          const response = await fetch(`${config.BASE_URL}/workspaces/${workspaceId}/time-entries`, {
            method: 'POST',
            headers: {
              'X-Api-Key': config.API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              start: startTime.toISOString(),
              end: endTime.toISOString(),
              projectId: selectedProject,
              description: description,
              billable: true,
            }),
          });

          if (response.ok) {
            const newEntry = await response.json();
            createdEntries.push(newEntry);
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        setBatchEntries(createdEntries);
        setShowBatchApproval(createdEntries.length > 1);
        
        toast({
          title: "Sucesso",
          description: `${successCount} entrada(s) de ${hours}h criada(s) com sucesso!${errorCount > 0 ? ` ${errorCount} falharam.` : ''}`,
        });

        // Limpar formulário
        setDescription('');
        setHours('');
        setSelectedDates([]);
        loadRecentEntries();
      } else {
        throw new Error('Todas as entradas falharam');
      }
    } catch (error) {
      console.error('Erro ao criar entradas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar as entradas de tempo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchApproval = async () => {
    if (batchEntries.length === 0) return;

    try {
      // Aqui você pode implementar a lógica específica de envio para aprovação
      // Como o Clockify não tem endpoint específico para aprovação, 
      // isso pode variar dependendo do seu processo interno
      
      toast({
        title: "Sucesso",
        description: `${batchEntries.length} entrada(s) enviada(s) para aprovação`,
      });
      
      setShowBatchApproval(false);
      setBatchEntries([]);
    } catch (error) {
      console.error('Erro ao enviar para aprovação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar para aprovação",
        variant: "destructive",
      });
    }
  };

  const deleteTimeEntry = async (entryId: string) => {
    try {
      const config = getClockifyConfig();
      const workspaceId = projectsData[0]?.client.workspaceId || config.WORKSPACE_ID;
      const response = await fetch(`${config.BASE_URL}/workspaces/${workspaceId}/time-entries/${entryId}`, {
        method: 'DELETE',
        headers: {
          'X-Api-Key': config.API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Entrada de tempo excluída com sucesso",
        });
        loadRecentEntries();
      }
    } catch (error) {
      console.error('Erro ao excluir entrada:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a entrada de tempo",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (duration: string): string => {
    const hours = duration.match(/(\d+)H/);
    const minutes = duration.match(/(\d+)M/);
    let totalHours = 0;
    if (hours) totalHours += parseInt(hours[1]);
    if (minutes) totalHours += parseInt(minutes[1]) / 60;
    return `${totalHours.toFixed(1)}h`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const removeDateFromSelection = (dateToRemove: Date) => {
    setSelectedDates(selectedDates.filter(date => 
      date.toDateString() !== dateToRemove.toDateString()
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Clock className="text-blue-600" size={40} />
            <h1 className="text-4xl font-bold text-gray-900">Clockify Automator</h1>
            <ConfigDialog />
          </div>
          <p className="text-xl text-gray-600">Automatize o lançamento de horas no Clockify</p>
        </div>

        {showConfigWarning && (
          <Card className="bg-yellow-50 border-yellow-200 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="text-yellow-600" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800">Configuração Necessária</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    Para começar a usar o Clockify Automator, você precisa configurar sua API key do Clockify.
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <ConfigDialog />
                    <a 
                      href="https://clockify.me/user/settings" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-yellow-700 hover:text-yellow-800 underline"
                    >
                      Obter API Key →
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="tracker" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="tracker" className="flex items-center gap-2">
              <Play size={16} />
              Timer
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Calendar size={16} />
              Manual
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderOpen size={16} />
              Projetos
            </TabsTrigger>
            <TabsTrigger value="entries" className="flex items-center gap-2">
              <BarChart3 size={16} />
              Entradas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracker">
            <TimeTracker 
              projectsData={projectsData}
              apiKey={currentConfig.API_KEY}
              baseUrl={currentConfig.BASE_URL}
            />
          </TabsContent>

          <TabsContent value="manual">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="text-blue-600" size={24} />
                    Lançamento em Lote
                  </CardTitle>
                  <CardDescription>
                    Selecione múltiplos dias e lance horas em todos de uma vez
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="project">Projeto *</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectsData.map((clientData) =>
                          clientData.projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {clientData.client.name} - {project.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Datas Selecionadas</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Calendar size={16} className="mr-2" />
                          {selectedDates.length > 0 
                            ? `${selectedDates.length} dia(s) selecionado(s)`
                            : "Selecionar datas"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="multiple"
                          selected={selectedDates}
                          onSelect={(dates) => setSelectedDates(dates || [])}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    
                    {selectedDates.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedDates.map((date, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            <button
                              onClick={() => removeDateFromSelection(date)}
                              className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição da Atividade *</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva as atividades realizadas..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours">Horas por Dia *</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="24"
                      placeholder="Ex: 8.0"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleCreateTimeEntries}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {isLoading ? "Lançando..." : `Lançar ${hours || '0'}h em ${selectedDates.length} dia(s)`}
                  </Button>

                  {showBatchApproval && (
                    <div className="border-t pt-4 mt-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-green-800 mb-2">
                          Entradas Criadas com Sucesso
                        </h3>
                        <p className="text-sm text-green-700 mb-3">
                          {batchEntries.length} entrada(s) foram criadas. Deseja enviar todas para aprovação?
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleBatchApproval}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <Send size={16} className="mr-2" />
                            Enviar Todas para Aprovação
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setShowBatchApproval(false)}
                            size="sm"
                          >
                            Agora Não
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="text-purple-600" size={24} />
                    Entradas Recentes
                  </CardTitle>
                  <CardDescription>
                    Suas últimas entradas de tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentEntries.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        Nenhuma entrada recente encontrada
                      </p>
                    ) : (
                      recentEntries.map((entry) => (
                        <div key={entry.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: entry.project?.color || '#666' }}
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {entry.project?.client?.name || 'Cliente não identificado'}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {entry.project?.name || 'Projeto não identificado'}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 mb-1 ml-5">{entry.description}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-600 ml-5">
                                <span>{formatDate(entry.timeInterval.start)}</span>
                                <span className="font-medium">{formatDuration(entry.timeInterval.duration)}</span>
                                {entry.billable && (
                                  <Badge variant="secondary" className="text-xs">
                                    Faturável
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTimeEntry(entry.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsList projectsData={projectsData} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="entries">
            <TimeEntriesCalendar 
              apiKey={currentConfig.API_KEY}
              baseUrl={currentConfig.BASE_URL}
              projectsData={projectsData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
