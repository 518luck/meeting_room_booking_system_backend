import { Booking } from '@/booking/entities/booking.entity';
import { MeetingRoom } from '@/meeting-room/entities/meeting-room.entity';
import {
  MeetingRoomUsedCountItem,
  UserBookingCountItem,
} from '@/types/statistic/statistic.service';
import { User } from '@/user/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class StatisticService {
  @InjectEntityManager()
  private entityManager: EntityManager;

  // 用户预定次数统计
  async userBookingCount(startTime: string, endTime: string) {
    const res = await this.entityManager
      .createQueryBuilder(Booking, 'b')
      .select('u.id', 'userId')
      .addSelect('u.username', 'username')
      .leftJoin(User, 'u', 'b.userId = u.id')
      .addSelect('count(1)', 'bookingCount')
      .where('b.startTime between :time1 and :time2', {
        time1: startTime,
        time2: endTime,
      })
      .addGroupBy('b.user')
      .getRawMany<UserBookingCountItem[]>();
    return res;
  }

  // 会议室使用次数统计
  async meetingRoomUsedCount(startTime: string, endTime: string) {
    const res = await this.entityManager
      .createQueryBuilder(Booking, 'b')
      .select('m.id', 'meetingRoomId')
      .addSelect('m.name', 'meetingRoomName')
      .leftJoin(MeetingRoom, 'm', 'b.roomId = m.id')
      .addSelect('count(1)', 'usedCount')
      .where('b.startTime between :time1 and :time2', {
        time1: startTime,
        time2: endTime,
      })
      .addGroupBy('b.roomId')
      .getRawMany<MeetingRoomUsedCountItem[]>();
    return res;
  }
}
