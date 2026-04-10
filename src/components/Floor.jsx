import React from 'react';
import Room from './Room';

const Floor = ({ floor, bookedRooms, manualSelections, onRoomClick }) => {
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
              isBeingSelected={manualSelections.includes(room.roomNumber)}
              onClick={() => onRoomClick(room)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Floor;