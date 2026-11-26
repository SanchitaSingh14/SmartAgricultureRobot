import React, { useState } from 'react';
import { 
  Activity, Play, Pause, RotateCcw, Sliders, CheckCircle, ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function LiveMonitoringPage({ 
  sensorHistory, 
  scenarios, 
  onApplyScenario, 
  onStartSim, 
  onPauseSim, 
  onResetSim, 
  onPostManualReading 
}) {
  const [manualForm, setManualForm] = useState({
    soil_moisture: 1100,
    temperature: 36.5,
    humidity: 35.0,
    left_distance: 60,
    center_distance: 15,
    right_distance: 40
  });

  const handleManualSubmit = (e) => {
    e.preventDefault();
    onPostManualReading({
      ...manualForm,
      soil_moisture: parseFloat(manualForm.soil_moisture),
      temperature: parseFloat(manualForm.temperature),
      humidity: parseFloat(manualForm.humidity),
      left_distance: parseFloat(manualForm.left_distance),
      center_distance: parseFloat(manualForm.center_distance),
      right_distance: parseFloat(manualForm.right_distance),
      source: 'manual_dashboard_injection'
    });
  };

  const chartData = (sensorHistory || []).slice(-20).map((r, i) => ({
    time: r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : `#${i}`,
    moisture: r.soil_moisture,
    temp: r.temperature,
    humidity: r.humidity,
    centerDist: r.center_distance
  }));

  return (
    <div className="page-body">
      {/* Simulation Controls Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Telemetry Stream & Environment Engine</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Control clock cycles, inject edge-case scenarios, or hand-craft sensor inputs.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={onStartSim}>
              <Play size={16} /> Resume Stream
            </button>
            <button className="btn btn-outline" onClick={onPauseSim}>
              <Pause size={16} /> Pause
            </button>
            <button className="btn btn-danger" onClick={onResetSim}>
              <RotateCcw size={16} /> Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Preset Scenarios Selector */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <span className="card-title"><Sliders size={18} /> Deterministic Benchmark Scenarios</span>
          <span className="badge badge-green">Instant Validation</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {Object.entries(scenarios || {}).map(([key, item]) => (
            <div 
              key={key} 
              style={{
                border: '1px solid #e2e8f0', 
                borderRadius: 8, 
                padding: '12px', 
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 8
              }}
            >
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{item.name}</strong>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>{item.description}</p>
              </div>
              <button 
                className="btn btn-outline" 
                style={{ alignSelf: 'flex-start', fontSize: '0.8rem', padding: '4px 10px' }}
                onClick={() => onApplyScenario(key)}
              >
                Apply Scenario <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Activity size={18} /> Soil Moisture History</span>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 3500]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="moisture" stroke="#15803d" strokeWidth={2} name="Soil Moisture (ADC)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><Activity size={18} /> Temperature & Humidity History</span>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temp" stroke="#dc2626" strokeWidth={2} name="Temperature (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#0284c7" strokeWidth={2} name="Humidity (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Manual Input Form */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Sliders size={18} /> Inject Custom Simulated Sensor Telemetry</span>
        </div>
        <form onSubmit={handleManualSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Soil Moisture (0-4095)</label>
              <input 
                type="number" 
                value={manualForm.soil_moisture} 
                onChange={e => setManualForm({...manualForm, soil_moisture: e.target.value})}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Temperature (°C)</label>
              <input 
                type="number" 
                step="0.1"
                value={manualForm.temperature} 
                onChange={e => setManualForm({...manualForm, temperature: e.target.value})}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Relative Humidity (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={manualForm.humidity} 
                onChange={e => setManualForm({...manualForm, humidity: e.target.value})}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Left Ultrasonic (cm)</label>
              <input 
                type="number" 
                value={manualForm.left_distance} 
                onChange={e => setManualForm({...manualForm, left_distance: e.target.value})}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Center Ultrasonic (cm)</label>
              <input 
                type="number" 
                value={manualForm.center_distance} 
                onChange={e => setManualForm({...manualForm, center_distance: e.target.value})}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Right Ultrasonic (cm)</label>
              <input 
                type="number" 
                value={manualForm.right_distance} 
                onChange={e => setManualForm({...manualForm, right_distance: e.target.value})}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}
              />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary">
              <CheckCircle size={16} /> Send Telemetry to AI Pipeline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

