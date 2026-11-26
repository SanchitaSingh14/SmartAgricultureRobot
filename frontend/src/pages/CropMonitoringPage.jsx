import React, { useState } from 'react';
import { Eye, Upload, FileImage, ShieldCheck } from 'lucide-react';
import { uploadCropImage } from '../services/api';

export default function CropMonitoringPage({ cropHistory, onRefreshCropHistory }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setCurrentResult(null);
      setErrorMsg(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const res = await uploadCropImage(selectedFile);
      setCurrentResult(res);
      if (onRefreshCropHistory) onRefreshCropHistory();
    } catch (err) {
      setErrorMsg('Failed to process image. Make sure backend is running.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-body">
      {/* Honesty Banner */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <ShieldCheck color="#1d4ed8" size={24} />
        <div style={{ fontSize: '0.85rem', color: '#1e40af' }}>
          <strong>Honest AI Architecture Notice:</strong> This module uses offline OpenCV computer vision (Excess Green Index ExG and HSV color masking) to compute foliar vigor and chlorosis ratio. It clearly labels these as visual agronomic heuristics and does not invent fake deep-learning disease classifications without verified neural weights.
        </div>
      </div>

      <div className="grid-2">
        {/* Upload & Preview Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Upload size={18} /> Upload Crop / Leaf Photo</span>
            <span className="badge badge-green">OpenCV Offline CV</span>
          </div>

          <div style={{
            border: '2px dashed #cbd5e1',
            borderRadius: 8,
            padding: '2rem 1rem',
            textAlign: 'center',
            background: '#f8fafc',
            marginBottom: '1rem'
          }}>
            {previewUrl ? (
              <div>
                <img 
                  src={previewUrl} 
                  alt="Crop preview" 
                  style={{ maxHeight: 220, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} 
                />
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6 }}>
                  {selectedFile?.name}
                </div>
              </div>
            ) : (
              <div>
                <FileImage size={40} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                  Select or drop a field crop picture
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                  Supports JPG, PNG, WEBP
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input 
              type="file" 
              accept="image/*" 
              id="crop-upload-input" 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />
            <label htmlFor="crop-upload-input" className="btn btn-outline" style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
              Browse Image
            </label>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1 }} 
              disabled={!selectedFile || isUploading}
              onClick={handleUploadSubmit}
            >
              {isUploading ? 'Analyzing...' : 'Run Vision Agent'}
            </button>
          </div>
          {errorMsg && (
            <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 8 }}>{errorMsg}</div>
          )}
        </div>

        {/* Current Analysis Result */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Eye size={18} color="#15803d" /> Canopy Feature Extraction</span>
            {currentResult && <span className="badge badge-green">{currentResult.health_status}</span>}
          </div>

          {currentResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Assessed Health Status</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  {currentResult.health_status}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <div style={{ padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Excess Green Index (ExG)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d', marginTop: 2 }}>
                    {currentResult.greenness_index ?? '--'}
                  </div>
                </div>
                <div style={{ padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Yellowing / Chlorosis Ratio</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ca8a04', marginTop: 2 }}>
                    {currentResult.yellowing_ratio ?? '--'}%
                  </div>
                </div>
              </div>

              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <strong style={{ fontSize: '0.82rem' }}>Agronomic Field Observation:</strong>
                <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4 }}>
                  {currentResult.notes}
                </p>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Engine: {currentResult.model_used}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              Upload an image to see colorimetry, vegetation metrics, and agronomic heuristics.
            </div>
          )}
        </div>
      </div>

      {/* Historical Analyses */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Eye size={18} /> Crop Scouting Inspection History</span>
          <span className="badge badge-blue">Database Audit</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Image File</th>
              <th>Health Classification</th>
              <th>ExG Index</th>
              <th>Yellowing %</th>
              <th>Observations & Agronomic Notes</th>
            </tr>
          </thead>
          <tbody>
            {(cropHistory || []).map(c => (
              <tr key={c.id}>
                <td>{new Date(c.timestamp).toLocaleTimeString()}</td>
                <td><code style={{ fontSize: '0.75rem' }}>{c.filename}</code></td>
                <td><span className="badge badge-green">{c.health_status}</span></td>
                <td><strong>{c.greenness_index}</strong></td>
                <td>{c.yellowing_ratio}%</td>
                <td style={{ fontSize: '0.8rem', color: '#475569', maxWidth: 380 }}>{c.notes}</td>
              </tr>
            ))}
            {(cropHistory || []).length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                  No historical crop inspections yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

