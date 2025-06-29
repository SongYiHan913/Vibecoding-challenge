# Java + MariaDB 면접 질문 생성 프롬프트

## 지시사항
당신은 웹 개발 회사의 기술 면접관입니다. Java 백엔드 개발자와 MariaDB 전문가를 위한 온라인 면접 질문을 생성해주세요.

## 생성 규칙

### 📋 JSON 형식
아래 JSON 스키마를 **완벽히 준수**하여 질문을 생성하세요:

```json
{
  "id": "고유식별자 (예: java-001, mariadab-001)",
  "type": "technical",
  "format": "multiple-choice 또는 essay",
  "difficulty": "easy, medium, hard 중 하나",
  "experienceLevel": "junior (5년 이하) 또는 senior (5년 이상)",
  "field": "java",
  "category": "java 또는 mariadb",
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
- **4지선다형**: 60% (기본 지식 확인)
- **서술형**: 40% (실무 역량 평가)
- **실무 중심**: 70% (현업에서 사용하는 기술)
- **이론/지식**: 30% (기본 개념 이해)

### 📊 난이도 & 경력별 분배
**Junior (5년 이하)**:
- Easy: 40% - 기본 문법, 핵심 개념
- Medium: 50% - 실무 기초, 문제 해결
- Hard: 10% - 심화 내용

**Senior (5년 이상)**:
- Easy: 20% - 기본기 확인
- Medium: 50% - 실무 숙련도
- Hard: 30% - 아키텍처, 최적화, 고급 기법

### 🔧 Java 질문 영역
1. **핵심 문법**: 객체지향, 제네릭, 람다, 스트림
2. **Spring Framework**: Spring Boot, DI/IoC, AOP, MVC
3. **JPA/Hibernate**: 엔티티 관계, 쿼리 최적화, 트랜잭션
4. **실무 문제해결**: 성능 최적화, 메모리 관리, 동시성
5. **테스트**: JUnit, 통합 테스트, Mock

### 🗄️ MariaDB 질문 영역
1. **기본 SQL**: 조인, 서브쿼리, 집계 함수
2. **인덱스**: 설계, 최적화, 성능 분석
3. **트랜잭션**: ACID, 격리수준, 락
4. **스키마 설계**: 정규화, 관계 설정
5. **성능 튜닝**: 쿼리 최적화, 파티셔닝

## 생성 요청
총 20개의 질문을 생성해주세요:

**Java 질문 (12개)**:
- Junior 4지선다 (3개): Easy(2), Medium(1)
- Junior 서술형 (2개): Medium(1), Hard(1)
- Senior 4지선다 (3개): Medium(2), Hard(1)
- Senior 서술형 (4개): Medium(2), Hard(2)

**MariaDB 질문 (8개)**:
- Junior 4지선다 (2개): Easy(1), Medium(1)
- Junior 서술형 (2개): Medium(1), Hard(1)  
- Senior 4지선다 (2개): Medium(1), Hard(1)
- Senior 서술형 (2개): Hard(2)

## 주의사항
- 실제 현업에서 마주할 수 있는 상황 기반 질문
- 암기보다는 **이해와 적용** 능력 평가
- 최신 버전 기준 (Java 17+, MariaDB 10.6+)
- 한국어로 자연스럽게 작성
- JSON 배열 형태로 출력: `[{질문1}, {질문2}, ...]`

지금 시작해주세요! 