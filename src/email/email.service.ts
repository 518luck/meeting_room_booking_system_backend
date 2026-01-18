import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
};

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
  }
}
