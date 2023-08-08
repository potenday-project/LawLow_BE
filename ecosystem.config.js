module.exports = {
  apps: [
    {
      name: 'lawlow', // pm2 name
      script: './node_modules/.bin/nest', // 앱 실행 스크립트
      args: 'start', // 앱 실행 스크립트
      exec_mode: 'cluster', // fork, cluster 모드 중 선택
      watch: false, // 파일이 변경되었을 때 재시작 할지 선택
      instances: '0', // 클러스터 모드 사용 시 생성할 인스턴스 수(max/0은 CPU 수만큼 자동으로 생성)
      merge_logs: true, // 클러스터 모드 사용 시 각 클러스터에서 생성되는 로그를 한 파일로 합쳐준다.
      out_file: '/dev/null', // outlog 저장 경로 설정(/dev/null은 outlog 미저장)
      error_file: '~/lawlow_logs/error', // errorlog 저장 경로 설정(/dev/null은 errorlog 미저장)
      autorestart: true, // 프로그램이 멈추면 자동으로 재시작한다.
      max_memory_restart: '512M', // 프로그램의 메모리 크기가 일정 크기 이상이 되면 재시작한다.
      time: true, // log에 시간을 표시한다.
      increment_var: 'INSTANCE_ID', // 포트 번호를 자동으로 증가시킨다.
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production', // 운영 환경설정 (--env production 옵션으로 지정할 수 있다.)
      },
    },
  ],
};
