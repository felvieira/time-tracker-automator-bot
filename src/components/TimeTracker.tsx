
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, Pause } from "lucide-react";

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

interface TimeTrackerProps {
  projectsData: ProjectData[];
  apiKey: string;
  baseUrl: string;
}

const TimeTracker = ({ projectsData, apiKey, baseUrl }: TimeTrackerProps) => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [currentTimeEntry, setCurrentTimeEntry] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && currentTimeEntry) {
      interval = setInterval(() => {
        const startTime = new Date(currentTimeEntry.timeInterval.start).getTime();
        const now = new Date().getTime();
        setElapsedTime(now - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, currentTimeEntry]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startTimer = async () => {
    if (!selectedProject || !description.trim()) {
      toast({
        title: "Erro",
        description: "Selecione um projeto e adicione uma descrição",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const workspaceId = projectsData[0]?.client.workspaceId;
      const response = await fetch(`${baseUrl}/workspaces/${workspaceId}/time-entries`, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: new Date().toISOString(),
          projectId: selectedProject,
          description: description,
          billable: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar timer');
      }

      const timeEntry = await response.json();
      setCurrentTimeEntry(timeEntry);
      setIsTimerRunning(true);
      setElapsedTime(0);

      toast({
        title: "Timer Iniciado",
        description: "O timer foi iniciado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao iniciar timer:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o timer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopTimer = async () => {
    if (!currentTimeEntry) return;

    setIsLoading(true);
    try {
      const workspaceId = projectsData[0]?.client.workspaceId;
      const response = await fetch(`${baseUrl}/workspaces/${workspaceId}/time-entries/${currentTimeEntry.id}`, {
        method: 'PATCH',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          end: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao parar timer');
      }

      setIsTimerRunning(false);
      setCurrentTimeEntry(null);
      setElapsedTime(0);
      setDescription('');

      toast({
        title: "Timer Parado",
        description: `Entrada de tempo salva: ${formatTime(elapsedTime)}`,
      });
    } catch (error) {
      console.error('Erro ao parar timer:', error);
      toast({
        title: "Erro",
        description: "Não foi possível parar o timer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="text-green-600" size={24} />
          Controle de Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-6xl font-mono font-bold text-gray-900 mb-4">
            {formatTime(elapsedTime)}
          </div>
          <div className="space-x-4">
            {!isTimerRunning ? (
              <Button 
                onClick={startTimer}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg"
              >
                <Play size={20} className="mr-2" />
                Iniciar Timer
              </Button>
            ) : (
              <Button 
                onClick={stopTimer}
                disabled={isLoading}
                variant="destructive"
                className="px-8 py-3 text-lg"
              >
                <Square size={20} className="mr-2" />
                Parar Timer
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="timer-project">Projeto</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject} disabled={isTimerRunning}>
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
            <Label htmlFor="timer-description">Descrição</Label>
            <Textarea
              id="timer-description"
              placeholder="O que você está fazendo?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isTimerRunning}
              rows={2}
            />
          </div>
        </div>

        {isTimerRunning && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">Timer ativo para:</p>
            <p className="text-green-700">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeTracker;
