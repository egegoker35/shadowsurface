module.exports = {
  apps: [
    {
      name: 'shadowsurface-app',
      script: 'npm',
      args: 'run start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: '10s',
      log_file: './logs/app.log',
      out_file: './logs/app-out.log',
      error_file: './logs/app-err.log',
      merge_logs: true,
    },
    {
      name: 'shadowsurface-worker',
      script: 'npm',
      args: 'run worker',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '1G',
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s',
      log_file: './logs/worker.log',
      out_file: './logs/worker-out.log',
      error_file: './logs/worker-err.log',
      merge_logs: true,
    },
  ],
};
