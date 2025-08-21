import React, { useState, useEffect } from 'react';
import { SetorManager } from '../lib/hospitalData';
import Dashboard from './Dashboard';
import Records from './Records';
import Reports from './Reports';
import { Button } from './ui/button';
import { BarChart3, Calendar, FileText, Menu, X } from 'lucide-react';

type ActiveTab = 'dashboard' | 'records' | 'reports';

const PestControlApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [setorManager] = useState(() => new SetorManager());
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <nav className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
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

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex items-center justify-between py-3">
              <h1 className="text-lg font-semibold text-foreground">Sistema de Dedetização</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-card border-b border-border shadow-lg z-10">
                <div className="px-4 py-2 space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <Button
                        key={tab.id}
                        variant={isActive ? "default" : "ghost"}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`
                          w-full justify-start px-4 py-3 rounded-md transition-all duration-200
                          ${isActive 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'hover:bg-muted/50'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {tab.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
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