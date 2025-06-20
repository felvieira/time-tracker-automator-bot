
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Calendar, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface TimeEntriesProps {
  apiKey: string;
  baseUrl: string;
  projectsData: ProjectData[];
}

const TimeEntries = ({ apiKey, baseUrl, projectsData }: TimeEntriesProps) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalHours, setTotalHours] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    loadTimeEntries();
  }, [startDate, endDate]);

  const loadTimeEntries = async () => {
    if (!projectsData.length) return;

    setIsLoading(true);
    try {
      const workspaceId = projectsData[0]?.client.workspaceId;
      const userId = await getCurrentUser();
      
      if (!userId) return;

      const response = await fetch(
        `${baseUrl}/workspaces/${workspaceId}/user/${userId}/time-entries?start=${startDate}T00:00:00.000Z&end=${endDate}T23:59:59.999Z`,
        {
          headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar entradas de tempo');
      }

      const entries = await response.json();
      setTimeEntries(entries);

      // Calcular total de horas
      const total = entries.reduce((acc: number, entry: TimeEntry) => {
        const duration = parseDuration(entry.timeInterval.duration);
        return acc + duration;
      }, 0);
      setTotalHours(total);

    } catch (error) {
      console.error('Erro ao carregar entradas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as entradas de tempo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUser = async () => {
    try {
      const response = await fetch(`${baseUrl}/user`, {
        headers: {
          'X-Api-Key': apiKey,
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

  const parseDuration = (duration: string): number => {
    // Formato: PT8H30M ou PT1H45M30S
    const hours = duration.match(/(\d+)H/);
    const minutes = duration.match(/(\d+)M/);
    const seconds = duration.match(/(\d+)S/);
    
    let totalHours = 0;
    if (hours) totalHours += parseInt(hours[1]);
    if (minutes) totalHours += parseInt(minutes[1]) / 60;
    if (seconds) totalHours += parseInt(seconds[1]) / 3600;
    
    return totalHours;
  };

  const formatDuration = (duration: string): string => {
    const totalHours = parseDuration(duration);
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const deleteTimeEntry = async (entryId: string) => {
    try {
      const workspaceId = projectsData[0]?.client.workspaceId;
      const response = await fetch(`${baseUrl}/workspaces/${workspaceId}/time-entries/${entryId}`, {
        method: 'DELETE',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Entrada de tempo excluída com sucesso",
        });
        loadTimeEntries();
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

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="text-purple-600" size={24} />
            Relatório de Horas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadTimeEntries} disabled={isLoading} className="w-full">
                {isLoading ? "Carregando..." : "Atualizar"}
              </Button>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-blue-900">Total de Horas:</span>
              <span className="text-2xl font-bold text-blue-700">{totalHours.toFixed(2)}h</span>
            </div>
          </div>

          <div className="space-y-3">
            {timeEntries.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhuma entrada de tempo encontrada no período selecionado
              </p>
            ) : (
              timeEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.project?.color || '#666' }}
                        />
                        <span className="font-medium text-gray-900">
                          {entry.project?.client?.name} - {entry.project?.name}
                        </span>
                        {entry.billable && (
                          <Badge variant="secondary" className="text-xs">
                            Faturável
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{entry.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(entry.timeInterval.start)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDuration(entry.timeInterval.duration)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTimeEntry(entry.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeEntries;
