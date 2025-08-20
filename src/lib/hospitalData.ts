export const hospitalData = {
  'BLOCO A': {
    'Térreo': ['Consultórios', 'Laboratório de Marcha', 'Posto de Enfermagem', 'Odontologia', 'Elevadores e Rampas'],
    '1º Pavimento': ['UTI'],
    '2º Pavimento': ['Enfermaria Clínica', 'Quarto de Plantão', 'Rouparia', 'Elevadores e Rampas'],
    '3º Pavimento': ['Centro Cirúrgico', 'RPA', 'CME', 'Elevadores e Rampas'],
    '4º Pavimento': ['Maternidade', 'Centro Obstétrico', 'Berçário', 'Alojamento Conjunto', 'Elevadores e Rampas']
  },
  'BLOCO B': {
    'Térreo': ['Recepção', 'Farmácia', 'Laboratório', 'Radiologia', 'Tomografia', 'Ultrassom', 'Elevadores e Escadas'],
    '1º Pavimento': ['Administração', 'RH', 'Financeiro', 'Diretoria', 'Sala de Reuniões', 'Elevadores e Escadas'],
    '2º Pavimento': ['Pediatria', 'UTI Pediátrica', 'Brinquedoteca', 'Elevadores e Escadas'],
    '3º Pavimento': ['Ortopedia', 'Fisioterapia', 'Terapia Ocupacional', 'Elevadores e Escadas']
  },
  'BLOCO C': {
    'Térreo': ['Emergência', 'Pronto Socorro', 'Triagem', 'Observação', 'Medicação', 'Elevadores e Escadas'],
    '1º Pavimento': ['Cardiologia', 'Neurologia', 'Oncologia', 'Elevadores e Escadas'],
    '2º Pavimento': ['Hemodiálise', 'Quimioterapia', 'Hospital Dia', 'Elevadores e Escadas']
  },
  'ANEXO': {
    'Térreo': ['Lavanderia', 'Cozinha', 'Refeitório', 'Almoxarifado', 'Manutenção'],
    '1º Pavimento': ['Auditório', 'Biblioteca', 'Sala de Treinamento', 'Vestiários']
  }
};

export type SectorStatus = 'pending' | 'in-progress' | 'completed';

export interface SectorData {
  bloco: string;
  pavimento: string;
  setor: string;
  status: SectorStatus;
  checkinTime?: string;
  checkoutTime?: string;
  executor?: string;
  responsavel?: string;
  duration?: number; // em minutos
}

export interface Statistics {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionPercentage: number;
}

export class SetorManager {
  private sectors: Map<string, SectorData> = new Map();
  private storageKey = 'hospital-pest-control-data';

  constructor() {
    this.initializeSectors();
    this.loadFromStorage();
  }

  private initializeSectors(): void {
    Object.entries(hospitalData).forEach(([bloco, pavimentos]) => {
      Object.entries(pavimentos).forEach(([pavimento, setores]) => {
        setores.forEach((setor) => {
          const key = this.getSectorKey(bloco, pavimento, setor);
          this.sectors.set(key, {
            bloco,
            pavimento,
            setor,
            status: 'pending'
          });
        });
      });
    });
  }

  private getSectorKey(bloco: string, pavimento: string, setor: string): string {
    return `${bloco}|${pavimento}|${setor}`;
  }

