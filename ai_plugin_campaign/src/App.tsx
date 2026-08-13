import { Navigate, Route, Routes } from 'react-router-dom';
import { CampaignPage } from './pages/CampaignPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { BrowserEnvironmentProvider } from './state/BrowserEnvironmentContext';
import { ZeroBrowserGate } from './components/ZeroBrowserGate';

export function App() {
  return (
    <BrowserEnvironmentProvider>
      <ZeroBrowserGate>
        <Routes>
          <Route path="/" element={<CampaignPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ZeroBrowserGate>
    </BrowserEnvironmentProvider>
  );
}
