import React, { useState, useEffect } from 'react';
import { SetorManager } from '../lib/hospitalData';
import Dashboard from './Dashboard';
import Records from './Records';
import Reports from './Reports';
import { Button } from './ui/button';
import { BarChart3, Calendar, FileText } from 'lucide-react';

type ActiveTab = 'dashboard' | 'records' | 'reports';

const PestControlApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [setorManager] = useState(() => new SetorManager());
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'records' as const, label: 'Registros do Dia', icon: Calendar },
    { id: 'reports' as const, label: 'Relatórios', icon: FileText }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setorManager={setorManager} onRefresh={handleRefresh} key={refreshKey} />;
      case 'records':
        return <Records setorManager={setorManager} key={refreshKey} />;
      case 'reports':
        return <Reports setorManager={setorManager} key={refreshKey} />;
      default:
        return <Dashboard setorManager={setorManager} onRefresh={handleRefresh} key={refreshKey} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Tabs */}
      <nav className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-3 rounded-none border-b-2 transition-all duration-200
                    ${isActive 
                      ? 'border-b-primary bg-primary/5 text-primary' 
                      : 'border-b-transparent hover:border-b-muted-foreground/20 hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default PestControlApp;