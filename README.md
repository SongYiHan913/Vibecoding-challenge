# 온라인 면접 시스템

개발자의 기술 역량, 인성, 문제 해결 능력을 평가하는 온라인 면접 플랫폼입니다.

* 활용 AI
  - ChatGPT Pro : 일반적인 질의 응답, 설계, 프롬프트 템플릿을 통한 면접 문제 출제
  - Cursor AI (claude-4-sonnet) : 시스템 설계 및 구현, 문서화

## 🎯 프로젝트 상태

### ✅ 완료된 기능
- **통합 서버 구조**: Express + Next.js 단일 서버 구성
- **백엔드 API**: 8개 주요 라우트 완전 구현
- **프론트엔드**: Next.js 15 + TypeScript + Tailwind CSS
- **데이터베이스**: SQLite 스키마 및 자동 초기화
- **인증 시스템**: JWT 기반 로그인/회원가입 (오류 해결 완료)
- **관리자 로그인**: 테스트 완료
- **지원자 회원가입/로그인**: 테스트 완료
- **데이터베이스 저장**: 회원 정보 정상 저장 확인
- **질문 관리 UI**: JSON 업로드, 조회, 삭제 기능 완료 
- **지원자 관리 UI**: 목록 조회, 필터링, 검색, 상세보기, 페이징 기능 완료 
- **관리자 대시보드**: 통계 카드, 빠른 액션 메뉴 구현 
- **지원자 테스트 안내**: 부정행위 방지 안내 및 동의 페이지 
- **환경 설정**: .env 파일 자동 생성 및 JWT 설정 완료 

## 생성형 AI 활용

### 1. 요구사항 분석/설계

* 관련 디렉토리
  * 요구사항 분석 : design/requirement
  * 설계 문서 : design/design
  * 상세 설계를 위한 사용자 의사결정 사항 도출 : design/testsession_decisions.md

### 2. 구현

* Nodejs (React Next.js + Node Express) 구조 생성
* Frontend/backend 소스코드 생성
* Backend 테스트코드 생성

### 3. 문제 생성

* 지원자 온라인 면접 시 출제할 문제 생성
* AI 에 질의하기 위한 프롬프트 템플릿 생성
* 관련 디렉토리
  - design/questions/README.md

### 4. 프롬프트 히스토리

