import React, { useState, useMemo } from 'react';
import Floor from './Floor';

const HotelVisualization = ({ hotel, bookedRooms }) => {
  const [selectedFloor, setSelectedFloor] = useState('1'); // Default to Floor 1
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all available room types dynamically or hardcode the known types
  const allFloors = [...hotel].sort((a,b) => a.floorNumber - b.floorNumber);
  
  // Memoized filter logic for instantaneous Pro-UX
  const filteredHotel = useMemo(() => {
    let filtered = [...allFloors];

    // 1. Floor Filter
    if (selectedFloor !== 'All') {
      filtered = filtered.filter(f => f.floorNumber.toString() === selectedFloor);
    }

    // Process room level filters within those floors
    return filtered.map(floor => {
        let matchingRooms = floor.rooms;

        // 2. Type Filter
        if (selectedType !== 'All') {
            matchingRooms = matchingRooms.filter(r => r.roomType === selectedType);
        }

        // 3. Status Filter
        if (selectedStatus !== 'All') {
            const isAvailable = selectedStatus === 'Available';
            matchingRooms = matchingRooms.filter(r => isAvailable ? r.status === 'not-booked' : r.status === 'booked');
        }

        // 4. Search Filter
        if (searchQuery.trim() !== '') {
            matchingRooms = matchingRooms.filter(r => r.roomNumber.toString().includes(searchQuery));
        }

        return { ...floor, rooms: matchingRooms };
    }).filter(floor => floor.rooms.length > 0); // Hide completely empty floors after filter
  }, [allFloors, selectedFloor, selectedType, selectedStatus, searchQuery]);

  return (
    <div className="hotel-visualization">
      <h2>🏢 Smart Hotel Room Dashboard</h2>

      {/* PRO UX Control Panel */}
      <div className="smart-dashboard-controls" style={{
          display: 'flex', flexWrap: 'wrap', gap: '15px', background: 'rgba(255,255,255,0.05)', 
          padding: '20px', borderRadius: '12px', marginBottom: '20px', alignItems: 'center'
      }}>
          
          <div className="control-group">
              <label style={{display:'block', fontSize:'12px', color:'#aaa', marginBottom:'5px'}}>📍 Select Floor</label>
              <select 
                value={selectedFloor} 
                onChange={(e) => setSelectedFloor(e.target.value)}
                style={{padding:'8px', borderRadius:'6px', background:'#222', color:'white', border:'1px solid #444'}}
              >
                  <option value="All">All Floors (Overview)</option>
                  {allFloors.map(f => (
                      <option key={f.floorNumber} value={f.floorNumber}>Floor {f.floorNumber}</option>
                  ))}
              </select>
          </div>

          <div className="control-group">
              <label style={{display:'block', fontSize:'12px', color:'#aaa', marginBottom:'5px'}}>💎 Room Type</label>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                style={{padding:'8px', borderRadius:'6px', background:'#222', color:'white', border:'1px solid #444'}}
              >
                  <option value="All">All Types</option>
                  <option value="Standard">Standard</option>
                  <option value="Deluxe (AC)">Deluxe (AC)</option>
                  <option value="Suite">Suite</option>
                  <option value="Premium">Premium</option>
              </select>
          </div>

          <div className="control-group">
              <label style={{display:'block', fontSize:'12px', color:'#aaa', marginBottom:'5px'}}>🚦 Status Check</label>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{padding:'8px', borderRadius:'6px', background:'#222', color:'white', border:'1px solid #444'}}
              >
                  <option value="All">All Rooms</option>
                  <option value="Available">🟢 Available Only</option>
                  <option value="Booked">🔴 Booked/Occupied</option>
              </select>
          </div>

          <div className="control-group" style={{marginLeft: 'auto'}}>
              <label style={{display:'block', fontSize:'12px', color:'#aaa', marginBottom:'5px'}}>🔍 Search Room</label>
              <input 
                  type="number" 
                  placeholder="e.g. 101" 
                  value={searchQuery}
                  onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value) setSelectedFloor('All'); // Auto open all floors to search
                  }}
                  style={{padding:'8px', borderRadius:'6px', background:'#222', color:'white', border:'1px solid #444', width:'120px'}}
              />
          </div>
      </div>

      <div className="floors-section">
        {filteredHotel.length === 0 ? (
            <div style={{color:'#aaa', textAlign:'center', padding:'40px'}}>
                <h3>No rooms match your smart filters. 🕵️‍♂️</h3>
            </div>
        ) : (
            filteredHotel.slice().reverse().map(floor => (
                <Floor
                    key={floor.floorNumber}
                    floor={floor}
                    bookedRooms={bookedRooms}
                />
            ))
        )}
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-bulb available"></div>
          <span>🟢 Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-bulb booked"></div>
          <span>🔴 Booked/Occupied</span>
        </div>
        <div className="legend-item">
          <div className="legend-bulb cleaning" style={{background:'#ffc107', boxShadow:'0 0 10px #ffc107'}}></div>
          <span>🟡 Housekeeping (Soon)</span>
        </div>
        <div className="legend-item">
          <div className="legend-bulb selected"></div>
          <span>🔵 Currently Selected</span>
        </div>
      </div>
    </div>
  );
};

export default HotelVisualization;
