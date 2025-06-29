# 온라인 면접 시스템

개발자의 기술 역량, 인성, 문제 해결 능력을 평가하는 온라인 면접 플랫폼입니다.

## 🎯 프로젝트 상태

### ✅ 완료된 기능
- **통합 서버 구조**: Express + Next.js 단일 서버 구성
- **백엔드 API**: 8개 주요 라우트 완전 구현
- **프론트엔드**: Next.js 15 + TypeScript + Tailwind CSS
- **데이터베이스**: SQLite 스키마 및 자동 초기화
- **인증 시스템**: JWT 기반 로그인/회원가입 (오류 해결 완료)
- **관리자 로그인**: 테스트 완료 ✅
- **지원자 회원가입/로그인**: 테스트 완료 ✅
- **데이터베이스 저장**: 회원 정보 정상 저장 확인 ✅
- **질문 관리 UI**: JSON 업로드, 조회, 삭제 기능 완료 ✅
- **관리자 대시보드**: 통계 카드, 빠른 액션 메뉴 구현 ✅
- **지원자 테스트 안내**: 부정행위 방지 안내 및 동의 페이지 ✅
- **환경 설정**: .env 파일 자동 생성 및 JWT 설정 완료 ✅

### 🚧 개발 예정 기능
- 테스트 세션 진행 UI (실제 문제 풀이 인터페이스)
- 실시간 평가 시스템
- 실시간 부정행위 감지 및 차단
- 상세 통계 및 차트 시각화

## 🏗️ 프로젝트 구조

이 프로젝트는 **Express 서버**가 **Next.js 프론트엔드**를 함께 서빙하는 **통합 구조**로 설계되었습니다.

```
Vibecoding-challenge/
├── server.js              # Express + Next.js 통합 서버
├── package.json           # 루트 패키지 설정
├── .env                   # 환경 변수 (자동 생성) ✅
├── .gitignore             # Git 무시 파일
├── backend/               # 백엔드 API (완료)
│   ├── config/
│   │   └── database.js    # SQLite 데이터베이스 설정
│   ├── middleware/
│   │   └── auth.js        # JWT 인증 미들웨어
│   ├── routes/            # API 라우트 (8개 완성)
│   │   ├── auth.js        # 인증 (로그인/회원가입) ✅
│   │   ├── users.js       # 사용자 관리 ✅
│   │   ├── candidates.js  # 지원자 관리 ✅
│   │   ├── questions.js   # 질문 관리 ✅
│   │   ├── testSessions.js # 테스트 세션 ✅
│   │   ├── evaluations.js # 평가 관리 ✅
│   │   ├── dashboard.js   # 대시보드 통계 ✅
│   │   └── config.js      # 시스템 설정 ✅
│   └── models/            # 데이터 모델 (향후 확장)
├── frontend/              # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/           # App Router 페이지
│   │   │   ├── auth/      # 인증 페이지 ✅
│   │   │   ├── admin/     # 관리자 페이지 ✅
│   │   │   │   ├── dashboard/ # 관리자 대시보드 ✅
│   │   │   │   └── questions/ # 질문 관리 페이지 ✅
│   │   │   └── candidate/ # 지원자 페이지 ✅
│   │   │       └── test/  # 테스트 안내 페이지 ✅
│   │   ├── components/    # React 컴포넌트
│   │   │   ├── ui/        # 기본 UI 컴포넌트 ✅
│   │   │   ├── common/    # 공통 컴포넌트 ✅
│   │   │   └── admin/     # 관리자 전용 컴포넌트 ✅
│   │   ├── hooks/         # 커스텀 훅 ✅
│   │   ├── store/         # Zustand 상태 관리 ✅
│   │   ├── types/         # TypeScript 타입 정의 ✅
│   │   ├── utils/         # 유틸리티 함수 ✅
│   │   └── constants/     # 상수 정의 ✅
│   └── package.json       # 프론트엔드 패키지
├── questions/             # 질문 데이터 파일 ✅
│   ├── interview_questions_csharp_mssql.json
│   ├── interview_questions_html_js.json
│   ├── interview_questions_java_mariadb.json
│   ├── interview_questions_personality.json
│   └── interview_questions_problem_solving.json
├── database/              # SQLite 데이터베이스 파일
│   └── interview.db       # 자동 생성된 DB
├── uploads/               # 업로드된 파일
└── design/                # 설계 문서
```

## 🚀 실행 방법

### 1. 의존성 설치
```bash
# 루트 패키지 설치
npm install
```

### 2. 환경 변수 설정
`.env` 파일이 자동으로 생성되지만, 필요시 수정:
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
DB_PATH=./database/interview.db
```

### 3. 서버 실행
```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 빌드 후 실행
npm run build-start

# 프로덕션 실행
npm start
```

서버는 `http://localhost:3000`에서 실행됩니다.

### 4. 기본 관리자 계정
데이터베이스 초기화 시 자동으로 생성되는 관리자 계정:
```
📧 이메일: admin@interview.com
🔑 비밀번호: admin123!
```

