import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Activity, Compass, Bot, Droplets, 
  Eye, FileText, Settings, Radio, RefreshCw, AlertCircle
} from 'lucide-react';

import OverviewPage from './pages/OverviewPage';
import LiveMonitoringPage from './pages/LiveMonitoringPage';
import RobotDigitalTwinPage from './pages/RobotDigitalTwinPage';
import AIAgentsPage from './pages/AIAgentsPage';
import IrrigationControlPage from './pages/IrrigationControlPage';
import CropMonitoringPage from './pages/CropMonitoringPage';
import AnalyticsReportsPage from './pages/AnalyticsReportsPage';
import SettingsPage from './pages/SettingsPage';

import { 
  getSystemStatus, getSensorHistory, getDecisions, getAlerts, clearAlerts,
  getIrrigationEvents, getScenarios, applyScenario, startSimulation, 
  pauseSimulation, resetSimulation, postSimulateReading, runAgentCycle,
  setManualIrrigation, setAutoIrrigation, getCropHistory
} from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('overview');
  const [systemStatus, setSystemStatus] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [irrigationEvents, setIrrigationEvents] = useState([]);
  const [cropHistory, setCropHistory] = useState([]);
  const [scenarios, setScenarios] = useState({});
  const [backendError, setBackendError] = useState(null);

  const fetchData = async () => {
    try {
      const [statusRes, historyRes, decisionsRes, alertsRes, eventsRes, cropRes] = await Promise.all([
        getSystemStatus().catch(err => { setBackendError(err.message); return null; }),
        getSensorHistory(25).catch(() => []),
        getDecisions(30).catch(() => []),
        getAlerts().catch(() => []),
        getIrrigationEvents(20).catch(() => []),
        getCropHistory().catch(() => [])
      ]);

      if (statusRes) {
        setSystemStatus(statusRes);
        setBackendError(null);
      }
      setSensorHistory(historyRes || []);
      setDecisions(decisionsRes || []);
      setAlerts(alertsRes || []);
      setIrrigationEvents(eventsRes || []);
      setCropHistory(cropRes || []);
    } catch (err) {
      setBackendError(err.message);
    }
  };

  useEffect(() => {
    getScenarios().then(setScenarios).catch(() => {});
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyScenario = async (key) => {
    await applyScenario(key);
    fetchData();
  };

  const handleStartSim = async () => {
    await startSimulation();
    fetchData();
  };

  const handlePauseSim = async () => {
    await pauseSimulation();
    fetchData();
  };

  const handleResetSim = async () => {
    await resetSimulation();
    fetchData();
  };

  const handlePostManual = async (data) => {
    await postSimulateReading(data);
    fetchData();
  };

  const handleTriggerRun = async () => {
    await runAgentCycle();
    fetchData();
  };

  const handleSetManualIrrigation = async (action, reason) => {
    await setManualIrrigation(action, reason);
    fetchData();
  };

  const handleSetAutoIrrigation = async () => {
    await setAutoIrrigation();
    fetchData();
  };

  const handleClearAlerts = async () => {
    await clearAlerts();
    fetchData();
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="brand-badge">B.Tech Research Project</span>
          <div className="sidebar-title">
            <Radio color="#22c55e" size={20} />
            Smart Agri Robot
          </div>
        </div>

        <ul className="sidebar-nav">
          <li className={`nav-item ${currentPage === 'overview' ? 'active' : ''}`} onClick={() => setCurrentPage('overview')}>
            <LayoutDashboard size={18} /> Overview
          </li>
          <li className={`nav-item ${currentPage === 'monitoring' ? 'active' : ''}`} onClick={() => setCurrentPage('monitoring')}>
            <Activity size={18} /> Live Monitoring
          </li>
          <li className={`nav-item ${currentPage === 'digital_twin' ? 'active' : ''}`} onClick={() => setCurrentPage('digital_twin')}>
            <Compass size={18} /> Robot Digital Twin
          </li>
          <li className={`nav-item ${currentPage === 'agents' ? 'active' : ''}`} onClick={() => setCurrentPage('agents')}>
            <Bot size={18} /> AI Multi-Agent Network
          </li>
          <li className={`nav-item ${currentPage === 'irrigation' ? 'active' : ''}`} onClick={() => setCurrentPage('irrigation')}>
            <Droplets size={18} /> Irrigation Control
          </li>
          <li className={`nav-item ${currentPage === 'crop' ? 'active' : ''}`} onClick={() => setCurrentPage('crop')}>
            <Eye size={18} /> Crop Scouting Vision
          </li>
          <li className={`nav-item ${currentPage === 'analytics' ? 'active' : ''}`} onClick={() => setCurrentPage('analytics')}>
            <FileText size={18} /> Analytics & Export
          </li>
          <li className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => setCurrentPage('settings')}>
            <Settings size={18} /> System Settings
          </li>
        </ul>

        <div className="sidebar-footer">
          <div>Status: <span style={{ color: '#22c55e', fontWeight: 600 }}>ONLINE</span></div>
          <div>Simulation Mode: Active</div>
          <div style={{ marginTop: 4, fontSize: '0.7rem' }}>B.Tech Final Year 2026</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">
              {currentPage === 'overview' && 'Farm Telemetry & Status Overview'}
              {currentPage === 'monitoring' && 'Real-time Telemetry & Scenario Injection'}
              {currentPage === 'digital_twin' && 'IoT Robot Digital Twin & Kinematics'}
              {currentPage === 'agents' && 'Autonomous Multi-Agent Intelligence System'}
              {currentPage === 'irrigation' && 'Precision Irrigation & Pump Governance'}
              {currentPage === 'crop' && 'Canopy Colorimetry & Crop Health Vision'}
              {currentPage === 'analytics' && 'Agronomic Analytics & CSV Reporting'}
              {currentPage === 'settings' && 'Thresholds & Architecture Topology'}
            </h1>
            <span className="mode-pill sim">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              Virtual Twin Active
            </span>
            <span className={`mode-pill ${systemStatus?.mqtt_connected ? 'mqtt' : 'sim'}`}>
              MQTT: {systemStatus?.mqtt_connected ? 'Connected' : 'Fallback'}
            </span>
          </div>

          <div className="topbar-actions">
            <button className="btn btn-outline" onClick={fetchData}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={handleTriggerRun}>
              Trigger Step
            </button>
          </div>
        </header>

        {backendError && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} /> Backend connection alert: Verify that FastAPI server is running on http://localhost:8000.
          </div>
        )}

        {/* Page Routing */}
        {currentPage === 'overview' && (
          <OverviewPage 
            systemStatus={systemStatus} 
            sensorHistory={sensorHistory} 
            alerts={alerts} 
            onTriggerRun={handleTriggerRun} 
            onClearAlerts={handleClearAlerts}
          />
        )}

        {currentPage === 'monitoring' && (
          <LiveMonitoringPage 
            latestReading={systemStatus?.latest_reading}
            sensorHistory={sensorHistory}
            scenarios={scenarios}
            onApplyScenario={handleApplyScenario}
            onStartSim={handleStartSim}
            onPauseSim={handlePauseSim}
            onResetSim={handleResetSim}
            onPostManualReading={handlePostManual}
          />
        )}

        {currentPage === 'digital_twin' && (
          <RobotDigitalTwinPage 
            robotState={systemStatus?.robot_state}
            latestSensors={systemStatus?.latest_reading}
            onResetSim={handleResetSim}
          />
        )}

        {currentPage === 'agents' && (
          <AIAgentsPage 
            decisions={decisions}
            onTriggerRun={handleTriggerRun}
          />
        )}

        {currentPage === 'irrigation' && (
          <IrrigationControlPage 
            robotState={systemStatus?.robot_state}
            latestSensors={systemStatus?.latest_reading}
            irrigationEvents={irrigationEvents}
            onSetManualIrrigation={handleSetManualIrrigation}
            onSetAutoIrrigation={handleSetAutoIrrigation}
          />
        )}

        {currentPage === 'crop' && (
          <CropMonitoringPage 
            cropHistory={cropHistory}
            onRefreshCropHistory={fetchData}
          />
        )}

        {currentPage === 'analytics' && (
          <AnalyticsReportsPage 
            sensorHistory={sensorHistory}
            irrigationEvents={irrigationEvents}
            decisions={decisions}
            alerts={alerts}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage systemStatus={systemStatus} />
        )}
      </div>
    </div>
  );
}
