import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MeetingRoom } from '@/meeting-room/entities/meeting-room.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MeetingRoomService {
  @InjectRepository(MeetingRoom)
  private repository: Repository<MeetingRoom>;

  //初始化数据
  async initData() {
    const room1 = new MeetingRoom();
    room1.name = '木星';
    room1.capacity = 10;
    room1.equipment = '白板';
    room1.location = '一层西';

    const room2 = new MeetingRoom();
    room2.name = '金星';
    room2.capacity = 5;
    room2.equipment = '';
    room2.location = '二层东';

    const room3 = new MeetingRoom();
    room3.name = '天王星';
    room3.capacity = 30;
    room3.equipment = '白板，电视';
    room3.location = '三层东';

    await this.repository.save([room1, room2, room3]);
  }

  //查询会议室列表
  async find(pageNo: number, pageSize: number) {
    if (pageNo < 1) {
      throw new BadRequestException('页码必须大一1');
    }

    const skipCount = (pageNo - 1) * pageSize;

    //findAndCount 返回两个参数，第一个参数是查询结果，第二个参数是总条数
    const [meetingRooms, totalCount] = await this.repository.findAndCount({
      //skip 跳过多少条数据(偏移量)
      skip: skipCount,
      //take 取多少条数据(每页显示多少条)
      take: pageSize,
    });

    return {
      meetingRooms,
      totalCount,
    };
  }

  // 会议室新增
  async create(meetingRoomDto: CreateMeetingRoomDto) {
    // 查询是否有重名的会议室,findOneBy---简化版findOne
    const room = await this.repository.findOneBy({
      name: meetingRoomDto.name,
    });
    if (room) {
      throw new BadRequestException('会议室名称已存在');
    }
    return await this.repository.insert(meetingRoomDto);
  }

  // 会议室更新
  async update(meetingRoomDto: UpdateMeetingRoomDto) {
    const meetingRoom = await this.repository.findOneBy({
      id: meetingRoomDto.id,
    });

    if (!meetingRoom) {
      throw new BadRequestException('会议室不存在');
    }

    if (!meetingRoomDto.capacity) return;
    meetingRoom.capacity = meetingRoomDto.capacity;

    if (!meetingRoomDto.location) return;
    meetingRoom.location = meetingRoomDto.location;

    if (!meetingRoomDto.name) return;
    meetingRoom.name = meetingRoomDto.name;

    if (!meetingRoomDto.description) return;
    meetingRoom.description = meetingRoomDto.description;

    if (!meetingRoomDto.equipment) return;
    meetingRoom.equipment = meetingRoomDto.equipment;

    await this.repository.update(
      // 第一次查询id 是否存在  meetingRoom是替换内容
      {
        id: meetingRoom.id,
      },
      meetingRoom,
    );

    return 'success';
  }

  findAll() {
    return `This action returns all meetingRoom`;
  }

  findOne(id: number) {
    return `This action returns a #${id} meetingRoom`;
  }

  remove(id: number) {
    return `This action removes a #${id} meetingRoom`;
  }
}
