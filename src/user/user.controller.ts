import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from '@/user/user.service';
import { RegisterUserDto } from '@/user/dto/register-user.dto';
import { EmailService } from '@/email/email.service';
import { RedisService } from '@/redis/redis.service';
import { LoginUserDto } from '@/user/dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RequireLogin, UserInfo } from '@/custom.decorator';
import { UserDetailVo } from '@/user/vo/user-info.vo';
import { UpdateUserPasswordDto } from '@/user/dto/update-user-password.dto';
import { UpdateUserDto } from '@/user/dto/udpate-user.dto';
import { generateParseIntPipe } from '@/utils';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoginUserVo } from '@/user/vo/login-user.vo';
import { RefreshTokenVo } from '@/user/vo/refresh-token.vo';
import { UserListVo } from './vo/user-list.vo';
import { FileInterceptor } from '@nestjs/platform-express';
import path from 'path';
import { storage } from '@/my-file-storage';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

@ApiTags('用户管理模块')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(ConfigService)
  private configService: ConfigService;

  @Inject(EmailService)
  private emailService: EmailService;

  @Inject(RedisService)
  private redisService: RedisService;

  // 发送注册验证码
  @ApiQuery({
    name: 'address',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'xxx@xx.com',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String,
  })
  @Get('register-captcha')
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(`captcha_${address}`, code, 5 * 60);

    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  //注册
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/验证码不正确/用户已存在',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '注册成功/失败',
    type: String,
  })
  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser);
  }

  // 谷歌登录
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}
  //谷歌回调
  @Get('callback/google')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      throw new BadRequestException('google 登录失败');
    }
    const foundUser = await this.userService.findUserByEmail(req.user?.email);
    if (foundUser) {
      const vo = new LoginUserVo();
      vo.userInfo = {
        id: foundUser.id,
        username: foundUser.username,
        nickName: foundUser.nickName,
        email: foundUser.email,
        phoneNumber: foundUser.phoneNumber,
        headPic: foundUser.headPic,
        createTime: foundUser.createTime.getTime(),
        isFrozen: foundUser.isFrozen,
        isAdmin: foundUser.isAdmin,
        roles: foundUser.roles.map((item) => item.name),
        permissions: [],
      };
      // 1. flatMap 把嵌套数组拉平
      // 2. map 只取出权限的名字
      // 3. new Set() 自动完成去重
      const allPermissions = foundUser.roles.flatMap(
        (role) => role.permissions,
      );
      const uniquePermissionsMap = new Map(
        allPermissions.map((p) => [p.id, p]),
      );
      vo.userInfo.permissions = [...uniquePermissionsMap.values()];

      const tokens = this.userService.generateTokens({
        id: vo.userInfo.id,
        username: vo.userInfo.username,
        email: vo.userInfo.email,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions,
      });

      vo.accessToken = tokens.access_token;
      vo.refreshToken = tokens.refresh_token;

      res.cookie('userInfo', JSON.stringify(vo.userInfo));
      res.cookie('accessToken', vo.accessToken);
      res.cookie('refreshToken', vo.refreshToken);

      // return vo;
    } else {
      const user = await this.userService.registerByGoogleInfo(
        req.user.email,
        req.user?.firstName + ' ' + req.user?.lastName,
        req.user?.picture || '',
      );

      const vo = new LoginUserVo();
      vo.userInfo = {
        id: user.id,
        username: user.username,
        nickName: user.nickName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        headPic: user.headPic,
        createTime: user.createTime.getTime(),
        isFrozen: user.isFrozen,
        isAdmin: user.isAdmin,
        roles: [],
        permissions: [],
      };

      const tokens = this.userService.generateTokens({
        id: vo.userInfo.id,
        username: vo.userInfo.username,
        email: vo.userInfo.email,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions,
      });

      vo.accessToken = tokens.access_token;
      vo.refreshToken = tokens.refresh_token;

      res.cookie('userInfo', JSON.stringify(vo.userInfo));
      res.cookie('accessToken', vo.accessToken);
      res.cookie('refreshToken', vo.refreshToken);
    }
    res.redirect('http://localhost:3005');
  }

  // 初始化数据
  @Get('init-data')
  async initData() {
    await this.userService.initData();
    return 'done';
  }

  //用户登录
  @ApiBody({
    type: LoginUserDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户不存在/密码错误',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和 token',
    type: LoginUserVo,
  })
  @UseGuards(AuthGuard('local'))
  @Post(['login', 'admin/login'])
  userLogin(@UserInfo() vo: LoginUserVo) {
    // 调用抽取的生成 Token 方法
    const tokens = this.userService.generateTokens({
      id: vo.userInfo.id,
      username: vo.userInfo.username,
      email: vo.userInfo.email,
      roles: vo.userInfo.roles,
      permissions: vo.userInfo.permissions,
    });

    vo.accessToken = tokens.access_token;
    vo.refreshToken = tokens.refresh_token;
    return vo;
  }

  //前台用户的token刷新
  @ApiQuery({
    name: 'refreshToken',
    type: String,
    description: '刷新 token',
    required: true,
    example: 'xxxxxxxxyyyyyyyyzzzzz',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token 已失效，请重新登录',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
    type: RefreshTokenVo,
  })
  @Get(['refresh', 'admin/refresh'])
  async refresh(
    @Query('refreshToken') refreshToken: string,
    @Req() req: Request,
  ) {
    try {
      const data = this.jwtService.verify<{ userId: number }>(refreshToken);
      const isAdmin = req.url.includes('admin');

      const user = await this.userService.findUserById(data.userId, isAdmin);

      // 直接返回新的双 Token
      return this.userService.generateTokens(user);
    } catch {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  // 获取用户详情
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户详情',
    type: UserDetailVo,
  })
  @Get('info')
  @RequireLogin()
  async info(@UserInfo('userId') userId: number) {
    const user = await this.userService.findUserDetailById(userId);

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const vo = new UserDetailVo();
    vo.id = user.id;
    vo.email = user.email;
    vo.username = user.username;
    vo.headPic = user.headPic;
    vo.phoneNumber = user.phoneNumber;
    vo.nickName = user.nickName;
    vo.createTime = user.createTime;
    vo.isFrozen = user.isFrozen;

    return vo;
  }

  // 修改密码
  @ApiBearerAuth()
  @ApiBody({
    type: UpdateUserPasswordDto,
  })
  @ApiResponse({
    type: String,
    description: '验证码已失效/不正确',
  })
  @Post(['update_password', 'admin/update_password'])
  async updatePassword(@Body() passwordDto: UpdateUserPasswordDto) {
    return await this.userService.updatePassword(passwordDto);
  }

  // 发送更改密码验证码
  @ApiQuery({
    name: 'address',
    description: '邮箱地址',
    type: String,
  })
  @ApiResponse({
    type: String,
    description: '发送成功',
  })
  @Get('update_password/captcha')
  async updatePasswordCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      `update_password_captcha_${address}`,
      code,
      10 * 60,
    );

    await this.emailService.sendMail({
      to: address,
      subject: '更改密码验证码',
      html: `<p>你的更改密码验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  // 更新用户信息
  @ApiBearerAuth()
  @ApiBody({
    type: UpdateUserDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/不正确',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
    type: String,
  })
  @Post(['update', 'admin/update'])
  @RequireLogin()
  async update(
    @UserInfo('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(userId, updateUserDto);
  }

  // 发送更改用户信息验证码
  @ApiResponse({
    type: String,
    description: '发送成功',
  })
  @RequireLogin()
  @Get('update/captcha')
  async updateCaptcha(@UserInfo('email') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      `update_user_captcha_${address}`,
      code,
      10 * 60,
    );

    await this.emailService.sendMail({
      to: address,
      subject: '更改用户信息验证码',
      html: `<p>你的验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  // 冻结用户
  @ApiBearerAuth()
  @ApiQuery({
    name: 'id',
    description: 'userId',
    type: Number,
  })
  @ApiResponse({
    type: String,
    description: 'success',
  })
  @RequireLogin()
  @Get('freeze')
  async freeze(@Query('id') userId: number) {
    await this.userService.freezeUserById(userId);
    return 'success';
  }

  // 获取用户列表
  @ApiBearerAuth()
  @ApiQuery({
    name: 'pageNo',
    description: '第几页',
    type: Number,
  })
  @ApiQuery({
    name: 'pageSize',
    description: '每页多少条',
    type: Number,
  })
  @ApiQuery({
    name: 'username',
    description: '用户名',
    type: Number,
  })
  @ApiQuery({
    name: 'nickName',
    description: '昵称',
    type: Number,
  })
  @ApiQuery({
    name: 'email',
    description: '邮箱地址',
    type: Number,
  })
  @ApiResponse({
    description: '用户列表',
    type: UserListVo,
  })
  @RequireLogin()
  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(2),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @Query('username') username: string,
    @Query('nickName') nickName: string,
    @Query('email') email: string,
  ) {
    return await this.userService.findUsers({
      pageNo,
      pageSize,
      username,
      nickName,
      email,
    });
  }

  // 上传用户头像
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: 'uploads',
      storage: storage,
      limits: {
        fileSize: 1024 * 1024 * 3,
      },
      fileFilter(_, file, callback) {
        const extname = path.extname(file.originalname);
        if (['.png', '.jpg', '.gif'].includes(extname)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('只能上传图片'), false);
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('file', file);
    return file.path;
  }
}
