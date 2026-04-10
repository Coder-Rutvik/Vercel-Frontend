import React, { useState, useEffect } from 'react';
import './SmartLift.css';

const SmartLift = () => {
  const [liftStatus, setLiftStatus] = useState('operational'); // operational, emergency, maintenance
  const [currentFloor, setCurrentFloor] = useState(1);
  const [targetFloor, setTargetFloor] = useState(1);
  const [isMoving, setIsMoving] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);

  // Simulation: Lift moving effect
  useEffect(() => {
    if (isMoving && currentFloor !== targetFloor && liftStatus === 'operational') {
      const timer = setTimeout(() => {
        setCurrentFloor(prev => (prev < targetFloor ? prev + 1 : prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (currentFloor === targetFloor) {
      setIsMoving(false);
    }
  }, [isMoving, currentFloor, targetFloor, liftStatus]);

  const handleEmergency = () => {
    setLiftStatus('emergency');
    setEmergencyActive(prev => !prev);
    setIsMoving(false);
    
    // Play Siren Sound
    try {
      const audio = new Audio('https://www.myinstants.com/media/sounds/siren.mp3');
      audio.play();
    } catch (e) {
      console.log("Audio block");
    }

    if (!emergencyActive) {
      alert("🚨 EMERGENCY: Security & Technical Team dispatched to the Lift!");
    } else {
      setLiftStatus('operational');
    }
  };

  const requestLift = (floor) => {
    if (liftStatus !== 'operational') return;
    setTargetFloor(floor);
    setIsMoving(true);
  };

  return (
    <div className={`smart-lift-card ${liftStatus}`}>
      <div className="lift-header">
        <h3>🚀 Smart Lift System v2.0</h3>
        <div className={`status-indicator ${liftStatus}`}>
          {liftStatus === 'operational' ? '🟢 Active' : '🔴 Emergency!'}
        </div>
      </div>

      <div className="lift-display">
        <div className="floor-indicator">
          <span className="label">Floor</span>
          <span className="digit">{currentFloor}</span>
          {isMoving && <span className="direction">{targetFloor > currentFloor ? '▲' : '▼'}</span>}
        </div>
        <div className="lift-animation-track">
           <div className={`lift-car ${isMoving ? 'moving' : ''} ${liftStatus}`} 
                style={{ bottom: `${(currentFloor - 1) * 10}%` }}>
             <div className="lift-door"></div>
           </div>
        </div>
      </div>

      <div className="lift-controls">
        <div className="floor-buttons-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(f => (
            <button 
              key={f} 
              className={`floor-btn ${targetFloor === f ? 'target' : ''}`}
              onClick={() => requestLift(f)}
              disabled={liftStatus !== 'operational'}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div className="emergency-actions">
           <button className={`panic-btn ${emergencyActive ? 'active' : ''}`} onClick={handleEmergency}>
             {emergencyActive ? '🔇 STOP SIREN' : '🚨 EMERGENCY / HELP'}
           </button>
           <button className="maintenance-btn" onClick={() => setLiftStatus(prev => prev === 'maintenance' ? 'operational' : 'maintenance')}>
             🔧 Service Mode
           </button>
        </div>
      </div>

      {liftStatus === 'maintenance' && (
        <div className="lift-overlay maintenance">
            <h4>⚠️ UNDER MAINTENANCE</h4>
            <p>Technicians are working. Please use stairs.</p>
        </div>
      )}
      
      {emergencyActive && (
        <div className="lift-overlay emergency">
            <h4 className="blink">🚨 SECURITY ALERT</h4>
            <p>Security Team on the way to the lift!</p>
        </div>
      )}
    </div>
  );
};

export default SmartLift;
