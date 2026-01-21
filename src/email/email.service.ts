import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
};

interface NodemailerError extends Error {
  code?: string;
  response?: string;
  responseCode?: number;
  command?: string;
  rejected?: string[];
}

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = createTransport({
      host: configService.get<string>('nodemailer_host'),
      port: configService.get<number>('nodemailer_port'),
      secure: false,
      auth: {
        user: configService.get<string>('nodemailer_auth_user'),
        pass: configService.get<string>('nodemailer_auth_pass'),
      },
    });
  }

  async sendMail({ to, subject, html }: SendMailOptions) {
    try {
      await this.transporter.sendMail({
        from: {
          name: '会议室预定系统',
          address:
            this.configService.get<string>('nodemailer_auth_user') ||
            '1512013298@qq.com',
        },
        to,
        subject,
        html,
      });
    } catch (err: unknown) {
      const error = err as NodemailerError;
      // 1. 打印内部日志供开发者排查
      console.error('邮件发送失败详情:', error);

      // 2. 根据错误码返回更具体的信息
      if (error.responseCode === 550) {
        throw new HttpException(
          '邮件发送失败：收件人地址不存在或被拒收',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 3. 通用错误抛出
      throw new HttpException(
        `邮件服务异常: ${error.message || '未知错误'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
