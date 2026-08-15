import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { App } from './App';
import { initializeAntiCheat } from './services/antiCheat';
import { getChannelId, getDeviceId } from './services/zeroCampaignBridge';
import './styles/index.css';

const app = <App />;

function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {import.meta.env.MODE === 'online' ? (
        <HashRouter>{app}</HashRouter>
      ) : (
        <BrowserRouter basename={import.meta.env.BASE_URL}>{app}</BrowserRouter>
      )}
    </StrictMode>,
  );
}

async function bootstrap() {
  // 在页面产生可交互内容前预置参数并加载反作弊脚本。
  // 原生桥未回调时最多等待 1 秒，避免异常环境长期阻塞页面渲染。
  const modid = getDeviceId();
  const channelId = await getChannelId(1_000);
  initializeAntiCheat({ channelId, modid });
  renderApp();
}

void bootstrap();
