import { repl } from '@nestjs/core';
import { AppModule } from '@/app.module';

// 启动 REPL 服务器
const bootstrap = async () => {
  const replServer = await repl(AppModule);
  replServer.setupHistory('.nestjs-repl-history', (err) => {
    if (err) {
      console.error('Error setting up REPL history:', err);
    }
  });
};

void bootstrap();
