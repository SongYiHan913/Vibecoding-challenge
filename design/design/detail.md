# 질문 set 생성

## 생성 위치

* 이 시스템은 LLM 을 직접 호출하지 않는다. (API key 과금량이 높음)
* 채팅 모드로 관리자가 수동으로 생성한다.
* JSON 형식으로 관리자가 수동으로 이 시스템에 업로드 한다.

## JSON 저장 방법

* 브라우저에서 접근할 수 없는 디렉토리에 질문 JSON 파일이 업로드 된다.

## 로드

* 지원자가 온라인 면접 세션을 시작할 때 적합한 질문 set 들을 load 하고 출력한다.

# 출제 및 채점 시스템

## 출제 구성

### 전체 구조
* **총 문제 수**: 25문제
* **시험 시간**: 90분
* **분야별 배분**: 기술(40%) / 인성(20%) / 문제해결(40%)

### 문제 유형별 구성
* **기술 질문 (10문제)**:
  - 4지선다: 6문제 (5-10점, 문제당 2분)
  - 서술형: 4문제 (15-20점, 문제당 4분)
* **인성 질문 (5문제)**:
  - 서술형: 5문제 (10-15점, 문제당 4분)
* **문제해결 (10문제)**:
  - 서술형: 10문제 (10-25점, 문제당 4분)

### 지원자별 맞춤 출제
* **지원 분야별**: Java 계열 vs C# 계열 전용 기술 질문
* **경력별**: Junior (5년 이하) vs Senior (5년 초과) 레벨 구분
* **공통 기술**: HTML, Javascript 문제는 모든 지원자 공통 출제
* **난이도 분산**: 쉬움:보통:어려움 = 30:50:20 비율

## 채점 시스템

### 2단계 하이브리드 채점 방식

#### 1단계: 자동 채점 (즉시 처리)
* **4지선다**: 정답 번호 비교하여 즉시 채점
* **서술형 사전 채점**: 필수 키워드 매칭으로 사전 점수 산출
  - 키워드 포함률 × 0.7 = 사전 점수
  - 관리자 검토 대기 상태로 표시

#### 2단계: 관리자 검토 (수동 처리)
* **서술형 최종 채점**: 관리자가 답안 검토 후 최종 점수 확정
* **평가 기준**: 모범 답안 + 필수 키워드 + 논리성 종합 평가
* **평가 인터페이스**: 지원자 답안, 모범 답안, 키워드 매칭 현황 표시

### 점수 계산
* **분야별 가중 평균**: 기술(40%) + 인성(20%) + 문제해결(40%)
* **합격 기준**: 총점 60점 이상
* **등급 산출**: 백분위 순위 기반 등급 부여

## 부정행위 방지

### 실시간 감지 항목
* **포커스 이탈**: 다른 창/탭 이동 감지 (최대 3회 허용)
* **키보드 차단**: F12, Ctrl+Shift+I 등 개발자 도구 단축키 차단
* **우클릭 방지**: 컨텍스트 메뉴 비활성화
* **페이지 새로고침 방지**: beforeunload 이벤트로 경고

### 제재 조치
* **경고 알림**: 1-2회 위반 시 경고 메시지 표시
* **강제 종료**: 3회 위반 시 테스트 자동 종료
* **로그 기록**: 모든 부정행위 시도 관리자 로그에 기록

# 문제 출제

* 기술 40% / 인성 20% / 문제 해결 능력 40%

# 문제 풀이

# 