* 프로젝트 루트의 prompt/*.md 파일들

### 5. IDE 룰셋

* .cursorrules
* 코드 생성 시 작성 규칙 및 AI tool 선택 옵션 적용

## Github 활용

* Feature branch 를 사용하여 개발된 코드 push 및 develop branch 로 merge request
* Github issue link 사용 (branch 및 commit message 에 auto-link)
* 개발 완료 후 main branch 로 merge request

## 🏗️ 프로젝트 구조

이 프로젝트는 **Express 서버**가 **Next.js 프론트엔드**를 함께 서빙하는 **통합 구조**로 설계되었습니다.

```
Vibecoding-challenge/
├── server.js              # Express + Next.js 통합 서버
├── package.json           # 루트 패키지 설정
├── .env                   # 환경 변수 (자동 생성) 
├── .gitignore             # Git 무시 파일
├── backend/               # 백엔드 API (완료)
│   ├── config/
│   │   └── database.js    # SQLite 데이터베이스 설정
│   ├── middleware/
│   │   └── auth.js        # JWT 인증 미들웨어
│   ├── routes/            # API 라우트 (8개 완성)
│   │   ├── auth.js        # 인증 (로그인/회원가입) 
│   │   ├── users.js       # 사용자 관리 
│   │   ├── candidates.js  # 지원자 관리 
│   │   ├── questions.js   # 질문 관리 
│   │   ├── testSessions.js # 테스트 세션 
│   │   ├── evaluations.js # 평가 관리 
│   │   ├── dashboard.js   # 대시보드 통계 
│   │   └── config.js      # 시스템 설정 
│   └── models/            # 데이터 모델 (향후 확장)
├── frontend/              # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/           # App Router 페이지
│   │   │   ├── auth/      # 인증 페이지 
│   │   │   ├── admin/     # 관리자 페이지 
│   │   │   │   ├── dashboard/ # 관리자 대시보드 
│   │   │   │   ├── questions/ # 질문 관리 페이지 
│   │   │   │   └── candidates/ # 지원자 관리 페이지 
│   │   │   └── candidate/ # 지원자 페이지 
│   │   │       └── test/  # 테스트 안내 페이지 
│   │   ├── components/    # React 컴포넌트
│   │   │   ├── ui/        # 기본 UI 컴포넌트 
│   │   │   ├── common/    # 공통 컴포넌트 
│   │   │   └── admin/     # 관리자 전용 컴포넌트 
│   │   ├── hooks/         # 커스텀 훅 
│   │   ├── store/         # Zustand 상태 관리 
│   │   ├── types/         # TypeScript 타입 정의 
│   │   ├── utils/         # 유틸리티 함수 
│   │   └── constants/     # 상수 정의 
│   └── package.json       # 프론트엔드 패키지
├── questions/             # 질문 데이터 파일 
│   ├── interview_questions_csharp_mssql.json
│   ├── interview_questions_html_js.json
│   ├── interview_questions_java_mariadb.json
│   ├── interview_questions_personality.json
│   └── interview_questions_problem_solving.json
├── database/              # SQLite 데이터베이스 파일
│   └── interview.db       # 자동 생성된 DB
├── prompt/                # 개발에 사용한 프롬프트 모음
└── design/                # 설계 문서
```

## 🚀 실행 방법

### 1. 의존성 설치
```bash
# 루트 위치
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
```
📧 이메일: admin@interview.com
🔑 비밀번호: admin123!
```

### 5. API 문서 (Swagger UI)
API 엔드포인트들의 상세 명세와 테스트를 위한 Swagger UI를 제공합니다:
```
http://localhost:3000/api-docs
```
- 모든 API 엔드포인트 목록 확인
- 요청/응답 스키마 문서화
- API 실시간 테스트 기능
- 인증 토큰 설정 및 테스트

### 6. 초기 데이터

SQLLITE DB 데이터파일을 제공합니다.
데이터 파일에는
* admin 사용자 계정
* test 사용자 계정
* 온라인 면접 질문 90개

가 제공됩니다.

### 7. 부정 방지

지원자가 온라인 면접을 시작한 후 다른 프로그램으로 전환하거나 다른 탭을 열거나, 개발자 도구를 여는 경우 부정 행위로 탐지하고 3회 경고 후 시험을 강제 종료합니다.

브라우저의 보안 제약사항 때문에 매우 정교하게 동작하지는 않습니다.

### 8. 테스트코드

* Backend API 는 Jest 테스트코드가 구현되어 있습니다.
* Frontend 는 테스트코드가 없으나 Playwright 등의 프레임워크를 활용하여 E2E 테스트를 구성할 수 있습니다.

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
- ✅ **지원자 관리**: 지원자 목록 조회, 상태별/분야별 필터링, 검색 기능
- ✅ **지원자 상세보기**: 기본정보, 테스트세션 정보, 평가결과 조회
- ✅ **페이징 시스템**: 페이지 크기 조정 (5/10/20/50개), 직관적 네비게이션

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
- **Swagger UI**: API 문서화 및 테스트

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
- `POST /api/test-sessions/:id/cheating` - 부정행위 등록
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

## 🔒 보안 기능

- ✅ **JWT 인증**: 안전한 토큰 기반 인증
- ✅ **권한 기반 접근**: 역할별 API 접근 제어
- ✅ **SQL Injection 방지**: 파라미터화된 쿼리
- ✅ **비밀번호 해싱**: bcryptjs 사용
- ✅ **파일 업로드 보안**: 파일 타입 및 크기 제한
- 🚧 **부정행위 방지**: 포커스 감지

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
