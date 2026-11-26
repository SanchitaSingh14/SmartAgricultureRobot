import React from 'react';
import { Compass, Radio, RotateCcw, Info } from 'lucide-react';

export default function RobotDigitalTwinPage({ robotState, latestSensors, onResetSim }) {
  const robot = robotState || { pos_x: 0, pos_y: 0, heading: 0, current_action: 'STOP', pump_active: false };
  const sensors = latestSensors || { left_distance: 50, center_distance: 50, right_distance: 50 };

  // Arena bounds mapping (clamp pos_x and pos_y to arena center visually)
  const arenaWidth = 460;
  const arenaHeight = 360;
  const centerX = arenaWidth / 2;
  const centerY = arenaHeight / 2;

  // Scale: 1 meter = 40 pixels
  const scale = 30;
  const displayX = Math.max(30, Math.min(arenaWidth - 30, centerX + (robot.pos_x * scale)));
  const displayY = Math.max(30, Math.min(arenaHeight - 30, centerY - (robot.pos_y * scale)));

  return (
    <div className="page-body">
      {/* Alert banner for virtual simulation clarity */}
      <div style={{
        background: '#ecfdf5',
        border: '1px solid #a7f3d0',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <Info color="#047857" size={20} />
        <div style={{ fontSize: '0.85rem', color: '#065f46' }}>
          <strong>Virtual Digital Twin:</strong> This visualization renders the kinematics, servo sweeps, and spatial pathing computed by the Python Navigation Agent. No physical wheels or hardware are being operated.
        </div>
      </div>

      <div className="grid-2">
        {/* Visual Arena */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Compass size={18} /> 2D Virtual Farm Arena Simulation</span>
            <span className="badge badge-green">Heading: {robot.heading?.toFixed(0)}°</span>
          </div>

          <div className="twin-arena" style={{ width: '100%', height: arenaHeight, position: 'relative' }}>
            {/* Furrow crop lines */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '20%', width: 2, background: 'rgba(34,197,94,0.2)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '40%', width: 2, background: 'rgba(34,197,94,0.2)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '60%', width: 2, background: 'rgba(34,197,94,0.2)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '80%', width: 2, background: 'rgba(34,197,94,0.2)' }} />

            {/* Simulated Virtual Obstacles */}
            <div style={{
              position: 'absolute',
              top: centerY - 90,
              left: centerX - 25,
              width: 50,
              height: 30,
              background: '#94a3b8',
              borderRadius: 6,
              border: '2px dashed #475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#1e293b'
            }}>
              OBSTACLE
            </div>

            {/* Virtual Robot Representation */}
            <div 
              className="virtual-robot"
              style={{
                left: `${displayX - 30}px`,
                top: `${displayY - 30}px`,
                transform: `rotate(${robot.heading}deg)`,
                borderColor: robot.pump_active ? '#dc2626' : '#22c55e'
              }}
            >
              {/* Radar beam lines */}
              <div className="radar-beam" style={{ height: Math.min(60, sensors.center_distance || 30) }} />
              <Radio size={18} color={robot.pump_active ? '#ef4444' : '#22c55e'} />
              <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>AGRI</span>
            </div>

            {/* Water spray animation indicator if pump active */}
            {robot.pump_active && (
              <div style={{
                position: 'absolute',
                left: `${displayX - 45}px`,
                top: `${displayY - 45}px`,
                width: 90,
                height: 90,
                borderRadius: '50%',
                border: '2px solid rgba(59, 130, 246, 0.6)',
                background: 'rgba(59, 130, 246, 0.15)',
                pointerEvents: 'none'
              }} />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Grid Pos: ({robot.pos_x?.toFixed(1)}m, {robot.pos_y?.toFixed(1)}m)
            </span>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '2px 8px' }} onClick={onResetSim}>
              <RotateCcw size={14} /> Center Robot
            </button>
          </div>
        </div>

        {/* Ultrasonic Scan Radar & Kinematics Stats */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Radio size={18} /> HC-SR04 + Servo Tri-Directional Scan</span>
            <span className="badge badge-blue">Pin 5/18 + Servo Pin 13</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Ultrasonic Gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>LEFT (30°)</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: sensors.left_distance <= 20 ? '#dc2626' : '#0f172a' }}>
                  {sensors.left_distance ?? '--'} <span style={{ fontSize: '0.8rem' }}>cm</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: sensors.left_distance <= 20 ? '#dc2626' : '#15803d' }}>
                  {sensors.left_distance <= 20 ? 'OBSTRUCTED' : 'CLEAR'}
                </div>
              </div>

              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '2px solid #22c55e' }}>
                <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700 }}>CENTER (90°)</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: sensors.center_distance <= 20 ? '#dc2626' : '#15803d' }}>
                  {sensors.center_distance ?? '--'} <span style={{ fontSize: '0.8rem' }}>cm</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: sensors.center_distance <= 20 ? '#dc2626' : '#15803d' }}>
                  {sensors.center_distance <= 20 ? 'OBSTRUCTED' : 'CLEAR'}
                </div>
              </div>

              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>RIGHT (150°)</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: sensors.right_distance <= 20 ? '#dc2626' : '#0f172a' }}>
                  {sensors.right_distance ?? '--'} <span style={{ fontSize: '0.8rem' }}>cm</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: sensors.right_distance <= 20 ? '#dc2626' : '#15803d' }}>
                  {sensors.right_distance <= 20 ? 'OBSTRUCTED' : 'CLEAR'}
                </div>
              </div>
            </div>

            {/* Current Navigation Decision Card */}
            <div style={{ padding: 14, background: '#f1f5f9', borderRadius: 8, borderLeft: '4px solid #15803d' }}>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Active Navigation Action:</strong>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d', margin: '4px 0' }}>
                {robot.current_action}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                {robot.current_action === 'MOVE_FORWARD' && 'Center distance exceeds 20 cm obstacle boundary. Robot drives straight along crop row.'}
                {robot.current_action === 'TURN_LEFT' && 'Center distance <= 20 cm. Left flank offers significantly more clearance than right flank.'}
                {robot.current_action === 'TURN_RIGHT' && 'Center distance <= 20 cm. Right flank offers significantly more clearance than left flank.'}
                {robot.current_action === 'STOP' && 'Full stop: Both flanks blocked or ultrasonic reading is invalid/out-of-range.'}
              </p>
            </div>

            {/* Hardware mapping reference */}
            <div style={{ fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
              <div><strong>Firmware Pinout:</strong> TRIG → GPIO 5 | ECHO → GPIO 18 | SERVO → GPIO 13</div>
              <div style={{ marginTop: 2 }}><strong>Virtual Actuators:</strong> LED Pump Indicator → GPIO 26 | Servo Sweep → 30° / 90° / 150°</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

