#!/usr/bin/env node

/**
 * 启动开发环境所需的 Docker 服务（MySQL 和 Redis）
 * 会自动检查镜像是否存在，不存在则下载
 */

const { execSync } = require('child_process');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return null;
  }
}

function checkDockerInstalled() {
  log('\n🔍 检查 Docker 是否安装...', colors.blue);
  try {
    exec('docker --version', { silent: true });
    log('✅ Docker 已安装', colors.green);
    return true;
  } catch (error) {
    log('❌ Docker 未安装，请先安装 Docker Desktop', colors.red);
    log('下载地址: https://www.docker.com/products/docker-desktop', colors.yellow);
    return false;
  }
}

function checkDockerRunning() {
  log('\n🔍 检查 Docker 是否运行...', colors.blue);
  try {
    exec('docker ps', { silent: true });
    log('✅ Docker 正在运行', colors.green);
    return true;
  } catch (error) {
    log('❌ Docker 未运行，请启动 Docker Desktop', colors.red);
    return false;
  }
}

function checkImageExists(imageName) {
  try {
    const result = exec(`docker images -q ${imageName}`, { silent: true, ignoreError: true });
    return result && result.trim().length > 0;
  } catch (error) {
    return false;
  }
}

function checkContainerRunning(containerName) {
  try {
    const result = exec(`docker ps -q -f name=${containerName}`, { silent: true, ignoreError: true });
    return result && result.trim().length > 0;
  } catch (error) {
    return false;
  }
}

function checkContainerExists(containerName) {
  try {
    const result = exec(`docker ps -aq -f name=${containerName}`, { silent: true, ignoreError: true });
    return result && result.trim().length > 0;
  } catch (error) {
    return false;
  }
}

function pullImageIfNeeded(imageName, displayName) {
  log(`\n🔍 检查 ${displayName} 镜像...`, colors.blue);

  if (checkImageExists(imageName)) {
    log(`✅ ${displayName} 镜像已存在`, colors.green);
    return true;
  }

  log(`📥 ${displayName} 镜像不存在，开始下载...`, colors.yellow);
  try {
    exec(`docker pull ${imageName}`);
    log(`✅ ${displayName} 镜像下载完成`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${displayName} 镜像下载失败`, colors.red);
    return false;
  }
}

function startServices() {
  log('\n🚀 启动 MySQL 和 Redis 服务...', colors.blue);

  try {
    exec('docker-compose -f docker-compose.services.yml up -d');
    log('✅ 服务启动成功', colors.green);
    return true;
  } catch (error) {
    log('❌ 服务启动失败', colors.red);
    return false;
  }
}

function checkServicesHealth() {
  log('\n🏥 等待服务健康检查...', colors.blue);

  const maxRetries = 30;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const mysqlHealth = exec('docker inspect --format="{{.State.Health.Status}}" meeting_room_mysql', { silent: true, ignoreError: true });
      const redisHealth = exec('docker inspect --format="{{.State.Health.Status}}" meeting_room_redis', { silent: true, ignoreError: true });

      if (mysqlHealth && mysqlHealth.trim() === 'healthy' && redisHealth && redisHealth.trim() === 'healthy') {
        log('✅ 所有服务健康检查通过', colors.green);
        return true;
      }

      process.stdout.write('.');
      retries++;

      // 等待 1 秒
      execSync('node -e "setTimeout(() => {}, 1000)"');
    } catch (error) {
      // 继续等待
    }
  }

  log('\n⚠️  健康检查超时，但服务可能仍在启动中', colors.yellow);
  return false;
}

function showStatus() {
  log('\n📊 服务状态:', colors.blue);
  exec('docker-compose -f docker-compose.services.yml ps');
}

function showNextSteps() {
  log('\n' + '='.repeat(60), colors.green);
  log('✅ Docker 服务已就绪！', colors.green);
  log('='.repeat(60), colors.green);

  log('\n📝 接下来的步骤:', colors.blue);
  log('1. 安装依赖:');
  log('   pnpm install', colors.yellow);
  log('\n2. 启动开发服务器:');
  log('   pnpm run start:dev', colors.yellow);
  log('\n3. 访问应用:');
  log('   - API: http://localhost:3000', colors.yellow);
  log('   - API 文档: http://localhost:3000/api-doc', colors.yellow);

  log('\n💡 提示:', colors.blue);
  log('- MySQL: localhost:3306 (用户: meeting_user, 密码: meeting_password)');
  log('- Redis: localhost:6379');
  log('- 停止服务: docker-compose -f docker-compose.services.yml down');
  log('- 查看日志: docker-compose -f docker-compose.services.yml logs -f');
  log('');
}

async function main() {
  log('='.repeat(60), colors.blue);
  log('🐳 会议室预定系统 - Docker 服务启动脚本', colors.blue);
  log('='.repeat(60), colors.blue);

  // 1. 检查 Docker 是否安装
  if (!checkDockerInstalled()) {
    process.exit(1);
  }

  // 2. 检查 Docker 是否运行
  if (!checkDockerRunning()) {
    process.exit(1);
  }

  // 3. 检查并拉取镜像
  const mysqlOk = pullImageIfNeeded('mysql:8.0', 'MySQL 8.0');
  const redisOk = pullImageIfNeeded('redis:7-alpine', 'Redis 7');

  if (!mysqlOk || !redisOk) {
    log('\n❌ 镜像准备失败', colors.red);
    process.exit(1);
  }

  // 4. 启动服务
  if (!startServices()) {
    process.exit(1);
  }

  // 5. 健康检查
  checkServicesHealth();

  // 6. 显示状态
  showStatus();

  // 7. 显示后续步骤
  showNextSteps();
}

main().catch(error => {
  log(`\n❌ 发生错误: ${error.message}`, colors.red);
  process.exit(1);
});
