# 온라인 면접 질문 생성 가이드

이 디렉토리는 온라인 면접 시스템에서 사용할 질문을 생성하고 관리하기 위한 리소스를 포함합니다.

## 📁 파일 구조

```
design/questions/
├── README.md                    # 이 파일 - 사용 가이드
├── question-schema.json         # JSON 스키마 정의
├── sample-questions.json        # 샘플 질문 예시
├── prompt-java-mariadb.md       # Java + MariaDB 질문 생성 프롬프트
├── prompt-csharp-mssql.md       # C# + MS SQL Server 질문 생성 프롬프트
├── prompt-html-javascript.md    # HTML + JavaScript 질문 생성 프롬프트
├── prompt-personality.md        # 인성 질문 생성 프롬프트
└── prompt-problem-solving.md    # 문제해결능력 질문 생성 프롬프트
```

## 🎯 질문 생성 워크플로우

### 1단계: JSON 스키마 확인
`question-schema.json` 파일에서 질문 데이터 구조를 확인하세요.

### 2단계: 프롬프트 선택
생성하고자 하는 영역에 맞는 프롬프트 파일을 선택하세요:

- **Java 백엔드**: `prompt-java-mariadb.md`
- **C# 백엔드**: `prompt-csharp-mssql.md`
- **프론트엔드**: `prompt-html-javascript.md`
- **인성 평가**: `prompt-personality.md`
- **문제해결**: `prompt-problem-solving.md`

### 3단계: ChatGPT에 프롬프트 입력
1. ChatGPT를 열고 선택한 프롬프트 파일의 내용을 **전체 복사**
2. ChatGPT에 붙여넣기 후 실행
3. 생성된 JSON 결과를 복사

### 4단계: JSON 파일 저장
1. 생성된 JSON을 `.json` 파일로 저장 (예: `java-questions-20241229.json`)
2. JSON 형식이 올바른지 검증
3. 시스템에 업로드

## 📋 질문 구성 원칙

### 출제 비율
- **기술**: 40% (Java/C#/HTML/JS)
- **인성**: 20% (협업, 윤리, 성장)
- **문제해결**: 40% (장애대응, 최적화)

### 형식 비율
- **4지선다**: 60% (지식 확인)
- **서술형**: 40% (실무 역량)

### 난이도 분배
- **Junior (5년 이하)**: Easy 40%, Medium 50%, Hard 10%
- **Senior (5년 이상)**: Easy 20%, Medium 50%, Hard 30%

## 🔧 JSON 스키마 핵심 필드

### 필수 필드
```json
{
  "id": "고유 식별자",
  "type": "technical|personality|problem-solving",
  "format": "multiple-choice|essay",
  "difficulty": "easy|medium|hard",
  "experienceLevel": "junior|senior",
  "question": "질문 내용",
  "points": 숫자
}
```

### 조건부 필수 필드

**4지선다형 (multiple-choice)**:
```json
{
  "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
  "correctAnswer": 0-3
}
```

**서술형 (essay)**:
```json
{
  "correctAnswerText": "모범 답안",
  "requiredKeywords": ["키워드1", "키워드2"]
}
```

**기술 질문 (technical)**:
```json
{
  "field": "java|csharp|common",
  "category": "java|mariadb|csharp|mssql|html|javascript"
}
```

## 📊 샘플 질문 참고

`sample-questions.json` 파일에서 각 영역별 질문 예시를 확인할 수 있습니다:

- ✅ Java 접근제어자 (4지선다)
- ✅ MariaDB 성능최적화 (서술형)
- ✅ C# Nullable 타입 (4지선다)
- ✅ MS SQL 격리수준 (서술형)
- ✅ HTML 시맨틱 태그 (4지선다)
- ✅ JavaScript 호이스팅/클로저 (서술형)
- ✅ 팀 갈등 해결 (인성)
- ✅ 시스템 장애 대응 (문제해결)

## 💡 질문 생성 팁

### ✅ 좋은 질문의 특징
- **실무 상황** 기반
- **구체적이고 명확**한 상황 설정
- **단계별 사고**를 요구하는 구조
- **최신 기술** 트렌드 반영
- **암기보다 이해**를 평가

### ❌ 피해야 할 요소
- 단순 암기 위주 질문
- 모호하거나 추상적인 표현
- 특정 도구/버전에 과도하게 의존
- 정답이 여러 개인 애매한 상황
- 실무와 동떨어진 이론적 질문

## 🚀 업로드 및 사용

### 시스템 업로드
1. 생성된 JSON 파일을 관리자 페이지에서 업로드
2. 시스템이 자동으로 검증 및 저장
3. 테스트 설정에서 출제 비율 조정

### 품질 관리
- 정기적으로 질문 풀 업데이트
- 면접 결과 피드백을 통한 개선
- 신기술 트렌드 반영

## 📞 문의 및 개선사항

질문 생성 과정에서 문의사항이나 개선 아이디어가 있으시면 개발팀에 연락해주세요.

---

> **중요**: 생성된 질문은 실제 면접에 사용되므로, 프롬프트를 정확히 따라 고품질의 질문을 생성해주세요. 