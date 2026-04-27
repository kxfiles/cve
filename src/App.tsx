import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Studio from './components/Studio';

const App: React.FC = () => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-cyber-black overflow-x-hidden">
      {currentProjectId ? (
        <Studio projectId={currentProjectId} onBack={() => setCurrentProjectId(null)} />
      ) : (
        <Dashboard onSelectProject={(id) => setCurrentProjectId(id)} />
      )}
    </div>
  );
};

export default App;
