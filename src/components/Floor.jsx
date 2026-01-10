import React from 'react';
import Room from './Room';

const Floor = ({ floor, bookedRooms }) => {
  return (
    <div className="floor">
      <span className="floor-label">Floor {floor.floorNumber}</span>
      <div className="floor-content">
        <div className="lift-section">
          <div className="lift-box">↕️</div>
        </div>
        <div className="rooms-row">
          {floor.rooms.map(room => (
            <Room
              key={room.roomNumber}
              room={room}
              isSelected={bookedRooms.includes(room.roomNumber)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Floor;