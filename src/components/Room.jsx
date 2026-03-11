import React from 'react';

const Room = ({ room, isSelected }) => {
  const isBooked = room.status === 'booked';
  const isAc = room.roomType === 'AC';

  const getRoomClass = () => {
    let classes = 'room';
    if (isSelected) classes += ' selected';
    else if (isBooked) classes += ' booked';
    else classes += ' available';
    return classes;
  };

  return (
    <div
      className={getRoomClass()}
      title={`Room ${room.roomNumber} - ${room.roomType || 'Standard'} (${isBooked ? 'Booked' : 'Available'})`}
    >
      <div className="room-number">{room.roomNumber}</div>
      <div className="room-type-badge" style={{ fontSize: '0.6em', opacity: 0.8, marginTop: '2px' }}>
        {isAc ? '❄️ AC' : '💨 Non'}
      </div>
    </div>
  );
};

export default Room;
