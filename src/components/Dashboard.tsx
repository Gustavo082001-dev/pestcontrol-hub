import React, { useState, useEffect } from 'react';
import { Shield, Activity, CheckCircle, Clock, Users } from 'lucide-react';
import { SetorManager, type SectorData, hospitalData } from '../lib/hospitalData';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface DashboardProps {
  setorManager: SetorManager;
  onRefresh: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setorManager, onRefresh }) => {
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);
  const [executor, setExecutor] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [selectedBloco, setSelectedBloco] = useState('');
  const [selectedSetor, setSelectedSetor] = useState('');

  const stats = setorManager.getStatistics();
  const todayRecords = setorManager.getTodayRecords();

  useEffect(() => {
    // Load saved executor and responsavel from localStorage
    const savedExecutor = localStorage.getItem('pest-control-executor');
    const savedResponsavel = localStorage.getItem('pest-control-responsavel');
    if (savedExecutor) setExecutor(savedExecutor);
    if (savedResponsavel) setResponsavel(savedResponsavel);
  }, []);

  const handleExecutorChange = (value: string) => {
    setExecutor(value);
    localStorage.setItem('pest-control-executor', value);
  };

  const handleResponsavelChange = (value: string) => {
    setResponsavel(value);
    localStorage.setItem('pest-control-responsavel', value);
  };

  const handleSectorClick = (bloco: string, pavimento: string, setor: string) => {
    const sector = setorManager.getSector(bloco, pavimento, setor);
    setSelectedSector(sector || null);
    setSelectedBloco(bloco);
    setSelectedSetor(setor);
  };

  const handleAction = () => {
    if (!selectedSector || !executor || !responsavel) return;

    const { bloco, pavimento, setor, status } = selectedSector;

    if (status === 'pending') {
      setorManager.completeSetor(bloco, pavimento, setor, executor, responsavel);
    } else if (status === 'completed') {
      setorManager.resetSetor(bloco, pavimento, setor);
    }

    const updatedSector = setorManager.getSector(bloco, pavimento, setor);
    setSelectedSector(updatedSector || null);
    onRefresh();
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

  const getActionButton = () => {
    if (!selectedSector || !executor || !responsavel) {
      return (
        <Button disabled className="w-full">
          Selecione um setor e preencha os campos
        </Button>
      );
    }

    const { status } = selectedSector;

    if (status === 'pending') {
      return (
        <Button onClick={handleAction} className="w-full btn-success">
          <CheckCircle className="w-4 h-4 mr-2" />
          Marcar como Concluído
        </Button>
      );
    } else if (status === 'completed') {
      return (
        <Button onClick={handleAction} variant="outline" className="w-full">
          <Activity className="w-4 h-4 mr-2" />
          Reaplicar Dedetização
        </Button>
      );
    } else {
      return (
        <Button disabled className="w-full">
          Em andamento...
        </Button>
      );
    }
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Executor do Dia
              </label>
              <input
                type="text"
                value={executor}
                onChange={(e) => handleExecutorChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Nome do executor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Responsável do Setor
              </label>
              <input
                type="text"
                value={responsavel}
                onChange={(e) => handleResponsavelChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Nome do responsável"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
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
                                    ${isSelected ? 'ring-2 ring-primary' : ''}
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Panel */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Painel de Ações</h3>
              
              {selectedSector && (
                <div className="space-y-4 mb-6">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Setor Selecionado:</p>
                    <p className="font-medium">{selectedSector.setor}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSector.bloco} - {selectedSector.pavimento}
                    </p>
                    <div className="mt-2">
                      {getStatusBadge(selectedSector.status)}
                    </div>
                  </div>

                  {selectedSector.status === 'completed' && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Concluído em:</p>
                      <p className="text-sm text-green-700">
                        {selectedSector.checkoutTime && 
                          new Date(selectedSector.checkoutTime).toLocaleString('pt-BR')
                        }
                      </p>
                      {selectedSector.executor && (
                        <p className="text-sm text-green-700">
                          Executor: {selectedSector.executor}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {getActionButton()}
            </Card>

            {/* Today's Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Resumo do Dia</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Atividades hoje:</span>
                  <span className="font-semibold">{todayRecords.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Concluídos:</span>
                  <span className="font-semibold text-green-600">
                    {todayRecords.filter(r => r.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Em andamento:</span>
                  <span className="font-semibold text-blue-600">
                    {todayRecords.filter(r => r.status === 'in-progress').length}
                  </span>
                </div>
              </div>
            </Card>

            {/* Legend */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Legenda</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-orange-200 border border-orange-300 rounded"></div>
                  <span className="text-sm">Pendente</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-200 border border-blue-300 rounded"></div>
                  <span className="text-sm">Em Andamento</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-200 border border-green-300 rounded"></div>
                  <span className="text-sm">Concluído</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;