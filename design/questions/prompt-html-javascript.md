# HTML + JavaScript 면접 질문 생성 프롬프트

## 지시사항
당신은 웹 개발 회사의 기술 면접관입니다. 프론트엔드/풀스택 개발자를 위한 HTML과 JavaScript 면접 질문을 생성해주세요.

## 생성 규칙

### 📋 JSON 형식
아래 JSON 스키마를 **완벽히 준수**하여 질문을 생성하세요:

```json
{
  "id": "고유식별자 (예: html-001, js-001)",
  "type": "technical",
  "format": "multiple-choice 또는 essay",
  "difficulty": "easy, medium, hard 중 하나",
  "experienceLevel": "junior (5년 이하) 또는 senior (5년 이상)",
  "field": "common",
  "category": "html 또는 javascript",
  "question": "질문 내용",
  "options": ["선택지1", "선택지2", "선택지3", "선택지4"], // multiple-choice만
  "correctAnswer": 0-3, // multiple-choice만 (0부터 시작)
  "correctAnswerText": "모범답안", // essay만
  "requiredKeywords": ["키워드1", "키워드2"], // essay만
  "points": 숫자,
  "tags": ["태그1", "태그2"]
}
```

### 🎯 질문 구성 비율
- **4지선다형**: 55% (기본 지식 확인)
- **서술형**: 45% (실무 역량 평가)
- **실무 중심**: 70% (실제 개발에 사용되는 기술)
- **이론/지식**: 30% (기본 개념 이해)

### 📊 난이도 & 경력별 분배
**Junior (5년 이하)**:
- Easy: 45% - 기본 문법, 핵심 개념
- Medium: 45% - 실무 기초, 문제 해결
- Hard: 10% - 심화 내용

**Senior (5년 이상)**:
- Easy: 25% - 기본기 확인
- Medium: 45% - 실무 숙련도
- Hard: 30% - 고급 기법, 최적화

### 🌐 HTML 질문 영역
1. **시맨틱 HTML**: HTML5 태그, 접근성, SEO
2. **폼 & 입력**: form, input 타입, 유효성 검사
3. **메타데이터**: meta 태그, 캐싱, 성능
4. **웹 표준**: DOCTYPE, 크로스 브라우징
5. **실무 활용**: 템플릿 엔진 연동, 컴포넌트 설계

### ⚡ JavaScript 질문 영역
1. **핵심 문법**: 변수, 함수, 객체, 배열
2. **ES6+ 기능**: 화살표 함수, 구조분해, 모듈, Promise
3. **비동기 처리**: async/await, Promise, 콜백
4. **DOM 조작**: 이벤트, 선택자, 동적 요소 생성
5. **고급 개념**: 클로저, 호이스팅, 프로토타입, this
6. **브라우저 API**: Fetch, localStorage, 지오로케이션
7. **성능 최적화**: 메모리 관리, 이벤트 위임, 렌더링

## 생성 요청
총 20개의 질문을 생성해주세요:

**HTML 질문 (8개)**:
- Junior 4지선다 (2개): Easy(2)
- Junior 서술형 (2개): Easy(1), Medium(1)
- Senior 4지선다 (2개): Medium(1), Hard(1)
- Senior 서술형 (2개): Medium(1), Hard(1)

**JavaScript 질문 (12개)**:
- Junior 4지선다 (3개): Easy(2), Medium(1)
- Junior 서술형 (3개): Easy(1), Medium(1), Hard(1)
- Senior 4지선다 (3개): Medium(2), Hard(1)
- Senior 서술형 (3개): Medium(1), Hard(2)

## 주의사항
- **모던 웹 개발 환경** 기준 (ES2023, HTML5)
- 바닐라 JavaScript 중심 (프레임워크 독립적)
- **브라우저 호환성**과 **웹 표준** 고려
- 실제 현업에서 마주할 수 있는 상황 기반
- 코드 예시 포함 시 **간결하고 실용적**으로
- 한국어로 자연스럽게 작성
- JSON 배열 형태로 출력: `[{질문1}, {질문2}, ...]`

지금 시작해주세요! 