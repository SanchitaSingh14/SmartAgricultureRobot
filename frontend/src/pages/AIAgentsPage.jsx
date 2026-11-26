import React, { useState } from 'react';
import { 
  Droplets, Compass, Thermometer, Eye, ShieldCheck, 
  Play, Layers
} from 'lucide-react';

export default function AIAgentsPage({ decisions, onTriggerRun }) {
  const [selectedAgent, setSelectedAgent] = useState('All');

  const agentsList = [
    {
      id: 'Irrigation Agent',
      name: 'Irrigation Agent',
      icon: <Droplets color="#15803d" size={20} />,
      type: 'Expert Rule Engine with Hysteresis',
      desc: 'Evaluates soil moisture potentiometer (GPIO 34) and ambient heat stress to govern pump relays safely.'
    },
    {
      id: 'Navigation Agent',
      name: 'Navigation Agent',
      icon: <Compass color="#ca8a04" size={20} />,
      type: 'Obstacle Avoidance Heuristic',
      desc: 'Processes left (30°), center (90°), and right (150°) range sweeps to steer around crop obstacles or halt on traps.'
    },
    {
      id: 'Environment Agent',
      name: 'Environment Agent',
      icon: <Thermometer color="#0284c7" size={20} />,
      type: 'Microclimate Monitor',
      desc: 'Tracks ambient temperature and relative humidity from DHT22 (GPIO 27) for plant stress detection.'
    },
    {
      id: 'Crop Monitoring Agent',
      name: 'Crop Monitoring Agent',
      icon: <Eye color="#16a34a" size={20} />,
      type: 'Computer Vision / Vegetation Index',
      desc: 'Applies OpenCV Excess Green (ExG) and color space segmentation to leaf images for honest chlorosis assessment.'
    },
    {
      id: 'Farm Manager Agent',
      name: 'Farm Manager Agent',
      icon: <ShieldCheck color="#7c3aed" size={20} />,
      type: 'Multi-Agent Consensus Synthesizer',
      desc: 'Synthesizes directives, enforces hard safety locks (STOP invariants), and prepares farmer action items.'
    }
  ];

  const filteredDecisions = selectedAgent === 'All' 
    ? (decisions || [])
    : (decisions || []).filter(d => d.agent_name.toLowerCase().includes(selectedAgent.toLowerCase()));

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Multi-Agent Intelligence Network</h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
            5 independent specialized agents communicating asynchronously through an auditable decision coordinator.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onTriggerRun}>
          <Play size={16} /> Execute Agent Cycle Now
        </button>
      </div>

      {/* 5 Specialized Agent Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {agentsList.map(a => (
          <div 
            key={a.id} 
            className="card"
            style={{ 
              cursor: 'pointer',
              border: selectedAgent === a.name ? '2px solid #15803d' : '1px solid #e2e8f0',
              background: selectedAgent === a.name ? '#f0fdf4' : '#ffffff'
            }}
            onClick={() => setSelectedAgent(selectedAgent === a.name ? 'All' : a.name)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {a.icon}
              <strong style={{ fontSize: '0.95rem' }}>{a.name}</strong>
            </div>
            <div className="badge badge-blue" style={{ marginBottom: 8 }}>{a.type}</div>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>{a.desc}</p>
          </div>
        ))}
      </div>

      {/* Auditable Decision History Log */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Layers size={18} /> Auditable Decision Log 
            {selectedAgent !== 'All' && <span className="badge badge-green" style={{ marginLeft: 8 }}>Filtered: {selectedAgent}</span>}
          </span>
          {selectedAgent !== 'All' && (
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '2px 8px' }} onClick={() => setSelectedAgent('All')}>
              Show All Agents
            </button>
          )}
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Agent</th>
              <th>Decision</th>
              <th>Priority</th>
              <th>Action / Command</th>
              <th>Reasoning Rationale</th>
            </tr>
          </thead>
          <tbody>
            {filteredDecisions.slice(0, 25).map(d => (
              <tr key={d.id}>
                <td>{new Date(d.timestamp).toLocaleTimeString()}</td>
                <td><strong>{d.agent_name}</strong></td>
                <td><span className="badge badge-green">{d.decision}</span></td>
                <td>
                  <span className={`badge ${
                    d.priority === 'HIGH' || d.priority === 'CRITICAL' ? 'badge-red' : 
                    d.priority === 'NORMAL' ? 'badge-amber' : 'badge-blue'
                  }`}>
                    {d.priority}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#1e293b' }}>
                  {d.action_taken || '--'}
                </td>
                <td style={{ fontSize: '0.8rem', color: '#475569', maxWidth: 360 }}>
                  {d.reason}
                </td>
              </tr>
            ))}
            {filteredDecisions.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No decisions logged for this selection yet. Click 'Execute Agent Cycle' to generate telemetry and evaluate logic.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

