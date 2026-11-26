import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Cpu, CheckCircle, AlertCircle } from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';

export default function SettingsPage({ systemStatus }) {
  const [soilThreshold, setSoilThreshold] = useState(1300);
  const [obstacleThreshold, setObstacleThreshold] = useState(20);
  const [simSpeed, setSimSpeed] = useState(2.0);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((data) => {
        if (data.dry_soil_threshold !== undefined) setSoilThreshold(data.dry_soil_threshold);
        if (data.obstacle_threshold_cm !== undefined) setObstacleThreshold(data.obstacle_threshold_cm);
        if (data.simulation_interval_seconds !== undefined) setSimSpeed(data.simulation_interval_seconds);
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);
    try {
      const updated = await updateSettings({
        dry_soil_threshold: parseInt(soilThreshold, 10),
        obstacle_threshold_cm: parseFloat(obstacleThreshold),
        simulation_interval_seconds: parseFloat(simSpeed),
      });
      setSoilThreshold(updated.dry_soil_threshold);
      setObstacleThreshold(updated.obstacle_threshold_cm);
      setSimSpeed(updated.simulation_interval_seconds);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update settings on backend.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-body">
      <div className="grid-2">
        {/* System Thresholds Configuration */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><SettingsIcon size={18} /> Heuristic &amp; Safety Thresholds</span>
            <span className="badge badge-green">Live Backend Sync</span>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dry Soil Moisture Boundary (ADC 0–4095)</label>
                <input
                  type="number"
                  min={0}
                  max={4095}
                  value={soilThreshold}
                  onChange={e => setSoilThreshold(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Default: 1300. Readings below this value trigger irrigation.
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Obstacle Safety Clearance (cm)</label>
                <input
                  type="number"
                  min={2}
                  max={200}
                  step="0.5"
                  value={obstacleThreshold}
                  onChange={e => setObstacleThreshold(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Default: 20 cm. Ultrasonic distances under this boundary initiate obstacle avoidance.
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Simulation Cycle Interval (Seconds)</label>
                <input
                  type="number"
                  min={0.5}
                  max={60}
                  step="0.5"
                  value={simSpeed}
                  onChange={e => setSimSpeed(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Interval between autonomous agent execution cycles in the background.
                </span>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={saving}>
                <CheckCircle size={16} /> {saving ? 'Saving...' : 'Save Threshold Preferences'}
              </button>

              {savedSuccess && (
                <div style={{ color: '#15803d', fontSize: '0.8rem', fontWeight: 600 }}>
                  Settings applied to live backend agents!
                </div>
              )}
              {errorMsg && (
                <div style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} /> {errorMsg}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* System Topology & Diagnostics */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Cpu size={18} /> Local Architecture Diagnostics</span>
            <span className="badge badge-blue">Demo / Simulation Mode</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <strong>Operating Mode:</strong>
                <span className="badge badge-green">Virtual Simulation (Safe Default)</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                No physical actuators or hardware motors are connected.
              </div>
            </div>

            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <strong>Database Engine:</strong>
                <span className="badge badge-green">SQLite3 (Active)</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Path: <code>./smart_agri_robot.db</code> (Persistent Local Storage)
              </div>
            </div>

            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <strong>MQTT IoT Broker:</strong>
                <span className={`badge ${systemStatus?.mqtt_connected ? 'badge-green' : 'badge-amber'}`}>
                  {systemStatus?.mqtt_connected ? 'Connected' : 'Fallback / REST Mode'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Host: <code>localhost:1883</code> (Seamless REST fallback active)
              </div>
            </div>

            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <strong>Wokwi Virtual Hardware:</strong>
                <span className="badge badge-blue">ESP32 DevKit C V4</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Firmware preserved in <code>C:\SmartAgricultureRobot\firmware</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
