import React from 'react';
import { Calendar, Clock, User, Building } from 'lucide-react';
import { SetorManager, type SectorData } from '../lib/hospitalData';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface RecordsProps {
  setorManager: SetorManager;
}

const Records: React.FC<RecordsProps> = ({ setorManager }) => {
  const todayRecords = setorManager.getTodayRecords();
  const stats = setorManager.getStatistics();

  const getStatusBadge = (status: string) => {
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
      <Badge className={colors[status as keyof typeof colors]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Registros do Dia</h1>
          <p className="text-muted-foreground">
            Acompanhamento das atividades de dedetização realizadas hoje
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atividades Hoje</p>
                <p className="text-2xl font-bold">{todayRecords.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold">
                  {todayRecords.filter(r => r.status === 'completed').length}
                </p>
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
                <p className="text-2xl font-bold">
                  {todayRecords.filter(r => r.status === 'in-progress').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progresso Geral</p>
                <p className="text-2xl font-bold">{stats.completionPercentage}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Records Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Atividades do Dia</h2>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {todayRecords.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhum registro hoje
              </h3>
              <p className="text-muted-foreground">
                As atividades de dedetização aparecerão aqui conforme forem executadas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Bloco</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Pavimento</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Setor</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Executor</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Responsável</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Início</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fim</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Duração</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayRecords
                    .sort((a, b) => {
                      const timeA = a.checkinTime ? new Date(a.checkinTime).getTime() : 0;
                      const timeB = b.checkinTime ? new Date(b.checkinTime).getTime() : 0;
                      return timeB - timeA; // Mais recente primeiro
                    })
                    .map((record, index) => (
                    <tr 
                      key={`${record.bloco}-${record.pavimento}-${record.setor}`}
                      className={`border-b border-border hover:bg-muted/50 ${
                        index % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                      }`}
                    >
                      <td className="py-3 px-4 font-medium">{record.bloco}</td>
                      <td className="py-3 px-4">{record.pavimento}</td>
                      <td className="py-3 px-4 font-medium">{record.setor}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {record.executor || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {record.responsavel || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {formatTime(record.checkinTime)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {formatTime(record.checkoutTime)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">
                          {formatDuration(record.duration)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(record.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Summary */}
        {todayRecords.length > 0 && (
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Resumo do Dia</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {todayRecords.filter(r => r.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Setores Concluídos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {todayRecords.filter(r => r.status === 'in-progress').length}
                </div>
                <div className="text-sm text-muted-foreground">Em Andamento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(
                    todayRecords
                      .filter(r => r.duration !== undefined)
                      .reduce((acc, r) => acc + (r.duration || 0), 0) / Math.max(1, todayRecords.filter(r => r.duration !== undefined).length)
                  )}min
                </div>
                <div className="text-sm text-muted-foreground">Tempo Médio por Setor</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Records;