import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { MeetingRoom } from '@/meeting-room/entities/meeting-room.entity';
import { User } from '@/user/entities/user.entity';

@Entity({ name: 'bookings' }) // 指定数据库表名为 bookings
export class Booking {
  @PrimaryGeneratedColumn({ comment: '预订ID' })
  id: number;

  @Column({
    type: 'datetime',
    comment: '会议开始时间',
  })
  startTime: Date;

  @Column({
    type: 'datetime',
    comment: '会议结束时间',
  })
  endTime: Date;

  @Column({
    length: 20,
    comment: '状态（申请中、审批通过、审批驳回、已解除）',
    default: '申请中',
  })
  status: string;

  @Column({
    length: 100,
    comment: '备注',
    default: '',
  })
  note: string;

  // --- 关联关系 ---

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' }) // 显式指定外键列名为 user_id
  user: User;

  @ManyToOne(() => MeetingRoom)
  @JoinColumn({ name: 'room_id' }) // 显式指定外键列名为 room_id
  room: MeetingRoom;

  // --- 自动生成的时间戳 ---

  @CreateDateColumn({
    comment: '创建时间',
  })
  createTime: Date;

  @UpdateDateColumn({
    comment: '更新时间',
  })
  updateTime: Date;
}
