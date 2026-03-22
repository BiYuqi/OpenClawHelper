import React from 'react';
import Sidebar from './Sidebar';
import { usePageCtx } from '../../App';
import DashboardPage from '../Dashboard/DashboardPage';
import AIConfigPage from '../AIConfig/AIConfigPage';
import LogsPage from '../Logs/LogsPage';
import SettingsPage from '../Settings/SettingsPage';

interface ShellProps {
  installState: string;
  onRecheck: () => void;
}

export default function Shell({ onRecheck }: ShellProps) {
  const { page } = usePageCtx();

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <Sidebar />
      <main className="flex-1 overflow-hidden" style={{ position: 'relative' }}>
        {page === 'dashboard' && <DashboardPage onRecheck={onRecheck} />}
        {page === 'providers' && <AIConfigPage />}
        {/* LogsPage stays mounted to preserve running state and log buffer */}
        <div style={{ display: page === 'logs' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <LogsPage />
        </div>
        {page === 'settings'  && <SettingsPage />}
      </main>
    </div>
  );
}
