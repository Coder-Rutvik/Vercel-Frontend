import React from 'react';

const Room = ({ room, isSelected }) => {
  const isBooked = room.status === 'booked';

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
      title={`Room ${room.roomNumber} (${isBooked ? 'Booked' : 'Available'})`}
    >
      <div className="room-number">{room.roomNumber}</div>
    </div>
  );
};

export default Room;
