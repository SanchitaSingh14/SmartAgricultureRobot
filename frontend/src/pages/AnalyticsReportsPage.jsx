import React, { useState, useMemo, useCallback } from 'react';
import { Download, BarChart3, Printer, Calendar, AlertTriangle, Compass, Droplets } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { getExportUrl } from '../services/api';

export default function AnalyticsReportsPage({ sensorHistory, irrigationEvents, decisions, alerts }) {
  const [selectedDataset, setSelectedDataset] = useState('sensors');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const inDateRange = useCallback((ts) => {
    if (!ts) return true;
    const d = new Date(ts);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  }, [startDate, endDate]);

  const filteredSensors = useMemo(() => (sensorHistory || []).filter(r => inDateRange(r.timestamp)), [sensorHistory, inDateRange]);
  const filteredIrrigation = useMemo(() => (irrigationEvents || []).filter(r => inDateRange(r.timestamp)), [irrigationEvents, inDateRange]);
  const filteredDecisions = useMemo(() => (decisions || []).filter(r => inDateRange(r.timestamp)), [decisions, inDateRange]);
  const filteredAlerts = useMemo(() => (alerts || []).filter(r => inDateRange(r.timestamp)), [alerts, inDateRange]);

  const sensorChartData = filteredSensors.slice(-30).map((r, i) => ({
    time: r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : `#${i}`,
    moisture: r.soil_moisture,
    temp: r.temperature,
    humidity: r.humidity,
  }));

  // Navigation decision summary counts
  const navCounts = useMemo(() => {
    const counts = { MOVE_FORWARD: 0, TURN_LEFT: 0, TURN_RIGHT: 0, STOP: 0 };
    filteredDecisions
      .filter(d => d.agent_name === 'Navigation Agent')
      .forEach(d => {
        if (counts[d.decision] !== undefined) counts[d.decision] += 1;
      });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [filteredDecisions]);

  // Irrigation event summary counts
  const irrigationSummary = useMemo(() => {
    let onCount = 0;
    let offCount = 0;
    let manualCount = 0;
    filteredIrrigation.forEach(e => {
      if (e.action === 'PUMP_ON') onCount += 1;
      else if (e.action === 'PUMP_OFF') offCount += 1;
      if (e.mode === 'MANUAL_OVERRIDE') manualCount += 1;
    });
    return { onCount, offCount, manualCount };
  }, [filteredIrrigation]);

  // Alerts by category
  const alertsByCategory = useMemo(() => {
    const map = {};
    filteredAlerts.forEach(a => {
      const cat = a.category || 'SYSTEM';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).map(([category, count]) => ({ category, count }));
  }, [filteredAlerts]);

  const handleDownloadCsv = () => {
    window.open(getExportUrl(selectedDataset), '_blank');
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="page-body">
      {/* Date-Range Filter & Print Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.9rem' }}>
              <Calendar size={16} color="#15803d" /> Date-Range Filter:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
            />
            <span style={{ color: '#64748b', fontSize: '0.82rem' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
            />
            {(startDate || endDate) && (
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                onClick={() => { setStartDate(''); setEndDate(''); }}
              >
                Clear Filter
              </button>
            )}
          </div>
          <button className="btn btn-outline" onClick={handlePrintReport}>
            <Printer size={16} /> Print / Save PDF Report
          </button>
        </div>
      </div>

      {/* Top Row: CSV Export + Aggregate Summary */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Download size={18} /> Export Historical Datasets (CSV)</span>
            <span className="badge badge-green">Standard Format</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
            Download complete SQLite table records for experimental verification, research papers, or thesis data validation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="radio"
                name="dataset"
                value="sensors"
                checked={selectedDataset === 'sensors'}
                onChange={() => setSelectedDataset('sensors')}
              />
              <strong>Sensor Readings Telemetry</strong> (Soil moisture, temp, humidity, ultrasonic ranges)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="radio"
                name="dataset"
                value="decisions"
                checked={selectedDataset === 'decisions'}
                onChange={() => setSelectedDataset('decisions')}
              />
              <strong>Multi-Agent Decisions</strong> (Agent names, priorities, rationales, dispatch actions)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="radio"
                name="dataset"
                value="irrigation"
                checked={selectedDataset === 'irrigation'}
                onChange={() => setSelectedDataset('irrigation')}
              />
              <strong>Irrigation Switching Events</strong> (Pump ON/OFF, modes, microclimate conditions)
            </label>
          </div>

          <button className="btn btn-primary" onClick={handleDownloadCsv}>
            <Download size={16} /> Download {selectedDataset.toUpperCase()} CSV File
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><BarChart3 size={18} /> Session Agronomic Summary</span>
            <span className="badge badge-blue">Telemetry Metrics</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Filtered Telemetry Frames</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4 }}>
                {filteredSensors.length}
              </div>
            </div>

            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Irrigation Events (ON / OFF)</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d', marginTop: 4 }}>
                {irrigationSummary.onCount} ON / {irrigationSummary.offCount} OFF
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Manual Overrides: {irrigationSummary.manualCount}
              </div>
            </div>

            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Agent Reasoning Steps</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ca8a04', marginTop: 4 }}>
                {filteredDecisions.length}
              </div>
            </div>

            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Logged Alerts &amp; Warnings</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
                {filteredAlerts.length}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 10, background: '#ecfdf5', borderRadius: 6, fontSize: '0.8rem', color: '#065f46' }}>
            Data persistence powered by SQLite ORM. All records survive local server restarts.
          </div>
        </div>
      </div>

      {/* Charts Row: Sensor History & Navigation Decision Summary */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Droplets size={18} /> Sensor History Trends</span>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="moisture" stroke="#15803d" strokeWidth={2} name="Soil Moisture" />
                <Line type="monotone" dataKey="temp" stroke="#dc2626" strokeWidth={2} name="Temp (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#0284c7" strokeWidth={2} name="Humidity (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><Compass size={18} /> Navigation Decision Summary</span>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={navCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#15803d" name="Decision Count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts by Type Breakdown */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><AlertTriangle size={18} color="#b45309" /> Alerts by Category</span>
          <span className="badge badge-amber">{alertsByCategory.length} Categories</span>
        </div>
        {alertsByCategory.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {alertsByCategory.map(item => (
              <div key={item.category} style={{ padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.78rem', color: '#92400e', fontWeight: 700 }}>{item.category}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309', marginTop: 4 }}>{item.count}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.25rem' }}>
            No alerts recorded in the selected date range.
          </div>
        )}
      </div>
    </div>
  );
}
