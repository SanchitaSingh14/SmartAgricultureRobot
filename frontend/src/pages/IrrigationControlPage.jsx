import React, { useState } from 'react';
import { Droplets, Power, ShieldAlert, RotateCcw } from 'lucide-react';

export default function IrrigationControlPage({ 
  robotState, 
  latestSensors, 
  irrigationEvents, 
  onSetManualIrrigation, 
  onSetAutoIrrigation 
}) {
  const [reasonInput, setReasonInput] = useState('Manual agronomic inspection');
  const robot = robotState || {};
  const isManual = robot.manual_mode;
  const isPumpOn = robot.pump_active;
  const soilMoisture = latestSensors?.soil_moisture ?? '--';

  const handleTogglePump = (action) => {
    onSetManualIrrigation(action, reasonInput);
  };

  return (
    <div className="page-body">
      <div className="grid-2">
        {/* Pump Actuator Controls */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Droplets size={18} color="#15803d" /> Virtual Irrigation Pump Controller</span>
            <span className={`badge ${isManual ? 'badge-amber' : 'badge-green'}`}>
              {isManual ? 'MANUAL OVERRIDE' : 'AUTONOMOUS AGENT MODE'}
            </span>
          </div>

          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isPumpOn ? '#fee2e2' : '#f1f5f9',
              border: `4px solid ${isPumpOn ? '#dc2626' : '#cbd5e1'}`,
              transition: 'all 0.3s ease'
            }}>
              <Power size={42} color={isPumpOn ? '#dc2626' : '#64748b'} />
            </div>

            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isPumpOn ? '#dc2626' : '#0f172a' }}>
              {isPumpOn ? 'PUMP IS DISPENSING (LED ON)' : 'PUMP IS INACTIVE (LED OFF)'}
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>
              Simulated GPIO 26 Relay Output
            </p>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Override Reason / Note:</label>
            <input 
              type="text" 
              value={reasonInput} 
              onChange={e => setReasonInput(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4, marginBottom: 12 }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                className="btn btn-danger" 
                style={{ flex: 1 }} 
                onClick={() => handleTogglePump('PUMP_ON')}
              >
                Force Pump ON
              </button>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1 }} 
                onClick={() => handleTogglePump('PUMP_OFF')}
              >
                Force Pump OFF
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={onSetAutoIrrigation}
              >
                <RotateCcw size={14} /> Restore Auto Mode
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Rules & Thresholds Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><ShieldAlert size={18} color="#0284c7" /> Dynamic Agronomic Thresholds</span>
            <span className="badge badge-blue">Expert Heuristics</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong>Current Soil Moisture Value:</strong>
                <span className={`badge ${soilMoisture < 1300 ? 'badge-amber' : 'badge-green'}`}>
                  {soilMoisture} ADC
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Threshold boundary: <strong>1300</strong>. Readings below 1300 denote dry soil conditions requiring water.
              </p>
            </div>

            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '0.85rem' }}>Heat Stress Multiplier:</strong>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                If ambient temperature exceeds <strong>35.0°C</strong> AND humidity drops below <strong>40.0%</strong>, the agent flags an immediate HIGH-priority irrigation event to counteract accelerated crop transpiration.
              </p>
            </div>

            <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
              <strong style={{ fontSize: '0.85rem', color: '#991b1b' }}>Fail-Safe Protection:</strong>
              <p style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: 4 }}>
                If analog soil sensor returns NaN, null, or values outside (0 - 4095), the Irrigation Agent automatically cuts power to the pump to prevent accidental crop flooding.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Irrigation Events */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Droplets size={18} /> Irrigation Event Audit Trail</span>
          <span className="badge badge-green">SQLite Log</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Operational Mode</th>
              <th>Soil Moisture</th>
              <th>Temp / Humidity</th>
              <th>Trigger Reason</th>
            </tr>
          </thead>
          <tbody>
            {(irrigationEvents || []).slice(0, 15).map(e => (
              <tr key={e.id}>
                <td>{new Date(e.timestamp).toLocaleTimeString()}</td>
                <td>
                  <span className={`badge ${e.action === 'PUMP_ON' ? 'badge-red' : 'badge-green'}`}>
                    {e.action}
                  </span>
                </td>
                <td>
                  <span className={`badge ${e.mode === 'MANUAL_OVERRIDE' ? 'badge-amber' : 'badge-blue'}`}>
                    {e.mode}
                  </span>
                </td>
                <td>{e.soil_value !== null ? e.soil_value?.toFixed(0) : '--'}</td>
                <td>{e.temperature !== null ? `${e.temperature}°C / ${e.humidity}%` : '--'}</td>
                <td style={{ fontSize: '0.8rem', color: '#475569' }}>{e.trigger_reason}</td>
              </tr>
            ))}
            {(irrigationEvents || []).length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                  No irrigation switching events recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