  private saveToStorage(): void {
    const data = Array.from(this.sectors.entries());
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored) as [string, SectorData][];
        data.forEach(([key, value]) => {
          if (this.sectors.has(key)) {
            this.sectors.set(key, value);
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
    }
  }

  getSector(bloco: string, pavimento: string, setor: string): SectorData | undefined {
    const key = this.getSectorKey(bloco, pavimento, setor);
    return this.sectors.get(key);
  }

  getAllSectors(): SectorData[] {
    return Array.from(this.sectors.values());
  }

  getSectorsByBlock(bloco: string): SectorData[] {
    return this.getAllSectors().filter(sector => sector.bloco === bloco);
  }

  checkinSetor(bloco: string, pavimento: string, setor: string, executor: string, responsavel: string): boolean {
    const key = this.getSectorKey(bloco, pavimento, setor);
    const sectorData = this.sectors.get(key);
    
    if (sectorData && sectorData.status === 'pending') {
      const now = new Date().toISOString();
      this.sectors.set(key, {
        ...sectorData,
        status: 'in-progress',
        checkinTime: now,
        executor,
        responsavel
      });
      this.saveToStorage();
      return true;
    }
    return false;
  }

  checkoutSetor(bloco: string, pavimento: string, setor: string): boolean {
    const key = this.getSectorKey(bloco, pavimento, setor);
    const sectorData = this.sectors.get(key);
    
    if (sectorData && sectorData.status === 'in-progress') {
      const now = new Date().toISOString();
      const checkinTime = sectorData.checkinTime ? new Date(sectorData.checkinTime) : new Date();
      const duration = Math.round((new Date().getTime() - checkinTime.getTime()) / (1000 * 60));
      
      this.sectors.set(key, {
        ...sectorData,
        status: 'completed',
        checkoutTime: now,
        duration
      });
      this.saveToStorage();
      return true;
    }
    return false;
  }

  completeSetor(bloco: string, pavimento: string, setor: string, executor: string, responsavel: string): boolean {
    const key = this.getSectorKey(bloco, pavimento, setor);
    const sectorData = this.sectors.get(key);
    
    if (sectorData && sectorData.status === 'pending') {
      const now = new Date().toISOString();
      this.sectors.set(key, {
        ...sectorData,
        status: 'completed',
        checkinTime: now,
        checkoutTime: now,
        executor,
        responsavel,
        duration: 0
      });
      this.saveToStorage();
      return true;
    }
    return false;
  }

  resetSetor(bloco: string, pavimento: string, setor: string): boolean {
    const key = this.getSectorKey(bloco, pavimento, setor);
    const sectorData = this.sectors.get(key);
    
    if (sectorData) {
      this.sectors.set(key, {
        ...sectorData,
        status: 'pending',
        checkinTime: undefined,
        checkoutTime: undefined,
        executor: undefined,
        responsavel: undefined,
        duration: undefined
      });
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getStatistics(): Statistics {
    const sectors = this.getAllSectors();
    const total = sectors.length;
    const completed = sectors.filter(s => s.status === 'completed').length;
    const inProgress = sectors.filter(s => s.status === 'in-progress').length;
    const pending = sectors.filter(s => s.status === 'pending').length;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      completionPercentage
    };
  }

  getTodayRecords(): SectorData[] {
    const today = new Date().toDateString();
    return this.getAllSectors().filter(sector => {
      if (!sector.checkinTime) return false;
      const sectorDate = new Date(sector.checkinTime).toDateString();
      return sectorDate === today;
    });
  }

  getFilteredRecords(filters: {
    startDate?: string;
    endDate?: string;
    bloco?: string;
    setor?: string;
    executor?: string;
    status?: SectorStatus;
  }): SectorData[] {
    return this.getAllSectors().filter(sector => {
      // Data filter
      if (filters.startDate && sector.checkinTime) {
        const sectorDate = new Date(sector.checkinTime);
        const startDate = new Date(filters.startDate);
        if (sectorDate < startDate) return false;
      }

      if (filters.endDate && sector.checkinTime) {
        const sectorDate = new Date(sector.checkinTime);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (sectorDate > endDate) return false;
      }

      // Bloco filter
      if (filters.bloco && sector.bloco !== filters.bloco) return false;

      // Setor filter
      if (filters.setor && !sector.setor.toLowerCase().includes(filters.setor.toLowerCase())) return false;

      // Executor filter
      if (filters.executor && sector.executor && !sector.executor.toLowerCase().includes(filters.executor.toLowerCase())) return false;

      // Status filter
      if (filters.status && sector.status !== filters.status) return false;

      return true;
    });
  }

  exportToCSV(sectors: SectorData[]): string {
    const headers = ['Bloco', 'Pavimento', 'Setor', 'Status', 'Executor', 'Responsável', 'Início', 'Fim', 'Duração (min)'];
    const rows = sectors.map(sector => [
      sector.bloco,
      sector.pavimento,
      sector.setor,
      sector.status,
      sector.executor || '',
      sector.responsavel || '',
      sector.checkinTime ? new Date(sector.checkinTime).toLocaleString('pt-BR') : '',
      sector.checkoutTime ? new Date(sector.checkoutTime).toLocaleString('pt-BR') : '',
      sector.duration?.toString() || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  resetAllData(): void {
    this.sectors.clear();
    this.initializeSectors();
    this.saveToStorage();
  }
}