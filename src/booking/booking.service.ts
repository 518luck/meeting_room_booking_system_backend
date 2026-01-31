import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateBookingDto } from '@/booking/dto/create-booking.dto';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  Between,
  EntityManager,
  type FindOptionsWhere,
  LessThan,
  Like,
  MoreThan,
} from 'typeorm';
import { User } from '@/user/entities/user.entity';
import { MeetingRoom } from '@/meeting-room/entities/meeting-room.entity';
import { Booking } from '@/booking/entities/booking.entity';
import { RedisService } from '@/redis/redis.service';
import { EmailService } from '@/email/email.service';

@Injectable()
export class BookingService {
  @InjectEntityManager()
  private entityManager: EntityManager;

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(EmailService)
  private emailService: EmailService;

  // 初始化数据
  async initData() {
    const user1 = await this.entityManager.findOneBy(User, {
      id: 1,
    });
    const user2 = await this.entityManager.findOneBy(User, {
      id: 2,
    });

    const room1 = await this.entityManager.findOneBy(MeetingRoom, {
      id: 3,
    });
    const room2 = await this.entityManager.findOneBy(MeetingRoom, {
      id: 6,
    });

    if (!room1 || !user1) {
      return;
    }
    if (!room2 || !user2) {
      return;
    }

    // 用户1 预约 会议室1
    const booking1 = new Booking();
    booking1.room = room1;
    booking1.user = user1;
    booking1.startTime = new Date();
    booking1.endTime = new Date(Date.now() + 1000 * 60 * 60);
    await this.entityManager.save(Booking, booking1);

    // 用户2 预约 会议室2
    const booking2 = new Booking();
    booking2.room = room2;
    booking2.user = user2;
    booking2.startTime = new Date();
    booking2.endTime = new Date(Date.now() + 1000 * 60 * 60);
    await this.entityManager.save(Booking, booking2);

    // 用户2 预约 会议室1
    const booking3 = new Booking();
    booking3.room = room1;
    booking3.user = user2;
    booking3.startTime = new Date();
    booking3.endTime = new Date(Date.now() + 1000 * 60 * 60);
    await this.entityManager.save(Booking, booking3);

    // 用户1 预约 会议室2
    const booking4 = new Booking();
    booking4.room = room2;
    booking4.user = user1;
    booking4.startTime = new Date();
    booking4.endTime = new Date(Date.now() + 1000 * 60 * 60);
    await this.entityManager.save(Booking, booking4);
  }

  // list 预约列表
  async find(
    pageNo: number,
    pageSize: number,
    username?: string,
    meetingRoomName?: string,
    meetingRoomPosition?: string,
    bookingTimeRangeStart?: number,
    bookingTimeRangeEnd?: number,
  ) {
    const skipCount = (pageNo - 1) * pageSize;

    // 1. 初始化一个空的查询条件对象
    // 📝 FindOptionsWhere 是 TypeORM 内置类型，表示查询条件的结构
    const where: FindOptionsWhere<Booking> = {};

    // 2. 动态判断并添加条件
    // 如果 username 有值（不为 undefined 或空字符串）
    if (username) {
      where.user = {
        username: Like(`%${username}%`),
      };
    }

    // 组合 room 的查询条件
    if (meetingRoomName || meetingRoomPosition) {
      where.room = {}; // 初始化 room 对象
      if (meetingRoomName) {
        where.room.name = Like(`%${meetingRoomName}%`);
      }
      if (meetingRoomPosition) {
        where.room.location = Like(`%${meetingRoomPosition}%`);
      }
    }

    // 时间范围必须两个都有值才进行范围查询
    if (bookingTimeRangeStart && bookingTimeRangeEnd) {
      where.startTime = Between(
        new Date(bookingTimeRangeStart),
        new Date(bookingTimeRangeEnd),
      );
    }

    //findAndCount = find(查询数据) + count(查询数据总数)
    const [bookings, totalCount] = await this.entityManager.findAndCount(
      Booking,
      {
        // 只查询需要的字段，避免查询所有字段
        // select: {
        //   id: true,
        //   startTime: true,
        //   user: {
        //     id: true,
        //     nickName: true,
        //   },
        // },
        where,
        relations: {
          user: true,
          room: true,
        },
        skip: skipCount,
        take: pageSize,
      },
    );

    return {
      bookings: bookings.map((item) => {
        delete item.user.password;
        return item;
      }),
      totalCount,
    };
  }

  //申请预定
  async add(bookingDto: CreateBookingDto, userId: number) {
    // 1. 检查会议室是否存在
    const meetingRoom = await this.entityManager.findOneBy(MeetingRoom, {
      id: bookingDto.meetingRoomId,
    });
    if (!meetingRoom) {
      throw new BadRequestException('会议室不存在');
    }

    // 2. 检查用户是否存在
    const user = await this.entityManager.findOneBy(User, {
      id: userId,
    });
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const booking = new Booking();
    booking.room = meetingRoom;
    booking.user = user;
    booking.startTime = new Date(bookingDto.startTime);
    booking.endTime = new Date(bookingDto.endTime);

    // 3. 检查时间是否冲突
    const conflictBooking = await this.entityManager.findOneBy(Booking, {
      room: {
        id: meetingRoom.id,
      },
      startTime: LessThan(booking.endTime), // 现有开始 < 新结束
      endTime: MoreThan(booking.startTime), // 现有结束 > 新开始
    });

    if (conflictBooking) {
      throw new BadRequestException('时间冲突');
    }
    // 4. 保存预约
    await this.entityManager.save(Booking, booking);
  }

  // 审批通过预定
  async apply(id: number) {
    await this.entityManager.update(
      Booking,
      {
        id,
      },
      {
        status: '审批通过',
      },
    );
    return 'success';
  }

  // 审批驳回预定
  async reject(id: number) {
    await this.entityManager.update(
      Booking,
      {
        id,
      },
      {
        status: '审批驳回',
      },
    );
    return 'success';
  }

  // 取消预定
  async unbind(id: number) {
    await this.entityManager.update(
      Booking,
      {
        id,
      },
      {
        status: '已解除',
      },
    );
    return 'success';
  }

  // 催办
  async urge(id: number) {
    const flag = await this.redisService.get('urge_' + id);

    if (flag) {
      return '半小时内只能催办一次，请耐心等待';
    }

    let email = await this.redisService.get('admin_email');

    if (!email) {
      const admin = await this.entityManager.findOne(User, {
        select: {
          email: true,
        },
        where: {
          isAdmin: true,
        },
      });

      if (!admin) {
        throw new BadRequestException('管理员不存在');
      }
      email = admin.email;

      await this.redisService.set('admin_email', admin.email);
    }

    await this.emailService.sendMail({
      to: email,
      subject: '预定申请催办提醒',
      html: `id 为 ${id} 的预定申请正在等待审批`,
    });

    await this.redisService.set('urge_' + id, 1, 60 * 30);
  }
}
