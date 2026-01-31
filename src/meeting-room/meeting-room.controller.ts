import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  DefaultValuePipe,
  Query,
  Put,
  HttpStatus,
} from '@nestjs/common';
import { MeetingRoomService } from '@/meeting-room/meeting-room.service';
import { CreateMeetingRoomDto } from '@/meeting-room/dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from '@/meeting-room/dto/update-meeting-room.dto';
import { generateParseIntPipe } from '@/utils';
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequireLogin } from '@/custom.decorator';
import { MeetingRoomVo } from '@/meeting-room/vo/meeting-room.vo';
import { MeetingRoomListVo } from '@/meeting-room/vo/meeting-room-list.vo';

@ApiTags('会议室模块')
@Controller('meeting-room')
export class MeetingRoomController {
  constructor(private readonly meetingRoomService: MeetingRoomService) {}

  // 获取会议室列表 + 过滤
  @ApiBearerAuth()
  @ApiQuery({
    name: 'pageNo',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'name',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'capacity',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'equipment',
    type: String,
    required: false,
  })
  @ApiResponse({
    type: MeetingRoomListVo,
  })
  @Get('list')
  async list(
    //DefaultValuePipe 用于设置默认值 ; generateParseIntPipe 用于将字符串转换为整数
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(10),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @Query('name') name?: string,
    @Query('capacity') capacity?: number,
    @Query('equipment') equipment?: string,
  ) {
    return await this.meetingRoomService.find({
      pageNo,
      pageSize,
      name,
      capacity,
      equipment,
    });
  }

  // 会议室新增
  @ApiBearerAuth()
  @ApiBody({
    type: CreateMeetingRoomDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '会议室名字已存在',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MeetingRoomVo,
  })
  @Post('create')
  create(@Body() meetingRoomDto: CreateMeetingRoomDto) {
    return this.meetingRoomService.create(meetingRoomDto);
  }

  // 会议室更新
  @ApiBearerAuth()
  @ApiBody({
    type: UpdateMeetingRoomDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '会议室不存在',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success',
  })
  @Put('update')
  update(@Body() meetingRoomDtp: UpdateMeetingRoomDto) {
    return this.meetingRoomService.update(meetingRoomDtp);
  }

  // 回显的接口
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success',
    type: MeetingRoomVo,
  })
  @Get(':id')
  find(@Param('id') id: number) {
    return this.meetingRoomService.findById(id);
  }

  // 会议室删除
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success',
  })
  @ApiBearerAuth()
  @RequireLogin()
  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.meetingRoomService.delete(id);
  }

  @Get()
  findAll() {
    return this.meetingRoomService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingRoomService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingRoomService.remove(+id);
  }
}
