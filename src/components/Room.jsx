import React from 'react';

const Room = ({ room, isSelected, isBeingSelected, onClick }) => {
  const isBooked = room.status === 'booked';
  const price =
    room.pricePerNight != null
      ? Number(room.pricePerNight)
      : room.basePrice != null
        ? Number(room.basePrice)
        : null;
  const cap = room.capacity != null ? room.capacity : '—';

  const getRoomClass = () => {
    let classes = 'room';
    if (isSelected) classes += ' selected';
    else if (isBeingSelected) classes += ' manual-selection';
    else if (isBooked) classes += ' booked';
    else classes += ' available';
    return classes;
  };

  return (
    <div
      onClick={onClick}
      className={getRoomClass()}
      title={`Room ${room.roomNumber} · ${room.roomType || 'Standard'} · Sleeps ${cap}${price != null && !Number.isNaN(price) ? ` · ₹${Math.round(price)}/night` : ''} · ${isBooked ? 'Booked' : 'Available'}`}
    >
      <div className="room-number">{room.roomNumber}</div>
    </div>
  );
};

export default Room;
