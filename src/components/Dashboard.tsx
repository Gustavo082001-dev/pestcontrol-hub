import React, { useState, useEffect } from 'react';
import { Shield, Activity, CheckCircle, Clock, Users } from 'lucide-react';
import { SetorManager, type SectorData, hospitalData } from '../lib/hospitalData';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import SectorModal from './SectorModal';

interface DashboardProps {
  setorManager: SetorManager;
  onRefresh: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setorManager, onRefresh }) => {
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stats = setorManager.getStatistics();
  const todayRecords = setorManager.getTodayRecords();

  const handleSectorClick = (bloco: string, pavimento: string, setor: string) => {
    const sector = setorManager.getSector(bloco, pavimento, setor);
    setSelectedSector(sector || null);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      'in-progress': 'default',
      completed: 'default'
    } as const;

    const colors = {
      pending: 'bg-orange-100 text-orange-800 border-orange-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200'
    };

    const labels = {
      pending: 'Pendente',
      'in-progress': 'Em Andamento',
      completed: 'Concluído'
    };

    return (
      <Badge 
        variant={variants[status as keyof typeof variants]} 
        className={colors[status as keyof typeof colors]}
      >
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sistema de Dedetização</h1>
              <p className="text-muted-foreground">Controle e Monitoramento Hospitalar</p>
            </div>
          </div>

        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Main Content */}
          <div>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Concluídos</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Em Andamento</p>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Progress Bar */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Progresso Geral</h3>
                <span className="text-2xl font-bold text-primary">{stats.completionPercentage}%</span>
              </div>
              <Progress value={stats.completionPercentage} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {stats.completed} de {stats.total} setores concluídos
              </p>
            </Card>

            {/* Hospital Map */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Mapa do Complexo Hospitalar</h3>
              <div className="space-y-6">
                {Object.entries(hospitalData).map(([bloco, pavimentos]) => (
                  <div key={bloco} className="border border-border rounded-lg p-4">
                    <h4 className="text-lg font-semibold mb-4 text-primary">{bloco}</h4>
                    <div className="space-y-4">
                      {Object.entries(pavimentos).map(([pavimento, setores]) => (
                        <div key={pavimento}>
                          <h5 className="font-medium text-foreground mb-2">{pavimento}</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {setores.map((setor) => {
                              const sectorData = setorManager.getSector(bloco, pavimento, setor);
                              const isSelected = selectedSector?.bloco === bloco && 
                                               selectedSector?.pavimento === pavimento && 
                                               selectedSector?.setor === setor;
                              
                              return (
                                 <button
                                   key={setor}
                                   onClick={() => handleSectorClick(bloco, pavimento, setor)}
                                   className={`
                                     sector-card text-left text-sm p-3 min-h-[60px] flex flex-col justify-between
                                     ${sectorData?.status || 'pending'}
                                     hover:opacity-80 transition-opacity
                                   `}
                                 >
                                  <span className="font-medium">{setor}</span>
                                  {getStatusBadge(sectorData?.status || 'pending')}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal do Setor */}
      <SectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sector={selectedSector}
        setorManager={setorManager}
        onUpdate={onRefresh}
      />
    </div>
  );
};

export default Dashboard;