
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Play, Square, BarChart3, Users, FolderOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectsList from "@/components/ProjectsList";
import TimeTracker from "@/components/TimeTracker";
import TimeEntries from "@/components/TimeEntries";

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

const Index = () => {
  const [projectsData, setProjectsData] = useState<ProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [hours, setHours] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const { toast } = useToast();

  const API_KEY = 'ZmU5NzVlMDMtNDkzMC00ZDJhLTk1MjUtY2U2MzM4NTU1NTM2';
  const BASE_URL = 'https://api.clockify.me/api/v1';

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/workspaces`, {
        headers: {
          'X-Api-Key': API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar workspace');
      }

      const workspaces = await response.json();
      const workspaceId = workspaces[0]?.id;

      if (workspaceId) {
        const projectsResponse = await fetch(`${BASE_URL}/workspaces/${workspaceId}/projects`, {
          headers: {
            'X-Api-Key': API_KEY,
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

  const handleCreateTimeEntry = async () => {
    if (!selectedProject || !description || !hours) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const workspaceId = projectsData[0]?.client.workspaceId;
      const startTime = new Date(`${date}T09:00:00.000Z`).toISOString();
      const endTime = new Date(new Date(`${date}T09:00:00.000Z`).getTime() + parseFloat(hours) * 60 * 60 * 1000).toISOString();

      const response = await fetch(`${BASE_URL}/workspaces/${workspaceId}/time-entries`, {
        method: 'POST',
        headers: {
          'X-Api-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: startTime,
          end: endTime,
          projectId: selectedProject,
          description: description,
          billable: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar entrada de tempo');
      }

      toast({
        title: "Sucesso",
        description: `Entrada de ${hours}h criada com sucesso!`,
      });

      // Limpar formulário
      setDescription('');
      setHours('');
    } catch (error) {
      console.error('Erro ao criar entrada:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a entrada de tempo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Clock className="text-blue-600" size={40} />
            Clockify Automator
          </h1>
          <p className="text-xl text-gray-600">Automatize o lançamento de horas no Clockify</p>
        </div>

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
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracker">
            <TimeTracker 
              projectsData={projectsData}
              apiKey={API_KEY}
              baseUrl={BASE_URL}
            />
          </TabsContent>

          <TabsContent value="manual">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="text-blue-600" size={24} />
                  Lançamento Manual de Horas
                </CardTitle>
                <CardDescription>
                  Registre suas horas trabalhadas manualmente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
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
                  <Label htmlFor="hours">Horas Trabalhadas *</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    placeholder="Ex: 8.5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleCreateTimeEntry}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isLoading ? "Criando..." : "Lançar Horas"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsList projectsData={projectsData} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="entries">
            <TimeEntries 
              apiKey={API_KEY}
              baseUrl={BASE_URL}
              projectsData={projectsData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
