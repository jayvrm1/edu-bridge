/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavRoute } from './Sidebar';
import { RightRail } from './RightRail';
import { Header } from './Header';
import { BackendStatusModal } from '../common/BackendStatusModal';
import { apiConfig } from '../../services/api/config';
import { gamificationService } from '../../services/api/gamificationService';
import { DashboardData } from '../../types';
import { INITIAL_DASHBOARD_DATA } from '../../services/api/mockData';

interface AppShellProps {
  currentRoute: NavRoute;
  onNavigate: (route: NavRoute) => void;
  children: React.ReactNode;
  onSelectSign?: (sign: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRoute,
  onNavigate,
  children,
  onSelectSign,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>(INITIAL_DASHBOARD_DATA);

  useEffect(() => {
    // Initial health check and subscription
    apiConfig.checkHealth();
    const unsub = apiConfig.subscribe((c) => {
      setIsBackendConnected(c.status === 'connected');
    });

    // Fetch dashboard data
    const loadData = async () => {
      try {
        const data = await gamificationService.getDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to load dashboard data for shell:', err);
      }
    };
    loadData();

    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-[#F1F1F1] p-0 sm:p-4 md:p-6 flex flex-col items-center justify-center font-sans">
      {/* Consolidated Elevated Dashboard Container (Stitch Spec) */}
      <div className="w-full max-w-[1680px] bg-[#FFFFFF] rounded-none sm:rounded-3xl border-0 sm:border-2 border-[#222222] shadow-stitch overflow-hidden flex flex-col min-h-[92vh]">
        {/* Header */}
        <Header
          onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
          onOpenBackendModal={() => setIsBackendModalOpen(true)}
        />

        {/* 3-Column Layout Body */}
        <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
          {/* Left Navigation Rail */}
          <div
            className={`fixed inset-0 z-40 lg:relative lg:z-auto transition-transform lg:translate-x-0 ${
              mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Mobile Backdrop */}
            {mobileNavOpen && (
              <div
                onClick={() => setMobileNavOpen(false)}
                className="absolute inset-0 bg-black/40 lg:hidden"
              />
            )}
            <div className="relative z-10 h-full w-72 lg:w-64 bg-white">
              <Sidebar
                currentRoute={currentRoute}
                onNavigate={onNavigate}
                onOpenBackendModal={() => setIsBackendModalOpen(true)}
                isBackendConnected={isBackendConnected}
                onCloseMobile={() => setMobileNavOpen(false)}
              />
            </div>
          </div>

          {/* Center Main Workspace Pane */}
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#FFFFFF] focus:outline-none">
            {children}
          </main>

          {/* Right Activity & Leaderboard Rail (Shown on Dashboard or wide screens) */}
          {currentRoute === 'dashboard' && (
            <div className="hidden xl:block">
              <RightRail
                activityDays={dashboardData.activityCalendar}
                leaderboard={dashboardData.leaderboard}
                onOpenSignStudio={() => onNavigate('sign-studio')}
                onSelectSign={onSelectSign}
              />
            </div>
          )}
        </div>
      </div>

      {/* Backend Integration Inspector Modal */}
      <BackendStatusModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
      />
    </div>
  );
};
