import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import InterventionList from './components/InterventionList';
import CostEstimate from './components/CostEstimate';
import DownloadReport from './components/DownloadReport';

export default function App() {
  const [interventions, setInterventions] = useState([]);
  const [costs, setCosts] = useState({});

  const handleFileUpload = (file) => {
    // Simulated data parsing and cost calculation
    const parsed = [
      { id: 1, name: 'Speed Breaker', quantity: 10, clause: 'IRC: SP: 84' },
      { id: 2, name: 'Road Signage', quantity: 15, clause: 'IRC 67' },
    ];
    setInterventions(parsed);

    setCosts({
      1: { unitPrice: 5000, total: 50000, source: 'CPWD SOR 2025' },
      2: { unitPrice: 2000, total: 30000, source: 'GeM portal 2025' },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-900 via-purple-900 to-pink-900 font-sans p-6">
      <h1 className="text-center text-5xl font-extrabold text-white mb-12 drop-shadow-lg">
        Road Safety Intervention Estimator
      </h1>

      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-8">
        <FileUpload onUpload={handleFileUpload} />

        {interventions.length > 0 && (
          <>
            <InterventionList interventions={interventions} />
            <CostEstimate interventions={interventions} costs={costs} />
            <DownloadReport interventions={interventions} costs={costs} />
          </>
        )}
      </div>

      <footer className="mt-16 text-center text-white/70 text-sm">
        &copy; 2025 Road Safety Hackathon – Built with 💜 using React & Tailwind CSS
      </footer>
    </div>
  );
}