## 🎯 현재 사용 가능한 기능

### 👤 인증 시스템
- ✅ **관리자 로그인**: `admin@interview.com` / `admin123!`
- ✅ **지원자 회원가입**: 이름, 이메일, 전화번호, 경력, 지원분야 입력
- ✅ **지원자 로그인**: 회원가입 후 로그인 가능
- ✅ **JWT 토큰 인증**: 안전한 세션 관리 (오류 해결 완료)
- ✅ **역할 기반 접근**: 관리자/지원자 권한 구분
- ✅ **에러 처리**: 로그인 실패 시 명확한 에러 메시지 표시

### 🖥️ 관리자 기능
- ✅ **관리자 대시보드**: 시스템 통계, 빠른 액션 메뉴
- ✅ **질문 관리**: JSON 파일 업로드, 질문 목록 조회, 필터링/검색
- ✅ **질문 상세보기**: 모달을 통한 질문 내용 확인
- ✅ **질문 삭제**: 개별 질문 삭제 기능
- ✅ **질문 데이터**: 5개 분야 질문 세트 (C#/SQL, HTML/JS, Java/MariaDB, 인성, 문제해결)

### 👨‍💼 지원자 기능
- ✅ **테스트 안내 페이지**: 부정행위 방지 주의사항 및 면접 안내
- ✅ **동의 체크**: 주의사항 동의 후 테스트 시작 버튼 활성화
- ✅ **권한 확인**: 지원자 전용 페이지 접근 제어

### 🔌 백엔드 API (완전 구현)
- ✅ **인증 API**: 로그인, 회원가입, 사용자 정보 조회
- ✅ **사용자 관리 API**: CRUD, 페이지네이션, 검색
- ✅ **지원자 관리 API**: 상태 관리, 통계 조회
- ✅ **질문 관리 API**: JSON 업로드, 자동 테스트 생성
- ✅ **테스트 세션 API**: 시작, 답안 제출, 부정행위 감지
- ✅ **평가 API**: 자동 채점, 점수 계산, 상세 결과
- ✅ **대시보드 API**: 통계, 활동 로그, 차트 데이터
- ✅ **설정 API**: 테스트 구성, 시스템 정보

### 🗄️ 데이터베이스
- ✅ **SQLite 자동 초기화**: 5개 주요 테이블 생성
- ✅ **데이터 저장 테스트**: 회원가입 정보 정상 저장
- ✅ **기본 관리자 계정**: 자동 생성 및 확인

## 🛠️ 기술 스택

### 백엔드
- **Node.js + Express**: 서버 프레임워크
- **SQLite3**: 경량 데이터베이스
- **JWT**: 토큰 기반 인증
- **bcryptjs**: 비밀번호 해싱
- **multer**: 파일 업로드

### 프론트엔드
- **Next.js 15**: React 풀스택 프레임워크
- **TypeScript**: 정적 타입 언어
- **Tailwind CSS**: 유틸리티 CSS 프레임워크
- **Zustand**: 경량 상태 관리
- **React Hook Form**: 폼 관리
- **Axios**: HTTP 클라이언트

### 개발 도구
- **nodemon**: 개발 서버 자동 재시작
- **ESLint**: 코드 품질 관리
- **PostCSS**: CSS 후처리

## 📋 API 엔드포인트

### 인증 (테스트 완료 ✅)
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입
- `GET /api/auth/me` - 현재 사용자 정보
- `POST /api/auth/logout` - 로그아웃

### 사용자 관리
- `GET /api/users` - 사용자 목록 (관리자)
- `GET /api/users/:id` - 특정 사용자 조회
- `PUT /api/users/:id` - 사용자 정보 수정
- `DELETE /api/users/:id` - 사용자 삭제 (관리자)

### 지원자 관리
- `GET /api/candidates` - 지원자 목록 (관리자)
- `GET /api/candidates/:id` - 특정 지원자 조회
- `PATCH /api/candidates/:id/status` - 지원자 상태 변경
- `GET /api/candidates/stats/overview` - 지원자 통계

### 질문 관리
- `GET /api/questions` - 질문 목록
- `POST /api/questions/upload` - JSON 파일 업로드 (관리자)
- `GET /api/questions/:id` - 특정 질문 조회
- `DELETE /api/questions/:id` - 질문 삭제 (관리자)
- `POST /api/questions/generate-test` - 테스트용 질문 생성

### 테스트 세션
- `POST /api/test-sessions` - 테스트 세션 생성 (관리자)
- `POST /api/test-sessions/:id/start` - 테스트 시작
- `POST /api/test-sessions/:id/answers` - 답안 제출
- `POST /api/test-sessions/:id/complete` - 테스트 완료
- `POST /api/test-sessions/:id/cheating` - 부정행위 신고
- `GET /api/test-sessions/:id` - 테스트 세션 조회

### 평가 관리
- `POST /api/evaluations` - 평가 생성 (관리자)
- `GET /api/evaluations` - 평가 목록 (관리자)
- `GET /api/evaluations/:id` - 특정 평가 조회
- `PATCH /api/evaluations/:id/notes` - 평가 메모 수정

### 대시보드
- `GET /api/dashboard/admin/overview` - 관리자 대시보드
- `GET /api/dashboard/candidate/overview` - 지원자 대시보드
- `GET /api/dashboard/admin/recent-activities` - 최근 활동
- `GET /api/dashboard/admin/system-stats` - 시스템 통계

### 설정
- `GET /api/config/test-configs` - 테스트 설정 목록
- `GET /api/config/test-configs/active` - 활성 테스트 설정
- `POST /api/config/test-configs` - 테스트 설정 생성
- `PUT /api/config/test-configs/:id` - 테스트 설정 수정
- `DELETE /api/config/test-configs/:id` - 테스트 설정 삭제
- `GET /api/config/system-info` - 시스템 정보

### Health Check
- `GET /api/health` - 서버 상태 확인

## 🗄️ 데이터베이스 스키마

### Users (사용자) ✅
- 기본 정보: 이메일, 비밀번호, 이름, 역할
- 지원자 정보: 전화번호, 경력, 지원분야
- 상태 관리: 지원 상태, 테스트 세션 연결

### Questions (질문) ✅
- 분류: 타입, 형식, 난이도, 경력 수준, 분야
- 내용: 질문 내용, 선택지, 정답, 키워드
- 메타데이터: 점수, 생성/수정 일시

### Test Sessions (테스트 세션) ✅
- 세션 정보: 지원자, 상태, 시작/완료 시간
- 테스트 데이터: 질문 목록, 답안, 남은 시간
- 부정행위: 시도 횟수, 포커스 잃은 횟수

### Evaluations (평가) ✅
- 점수: 기술/인성/문제해결/총점
- 상세 결과: 문항별 채점 결과
- 메타데이터: 평가자, 평가 일시, 메모

### Test Configs (테스트 설정) ✅
- 시간 설정: 총 테스트 시간
- 질문 구성: 타입별 문항 수, 난이도 분포
- 시스템 설정: 부정행위 허용도

## 🔒 보안 기능

- ✅ **JWT 인증**: 안전한 토큰 기반 인증
- ✅ **권한 기반 접근**: 역할별 API 접근 제어
- ✅ **SQL Injection 방지**: 파라미터화된 쿼리
- ✅ **비밀번호 해싱**: bcryptjs 사용
- ✅ **파일 업로드 보안**: 파일 타입 및 크기 제한
- 🚧 **부정행위 방지**: 포커스 감지, 단축키 차단 (UI 개발 예정)

## 🧪 테스트 방법

### 1. 서버 실행 후 브라우저에서 접속
```
http://localhost:3000
```

### 2. 관리자 로그인 테스트
```
이메일: admin@interview.com
비밀번호: admin123!
```

### 3. 지원자 회원가입 테스트
- 홈페이지에서 "지원자 회원가입" 클릭
- 필수 정보 입력 (이름, 이메일, 전화번호, 경력, 지원분야)
- 회원가입 완료 후 로그인 테스트

### 4. API 테스트
```bash
# Health Check
curl http://localhost:3000/api/health

# 로그인 테스트
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@interview.com","password":"admin123!"}'
```

## 📝 다음 개발 단계

### 우선순위 1: 관리자 UI
- [x] 질문 관리 페이지 (JSON 업로드 인터페이스) ✅
- [x] 관리자 대시보드 (기본 통계 카드) ✅
- [ ] 지원자 목록 및 관리 페이지
- [ ] 테스트 세션 생성 및 관리
- [ ] 평가 결과 조회 및 분석

### 우선순위 2: 지원자 UI
- [x] 테스트 안내 페이지 (부정행위 방지 안내) ✅
- [ ] 테스트 응시 인터페이스 (실제 문제 풀이)
- [ ] 실시간 시간 관리 및 타이머
- [ ] 답안 저장 및 제출
- [ ] 결과 조회 페이지

### 우선순위 3: 고급 기능
- [ ] 실시간 부정행위 감지 (포커스 감지, 단축키 차단)
- [ ] 상세 통계 및 차트 시각화
- [ ] 실시간 채팅 지원
- [ ] 파일 업로드 인터페이스
- [ ] 백그라운드 작업 처리

## 🤝 기여 방법

1. 이 저장소를 fork합니다
2. 새 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 push합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

MIT License

## 👥 개발자

- **Backend API**: 완전 구현 완료
- **Frontend Structure**: 기본 구조 완료
- **Database**: SQLite 스키마 및 초기화 완료
- **Authentication**: JWT 인증 시스템 완료

---

> **현재 상태**: 백엔드 API 완료, 인증 시스템 안정화, 관리자 질문 관리 UI 구현 완료. 관리자는 질문을 업로드하고 관리할 수 있으며, 지원자는 테스트 안내를 확인할 수 있습니다. 다음 단계는 실제 테스트 응시 인터페이스 개발입니다. 