export const initializeHotel = () => {
  const hotel = [];
  // 9 floors with 10 rooms each
  for (let f = 1; f <= 9; f++) {
    const floorRooms = [];
    for (let r = 1; r <= 10; r++) {
      floorRooms.push({
        roomNumber: f * 100 + r,
        status: 'not-booked',
        floor: f,
        position: r
      });
    }
    hotel.push({ floorNumber: f, rooms: floorRooms });
  }
  // Floor 10 with 7 rooms
  const floor10Rooms = [];
  for (let r = 1; r <= 7; r++) {
    floor10Rooms.push({
      roomNumber: 1000 + r,
      status: 'not-booked',
      floor: 10,
      position: r
    });
  }
  hotel.push({ floorNumber: 10, rooms: floor10Rooms });
  return hotel;
};

export const calculateOptimalRooms = (hotel, numRoomsReq) => {
    // Basic logic for visual purposes
    return { success: true, message: 'Optimization logic' };
};