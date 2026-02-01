// 用户预定次数统计
export interface UserBookingCountItem {
  userId: number;
  username: string;
  bookingCount: string | number;
}

// 会议室使用次数统计
export interface MeetingRoomUsedCountItem {
  meetingRoomId: number;
  meetingRoomName: string;
  usedCount: string | number;
}
