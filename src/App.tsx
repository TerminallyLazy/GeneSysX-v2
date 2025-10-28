import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastProvider';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toolbox from './components/Toolbox';
import ChatInterface from './components/ChatInterface';

const SequenceAnalysis = lazy(() => import('./components/SequenceAnalysis'));
const DnaChat = lazy(() => import('./components/DnaChat'));
const GymSysX = lazy(() => import('./components/GymSysX'));
const MarimoPad = lazy(() => import('./components/MarimoPad'));
const BioPrompt = lazy(() => import('./components/BioPrompt'));
const PhylogeneticAnalysis = lazy(() => import('./components/PhylogeneticAnalysis'));
const ProteinAnalysis = lazy(() => import('./components/ProteinAnalysis'));
const GeneticConstructor = lazy(() => import('./components/GeneticConstructor'));
const Documentation = lazy(() => import('./components/Documentation'));

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check localStorage and system preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return JSON.parse(savedMode);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    // Update document class and localStorage when dark mode changes
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev: boolean) => !prev);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev: boolean) => !prev);
  };

  return (
    <Router>
      <ToastProvider>
        <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
          <div className="flex h-full">
            <Sidebar
              isOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              isDarkMode={isDarkMode}
            />
            <div 
              className={`
                flex flex-col flex-1 
                transition-all duration-300 
                ${isSidebarOpen ? 'ml-64' : 'ml-16'}
              `}
            >
              <Navbar 
                isDarkMode={isDarkMode} 
                toggleDarkMode={toggleDarkMode}
              />
              <main className="flex-1 overflow-hidden p-4 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-slate-900/50">
                <div className="h-full rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm 
                  shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.3)]
                  border border-gray-200/80 dark:border-slate-700/80
                  ring-1 ring-gray-900/5 dark:ring-white/10">
                  <div className="h-full overflow-auto">
                    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading…</div>}>
                      <Routes>
                        <Route path="/" element={
                          <div className="h-full flex flex-col p-4 gap-4">
                            <div className="flex-none">
                              <Toolbox />
                            </div>
                            <div className="flex-1 min-h-0">
                              <ChatInterface />
                            </div>
                          </div>
                        } />
                        {[
                          'sequence-analysis', 'dna-chat', 'gym-sysx', 
                          'marimo-notebook', 'bio-prompt', 'phylogenetic-analysis',
                          'protein-analysis', 'genetic-constructor', 'documentation'
                        ].map((path) => (
                          <Route
                            key={path}
                            path={`/${path}`}
                            element={
                              <div className="min-h-full p-4">
                                {React.createElement(
                                  ({
                                    'sequence-analysis': SequenceAnalysis,
                                    'dna-chat': DnaChat,
                                    'gym-sysx': GymSysX,
                                    'marimo-notebook': MarimoPad,
                                    'bio-prompt': BioPrompt,
                                    'phylogenetic-analysis': PhylogeneticAnalysis,
                                    'protein-analysis': ProteinAnalysis,
                                    'genetic-constructor': GeneticConstructor,
                                    'documentation': Documentation,
                                  } as const)[path] || (() => <Navigate to="/" replace />)
                                )}
                              </div>
                            }
                          />
                        ))}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </ToastProvider>
    </Router>
  );
}
