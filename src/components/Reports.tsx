import React, { useState, useMemo } from 'react';
import { Search, Download, Filter, Calendar, Building, User, FileText, Image } from 'lucide-react';
import { SetorManager, type SectorData, type SectorStatus, hospitalData } from '../lib/hospitalData';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import ImageViewer from './ImageViewer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedSectorImages, setSelectedSectorImages] = useState<{
    images: string[];
    sectorInfo: { bloco: string; pavimento: string; setor: string };
  } | null>(null);

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

  const exportToPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(30, 64, 175); // Primary blue
    pdf.text('Relatório de Dedetização', 20, yPosition);
    yPosition += 8;

    pdf.setFontSize(14);
    pdf.setTextColor(100, 116, 139); // Muted color
    pdf.text('Complexo Hospitalar - Sistema de Controle', 20, yPosition);
    yPosition += 15;

    // Summary section
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const stats = {
      total: filteredRecords.length,
      completed: filteredRecords.filter(r => r.status === 'completed').length,
      inProgress: filteredRecords.filter(r => r.status === 'in-progress').length,
      pending: filteredRecords.filter(r => r.status === 'pending').length
    };

    pdf.text(`Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Total de Registros: ${stats.total}`, 20, yPosition);
    pdf.text(`Concluídos: ${stats.completed}`, 70, yPosition);
    pdf.text(`Em Andamento: ${stats.inProgress}`, 120, yPosition);
    pdf.text(`Pendentes: ${stats.pending}`, 170, yPosition);
    yPosition += 15;

    // Table headers
    const headers = ['Bloco', 'Pavimento', 'Setor', 'Status', 'Executor', 'Data/Hora'];
    const colWidths = [25, 25, 40, 25, 35, 35];
    let xPosition = 20;

    pdf.setFillColor(245, 245, 245);
    pdf.rect(20, yPosition - 4, pageWidth - 40, 8, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    headers.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 10;

    // Table data
    for (const record of filteredRecords) {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      xPosition = 20;
      const rowData = [
        record.bloco,
        record.pavimento,
        record.setor.length > 15 ? record.setor.substring(0, 15) + '...' : record.setor,
        record.status === 'completed' ? 'Concluído' : 
        record.status === 'in-progress' ? 'Em And.' : 'Pendente',
        record.executor?.substring(0, 12) || '-',
        record.checkinTime ? new Date(record.checkinTime).toLocaleDateString('pt-BR') : '-'
      ];

      rowData.forEach((data, index) => {
        pdf.text(String(data), xPosition, yPosition);
        xPosition += colWidths[index];
      });

      // Add images if available
      if (record.photos && record.photos.length > 0) {
        yPosition += 6;
        let imageY = yPosition;
        const imageSize = 20;
        const imagesPerRow = Math.floor((pageWidth - 40) / (imageSize + 5));
        
        for (let i = 0; i < Math.min(record.photos.length, 6); i++) {
          if (yPosition > pageHeight - imageSize - 10) {
            pdf.addPage();
            yPosition = 20;
            imageY = yPosition;
          }

          const imageX = 20 + (i % imagesPerRow) * (imageSize + 5);
          if (i % imagesPerRow === 0 && i > 0) {
            imageY += imageSize + 5;
          }

          try {
            // Convert image to appropriate format for PDF
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = document.createElement('img');
            img.crossOrigin = 'anonymous';
            
            await new Promise<void>((resolve) => {
              img.onload = () => {
                canvas.width = 200;
                canvas.height = 200;
                ctx?.drawImage(img, 0, 0, 200, 200);
                const imgData = canvas.toDataURL('image/jpeg', 0.7);
                pdf.addImage(imgData, 'JPEG', imageX, imageY, imageSize, imageSize);
                resolve();
              };
              img.src = record.photos[i];
            });
          } catch (error) {
            console.warn('Error adding image to PDF:', error);
            // Add placeholder text instead
            pdf.setFontSize(8);
            pdf.text(`Img ${i + 1}`, imageX, imageY + imageSize / 2);
          }
        }
        
        if (record.photos.length > 6) {
          pdf.setFontSize(8);
          pdf.text(`+${record.photos.length - 6} mais imagens`, 20, imageY + imageSize + 8);
        }
        
        yPosition = imageY + imageSize + 10;
      } else {
        yPosition += 8;
      }
    }

    // Save PDF
    pdf.save(`relatorio-dedetizacao-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const viewSectorImages = (record: SectorData) => {
    if (record.photos && record.photos.length > 0) {
      setSelectedSectorImages({
        images: record.photos,
        sectorInfo: {
          bloco: record.bloco,
          pavimento: record.pavimento,
          setor: record.setor
        }
      });
      setImageViewerOpen(true);
    }
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
              <Button onClick={exportToPDF} variant="outline" className="no-print">
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
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
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Horário</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Imagens</th>
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
                        {record.checkinTime ? new Date(record.checkinTime).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {record.checkinTime ? new Date(record.checkinTime).toLocaleTimeString('pt-BR') : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {record.photos && record.photos.length > 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewSectorImages(record)}
                            className="flex items-center gap-1"
                          >
                            <Image className="w-4 h-4" />
                            {record.photos.length}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Image Viewer Modal */}
        {selectedSectorImages && (
          <ImageViewer
            isOpen={imageViewerOpen}
            onClose={() => {
              setImageViewerOpen(false);
              setSelectedSectorImages(null);
            }}
            images={selectedSectorImages.images}
            sectorInfo={selectedSectorImages.sectorInfo}
          />
        )}
      </div>
    </div>
  );
};

export default Reports;