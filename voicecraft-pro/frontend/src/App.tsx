import { Routes, Route, Navigate } from 'react-router-dom';
import Workshop from './pages/Workshop';
import VoiceStore from './pages/VoiceStore';
import Settings from './pages/Settings';
import Projects from './pages/Projects';
import Toast from './components/Toast';

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 text-white">
      <Routes>
        <Route path="/" element={<Projects />} />
        <Route path="/workshop/:projectId?" element={<Workshop />} />
        <Route path="/voices" element={<VoiceStore />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </div>
  );
}

export default App;
