import React from 'react';
import { 
  Droplets, Compass, Thermometer, ShieldCheck, 
  Activity, AlertTriangle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function OverviewPage({ systemStatus, sensorHistory, alerts, onTriggerRun, onClearAlerts }) {
  const latest = systemStatus?.latest_reading || {};
  const robot = systemStatus?.robot_state || {};
  
  const soilMoisture = latest.soil_moisture ?? '--';
  const temperature = latest.temperature ?? '--';
  const humidity = latest.humidity ?? '--';
  const pumpActive = robot.pump_active;
  const currentAction = robot.current_action || 'STOP';

  const chartData = (sensorHistory || []).slice(-15).map((r, i) => ({
    time: r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : `#${i}`,
    moisture: r.soil_moisture,
    temp: r.temperature,
    humidity: r.humidity
  }));

  return (
    <div className="page-body">
      {/* 4 Quick Stat Cards */}
      <div className="grid-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Droplets size={18} color="#15803d" /> Soil Moisture</span>
            <span className={`badge ${soilMoisture < 1300 ? 'badge-amber' : 'badge-green'}`}>
              {soilMoisture < 1300 ? 'DRY (<1300)' : 'OPTIMAL'}
            </span>
          </div>
          <div className="stat-val">{typeof soilMoisture === 'number' ? soilMoisture.toFixed(0) : soilMoisture}</div>
          <div className="stat-sub">Analog Potentiometer Sensor (GPIO 34)</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><Thermometer size={18} color="#0284c7" /> Microclimate</span>
            <span className="badge badge-blue">DHT22</span>
          </div>
          <div className="stat-val">{temperature}°C / {humidity}%</div>
          <div className="stat-sub">Ambient Temperature & Relative Humidity</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><Droplets size={18} color={pumpActive ? "#dc2626" : "#64748b"} /> Irrigation Pump</span>
            <span className={`badge ${pumpActive ? 'badge-red' : 'badge-green'}`}>
              {pumpActive ? 'ACTIVE (PUMP ON)' : 'STANDBY (OFF)'}
            </span>
          </div>
          <div className="stat-val" style={{ color: pumpActive ? '#dc2626' : '#15803d' }}>
            {pumpActive ? 'WATERING ON' : 'PUMP OFF'}
          </div>
          <div className="stat-sub">GPIO 26 Virtual Pump Indicator LED</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><Compass size={18} color="#ca8a04" /> Robot Navigation</span>
            <span className="badge badge-amber">{currentAction}</span>
          </div>
          <div className="stat-val">{currentAction}</div>
          <div className="stat-sub">Center Range: {latest.center_distance ?? '--'} cm</div>
        </div>
      </div>

      {/* Main Grid: Telemetry Trends & Live System Directives */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Activity size={18} /> Soil Moisture Dynamics</span>
            <span className="badge badge-green">Real-time Stream</span>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 3500]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="moisture" stroke="#15803d" fill="#dcfce7" name="Soil Moisture" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="stat-sub" style={{ marginTop: 8 }}>
            Threshold Marker: &lt; 1300 triggers Irrigation Agent automated pumping.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><ShieldCheck size={18} color="#15803d" /> Autonomous Agent Consensus</span>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '2px 8px' }} onClick={onTriggerRun}>
              Trigger Step
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong>Irrigation Agent</strong>
                <span className={`badge ${pumpActive ? 'badge-amber' : 'badge-green'}`}>
                  {pumpActive ? 'PUMP_ON' : 'PUMP_OFF'}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#475569' }}>
                {soilMoisture < 1300 
                  ? `Moisture (${soilMoisture}) depleted below threshold (1300). Dispensing irrigation.`
                  : `Moisture (${soilMoisture}) is sufficient. Water conservation active.`}
              </p>
            </div>

            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong>Navigation Agent</strong>
                <span className="badge badge-blue">{currentAction}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#475569' }}>
                {currentAction === 'MOVE_FORWARD' && 'Center corridor clear (>20cm). Advancing through crop row.'}
                {currentAction === 'TURN_LEFT' && 'Obstacle detected in center. Steered left towards wider clearance.'}
                {currentAction === 'TURN_RIGHT' && 'Obstacle detected in center. Steered right towards wider clearance.'}
                {currentAction === 'STOP' && 'Obstacles on all sides or sensor fail-safe halted locomotion.'}
              </p>
            </div>

            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong>Farm Manager Directive</strong>
                <span className="badge badge-green">OPTIMIZED</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#475569' }}>
                Kinematics synchronized. Active telemetry is being persisted to SQLite database.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><AlertTriangle size={18} color="#b45309" /> System Event Log & Alerts</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-amber">{alerts.length} Total Logged</span>
            {alerts.length > 0 && onClearAlerts && (
              <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '2px 8px' }} onClick={onClearAlerts}>
                Acknowledge Alerts
              </button>
            )}
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Severity</th>
              <th>Category</th>
              <th>Diagnostic Message</th>
            </tr>
          </thead>
          <tbody>
            {alerts.slice(0, 5).map(a => (
              <tr key={a.id}>
                <td>{new Date(a.timestamp).toLocaleTimeString()}</td>
                <td>
                  <span className={`badge ${a.level === 'CRITICAL' ? 'badge-red' : 'badge-amber'}`}>
                    {a.level}
                  </span>
                </td>
                <td><strong>{a.category}</strong></td>
                <td>{a.message}</td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                  No anomalies recorded. All autonomous subsystems operating normally.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

