import React from 'react';
import Floor from './Floor';

const HotelVisualization = ({ hotel, bookedRooms }) => {
  return (
    <div className="hotel-visualization">
      <h2>Hotel Room Layout</h2>

      <div className="floors-section">
        {[...hotel].reverse().map(floor => (
          <Floor
            key={floor.floorNumber}
            floor={floor}
            bookedRooms={bookedRooms}
          />
        ))}
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-bulb available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-bulb booked"></div>
          <span>Booked/Occupied</span>
        </div>
        <div className="legend-item">
          <div className="legend-bulb selected"></div>
          <span>Currently Selected</span>
        </div>
      </div>
    </div>
  );
};

export default HotelVisualization;
