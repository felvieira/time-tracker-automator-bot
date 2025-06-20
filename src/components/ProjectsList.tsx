
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Users, Clock } from "lucide-react";

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

interface ProjectsListProps {
  projectsData: ProjectData[];
  isLoading: boolean;
}

const ProjectsList = ({ projectsData, isLoading }: ProjectsListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="text-blue-600" size={24} />
            Projetos Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectsData.map((clientData) => (
              <div key={clientData.client.id} className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Users className="text-gray-600" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{clientData.client.name}</h3>
                    <p className="text-sm text-gray-600">{clientData.projectsCount} projeto(s)</p>
                  </div>
                </div>
                
                <div className="space-y-2 ml-4">
                  {clientData.projects.map((project) => (
                    <div key={project.id} className="flex items-center gap-2 p-2 border rounded-lg">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {project.billable && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock size={12} className="mr-1" />
                              Faturável
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectsList;
