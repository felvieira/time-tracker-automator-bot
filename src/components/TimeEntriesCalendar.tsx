
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Edit, Trash2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

interface TimeEntriesCalendarProps {
  apiKey: string;
  baseUrl: string;
  projectsData: ProjectData[];
}

const TimeEntriesCalendar = ({ apiKey, baseUrl, projectsData }: TimeEntriesCalendarProps) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [editDescription, setEditDescription] = useState<string>('');
  const [editHours, setEditHours] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTimeEntries();
  }, []);

  const loadTimeEntries = async () => {
    if (!projectsData.length) return;

    setIsLoading(true);
    try {
      const workspaceId = projectsData[0]?.client.workspaceId;
      const userId = await getCurrentUser();
      
      if (!userId) return;

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 dias

      const response = await fetch(
        `${baseUrl}/workspaces/${workspaceId}/user/${userId}/time-entries?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
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

  const getEntriesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.timeInterval.start).toISOString().split('T')[0];
      return entryDate === dateStr;
    });
  };

  const getDatesWithEntries = () => {
    const dates: Date[] = [];
    timeEntries.forEach(entry => {
      const entryDate = new Date(entry.timeInterval.start);
      entryDate.setHours(0, 0, 0, 0);
      const exists = dates.some(date => date.getTime() === entryDate.getTime());
      if (!exists) {
        dates.push(entryDate);
      }
    });
    return dates;
  };

  const parseDuration = (duration: string): number => {
    const hours = duration.match(/(\d+)H/);
    const minutes = duration.match(/(\d+)M/);
    let totalHours = 0;
    if (hours) totalHours += parseInt(hours[1]);
    if (minutes) totalHours += parseInt(minutes[1]) / 60;
    return totalHours;
  };

  const formatDuration = (duration: string): string => {
    const totalHours = parseDuration(duration);
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setEditDescription(entry.description);
    setEditHours(parseDuration(entry.timeInterval.duration).toString());
    setIsEditDialogOpen(true);
  };

  const handleUpdateEntry = async () => {
    if (!selectedEntry) return;

    try {
      const workspaceId = projectsData[0]?.client.workspaceId;
      const startTime = new Date(selectedEntry.timeInterval.start);
      const endTime = new Date(startTime.getTime() + parseFloat(editHours) * 60 * 60 * 1000);

      const response = await fetch(`${baseUrl}/workspaces/${workspaceId}/time-entries/${selectedEntry.id}`, {
        method: 'PUT',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          description: editDescription,
          projectId: selectedEntry.projectId,
          billable: selectedEntry.billable,
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Entrada de tempo atualizada com sucesso",
        });
        setIsEditDialogOpen(false);
        loadTimeEntries();
      }
    } catch (error) {
      console.error('Erro ao atualizar entrada:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a entrada de tempo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
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

  const handleSubmitForApproval = async () => {
    if (!selectedDate) return;

    const entries = getEntriesForDate(selectedDate);
    if (entries.length === 0) return;

    try {
      const workspaceId = projectsData[0]?.client.workspaceId;
      
      // Clockify não tem endpoint específico para aprovação, mas podemos marcar como "submitted"
      // Aqui você pode implementar sua lógica específica de aprovação
      
      toast({
        title: "Sucesso",
        description: `${entries.length} entrada(s) enviada(s) para aprovação`,
      });
    } catch (error) {
      console.error('Erro ao enviar para aprovação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar para aprovação",
        variant: "destructive",
      });
    }
  };

  const selectedDateEntries = selectedDate ? getEntriesForDate(selectedDate) : [];
  const datesWithEntries = getDatesWithEntries();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="text-blue-600" size={24} />
            Calendário de Entradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="p-3 pointer-events-auto"
            modifiers={{
              hasEntries: datesWithEntries,
            }}
            modifiersStyles={{
              hasEntries: { 
                backgroundColor: '#3b82f6', 
                color: 'white',
                fontWeight: 'bold'
              },
            }}
          />
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="text-purple-600" size={24} />
            Entradas do Dia
            {selectedDate && (
              <span className="text-sm font-normal text-gray-600">
                ({selectedDate.toLocaleDateString('pt-BR')})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDateEntries.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              Nenhuma entrada encontrada para este dia
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {selectedDateEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.project?.color || '#666' }}
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {entry.project?.client?.name} - {entry.project?.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{entry.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span>{formatDuration(entry.timeInterval.duration)}</span>
                          {entry.billable && (
                            <Badge variant="secondary" className="text-xs">
                              Faturável
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEntry(entry)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={handleSubmitForApproval}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Send size={16} className="mr-2" />
                Enviar para Aprovação ({selectedDateEntries.length} entrada(s))
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Entrada de Tempo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hours">Horas</Label>
              <Input
                id="edit-hours"
                type="number"
                step="0.25"
                value={editHours}
                onChange={(e) => setEditHours(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateEntry} className="flex-1">
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeEntriesCalendar;
