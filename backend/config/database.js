const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './database/interview.db';
const dbDir = path.dirname(dbPath);

// 데이터베이스 디렉토리가 없으면 생성
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 데이터베이스 연결
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 실패:', err.message);
  } else {
    console.log('✅ SQLite 데이터베이스에 연결되었습니다.');
  }
});

// 데이터베이스 초기화
const initDatabase = () => {
  const queries = [
    // 사용자 테이블
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'candidate')) NOT NULL,
      phone TEXT,
      experience INTEGER,
      applied_field TEXT CHECK(applied_field IN ('java', 'csharp')),
      status TEXT DEFAULT 'pending',
      test_session_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // 질문 테이블
    `CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      type TEXT CHECK(type IN ('technical', 'personality', 'problem-solving')) NOT NULL,
      format TEXT CHECK(format IN ('multiple-choice', 'essay')) NOT NULL,
      difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
      experience_level TEXT CHECK(experience_level IN ('junior', 'senior')) NOT NULL,
      field TEXT CHECK(field IN ('java', 'csharp', 'common')),
      category TEXT,
      question TEXT NOT NULL,
      options TEXT, -- JSON 형태로 저장
      correct_answer INTEGER,
      correct_answer_text TEXT,
      required_keywords TEXT, -- JSON 형태로 저장
      points INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // 테스트 세션 테이블
    `CREATE TABLE IF NOT EXISTS test_sessions (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      status TEXT CHECK(status IN ('not-started', 'in-progress', 'completed', 'terminated')) NOT NULL,
      started_at DATETIME,
      completed_at DATETIME,
      terminated_at DATETIME,
      termination_reason TEXT,
      questions TEXT, -- JSON 형태로 저장
      answers TEXT, -- JSON 형태로 저장
      remaining_time INTEGER,
      total_time INTEGER,
      cheating_attempts INTEGER DEFAULT 0,
      focus_lost_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES users (id)
    )`,

    // 평가 테이블
    `CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      test_session_id TEXT NOT NULL,
      technical_score REAL,
      personality_score REAL,
      problem_solving_score REAL,
      total_score REAL,
      detailed_results TEXT, -- JSON 형태로 저장
      llm_evaluations TEXT, -- JSON 형태로 저장
      evaluated_at DATETIME,
      evaluated_by TEXT,
      status TEXT CHECK(status IN ('pending', 'completed')) DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES users (id),
      FOREIGN KEY (test_session_id) REFERENCES test_sessions (id),
      FOREIGN KEY (evaluated_by) REFERENCES users (id)
    )`,

    // 테스트 설정 테이블
    `CREATE TABLE IF NOT EXISTS test_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      total_time INTEGER NOT NULL,
      difficulty_distribution TEXT, -- JSON 형태로 저장
      question_counts TEXT, -- JSON 형태로 저장
      cheating_tolerance_level INTEGER DEFAULT 3,
      is_active BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // 인덱스 생성
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
    `CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type)`,
    `CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty)`,
    `CREATE INDEX IF NOT EXISTS idx_test_sessions_candidate ON test_sessions(candidate_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evaluations_candidate ON evaluations(candidate_id)`
  ];

  queries.forEach((query, index) => {
    db.run(query, (err) => {
      if (err) {
        console.error(`테이블 생성 실패 (${index + 1}):`, err.message);
      }
    });
  });

  console.log('✅ 데이터베이스 테이블이 초기화되었습니다.');
};

// 기본 관리자 계정 생성
const createDefaultAdmin = () => {
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const adminEmail = 'admin@interview.com';
  const adminPassword = 'admin123!';

  db.get('SELECT id FROM users WHERE email = ?', [adminEmail], (err, row) => {
    if (err) {
      console.error('관리자 계정 확인 실패:', err.message);
      return;
    }

    if (!row) {
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      const adminId = uuidv4();

      db.run(
        `INSERT INTO users (id, email, password, name, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [adminId, adminEmail, hashedPassword, '시스템 관리자', 'admin'],
        (err) => {
          if (err) {
            console.error('기본 관리자 계정 생성 실패:', err.message);
          } else {
            console.log('✅ 기본 관리자 계정이 생성되었습니다.');
            console.log('📧 이메일: admin@interview.com');
            console.log('🔑 비밀번호: admin123!');
          }
        }
      );
    }
  });
};

// 데이터베이스 초기화 실행
initDatabase();

// 지연 후 기본 관리자 계정 생성 (테이블 생성 완료 후)
setTimeout(createDefaultAdmin, 1000);

module.exports = db; 