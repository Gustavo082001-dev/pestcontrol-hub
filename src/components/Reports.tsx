import React, { useState, useMemo } from 'react';
import { Search, Download, Printer, Filter, Calendar, Building, User } from 'lucide-react';
import { SetorManager, type SectorData, type SectorStatus, hospitalData } from '../lib/hospitalData';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ReportsProps {
  setorManager: SetorManager;
}

interface FilterState {
  startDate: string;
  endDate: string;
  bloco: string;
  setor: string;
  executor: string;
  status: SectorStatus | '';
}

const Reports: React.FC<ReportsProps> = ({ setorManager }) => {
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    bloco: '',
    setor: '',
    executor: '',
    status: ''
  });

  const filteredRecords = useMemo(() => {
    return setorManager.getFilteredRecords({
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      bloco: filters.bloco || undefined,
      setor: filters.setor || undefined,
      executor: filters.executor || undefined,
      status: filters.status || undefined
    });
  }, [setorManager, filters]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      bloco: '',
      setor: '',
      executor: '',
      status: ''
    });
  };

  const exportToCSV = () => {
    const csvContent = setorManager.exportToCSV(filteredRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-dedetizacao-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Dedetização</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .status.completed { background-color: #dcfce7; color: #166534; }
            .status.in-progress { background-color: #dbeafe; color: #1e40af; }
            .status.pending { background-color: #fed7aa; color: #9a3412; }
            .summary { margin-bottom: 20px; }
            .summary-item { display: inline-block; margin-right: 30px; }
          </style>
        </head>
        <body>
          <h1>Relatório de Dedetização - Complexo Hospitalar</h1>
          
          <div class="summary">
            <div class="summary-item"><strong>Data do Relatório:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>
            <div class="summary-item"><strong>Total de Registros:</strong> ${filteredRecords.length}</div>
            <div class="summary-item"><strong>Concluídos:</strong> ${filteredRecords.filter(r => r.status === 'completed').length}</div>
            <div class="summary-item"><strong>Em Andamento:</strong> ${filteredRecords.filter(r => r.status === 'in-progress').length}</div>
            <div class="summary-item"><strong>Pendentes:</strong> ${filteredRecords.filter(r => r.status === 'pending').length}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Bloco</th>
                <th>Pavimento</th>
                <th>Setor</th>
                <th>Status</th>
                <th>Executor</th>
                <th>Responsável</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Duração</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRecords.map(record => `
                <tr>
                  <td>${record.bloco}</td>
                  <td>${record.pavimento}</td>
                  <td>${record.setor}</td>
                  <td><span class="status ${record.status}">${
                    record.status === 'completed' ? 'Concluído' :
                    record.status === 'in-progress' ? 'Em Andamento' : 'Pendente'
                  }</span></td>
                  <td>${record.executor || '-'}</td>
                  <td>${record.responsavel || '-'}</td>
                  <td>${record.checkinTime ? new Date(record.checkinTime).toLocaleString('pt-BR') : '-'}</td>
                  <td>${record.checkoutTime ? new Date(record.checkoutTime).toLocaleString('pt-BR') : '-'}</td>
                  <td>${record.duration ? `${record.duration}min` : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

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

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
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

  const blocosOptions = Object.keys(hospitalData);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise detalhada das atividades de dedetização
          </p>
        </div>

        {/* Filters Panel */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data de Início
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data de Fim
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Building className="w-4 h-4 inline mr-1" />
                Bloco
              </label>
              <select
                value={filters.bloco}
                onChange={(e) => handleFilterChange('bloco', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Todos os Blocos</option>
                {blocosOptions.map(bloco => (
                  <option key={bloco} value={bloco}>{bloco}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Nome do Setor
              </label>
              <input
                type="text"
                value={filters.setor}
                onChange={(e) => handleFilterChange('setor', e.target.value)}
                placeholder="Buscar por setor..."
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Executor
              </label>
              <input
                type="text"
                value={filters.executor}
                onChange={(e) => handleFilterChange('executor', e.target.value)}
                placeholder="Buscar por executor..."
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Todos os Status</option>
                <option value="pending">Pendente</option>
                <option value="in-progress">Em Andamento</option>
                <option value="completed">Concluído</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={clearFilters} variant="outline">
              Limpar Filtros
            </Button>
          </div>
        </Card>

        {/* Results */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Resultados</h2>
              <p className="text-sm text-muted-foreground">
                {filteredRecords.length} registro(s) encontrado(s)
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" className="no-print">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button onClick={printReport} variant="outline" className="no-print">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-primary">{filteredRecords.length}</div>
              <div className="text-sm text-muted-foreground">Total de Registros</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {filteredRecords.filter(r => r.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Concluídos</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {filteredRecords.filter(r => r.status === 'in-progress').length}
              </div>
              <div className="text-sm text-muted-foreground">Em Andamento</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {filteredRecords.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </div>
          </div>

          {/* Results Table */}
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhum registro encontrado
              </h3>
              <p className="text-muted-foreground">
                Ajuste os filtros para encontrar os registros desejados.
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
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Executor</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Responsável</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Início</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fim</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords
                    .sort((a, b) => {
                      const timeA = a.checkinTime ? new Date(a.checkinTime).getTime() : 0;
                      const timeB = b.checkinTime ? new Date(b.checkinTime).getTime() : 0;
                      return timeB - timeA;
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
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="py-3 px-4">{record.executor || '-'}</td>
                      <td className="py-3 px-4">{record.responsavel || '-'}</td>
                      <td className="py-3 px-4 text-sm">
                        {formatDateTime(record.checkinTime)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatDateTime(record.checkoutTime)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">
                          {formatDuration(record.duration)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Reports;