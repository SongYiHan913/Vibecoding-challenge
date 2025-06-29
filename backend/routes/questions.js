const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// uploads/questions 디렉토리 존재 확인 및 생성
const uploadsDir = 'uploads/questions/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 uploads/questions 디렉토리를 생성했습니다.');
}

// 파일 업로드 설정
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('JSON 파일만 업로드 가능합니다.'), false);
    }
  }
});

// 모든 라우트에 인증 필요
router.use(authenticateToken);

// 질문 목록 조회
router.get('/', (req, res) => {
  const { page = 1, limit = 10, type, difficulty, field, format } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM questions';
  let countQuery = 'SELECT COUNT(*) as total FROM questions';
  const params = [];
  const conditions = [];

  // 필터 조건들
  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  if (difficulty) {
    conditions.push('difficulty = ?');
    params.push(difficulty);
  }

  if (field) {
    conditions.push('field = ?');
    params.push(field);
  }

  if (format) {
    conditions.push('format = ?');
    params.push(format);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  // 총 개수 조회
  db.get(countQuery, params.slice(0, -2), (err, countResult) => {
    if (err) {
      console.error('질문 개수 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    // 질문 목록 조회
    db.all(query, params, (err, questions) => {
      if (err) {
        console.error('질문 목록 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }

      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          questions: questions.map(question => ({
            ...question,
            options: question.options ? JSON.parse(question.options) : null,
            requiredKeywords: question.required_keywords ? JSON.parse(question.required_keywords) : null,
            createdAt: new Date(question.created_at),
            updatedAt: new Date(question.updated_at)
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages
          }
        }
      });
    });
  });
});

// JSON 파일로 질문 업로드 (관리자만)
router.post('/upload', requireAdmin, (req, res, next) => {
  upload.single('questions')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer 업로드 오류:', err);
      
      let errorMessage = '파일 업로드 중 오류가 발생했습니다.';
      
      if (err.code === 'UNEXPECTED_FIELD') {
        errorMessage = `예상하지 못한 필드입니다. 'questions' 필드를 사용해주세요. (받은 필드: ${err.field})`;
      } else if (err.code === 'LIMIT_FILE_SIZE') {
        errorMessage = '파일 크기가 너무 큽니다. 10MB 이하의 파일을 업로드해주세요.';
      } else if (err.message === 'JSON 파일만 업로드 가능합니다.') {
        errorMessage = 'JSON 파일만 업로드 가능합니다.';
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    // 업로드 성공 시 기존 로직 실행
    handleFileUpload(req, res);
  });
});

// 파일 업로드 처리 함수
function handleFileUpload(req, res) {
  // 업로드 디렉토리 재확인 (안전장치)
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 업로드 중 uploads/questions 디렉토리를 생성했습니다.');
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: '질문 파일을 업로드해주세요.'
    });
  }

  try {
    console.log('📁 파일 업로드 성공:', req.file);
    
    // JSON 파일 읽기
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    console.log('📄 파일 내용 읽기 성공, 크기:', fileContent.length);
    
    const questionsData = JSON.parse(fileContent);
    console.log('✅ JSON 파싱 성공, 질문 개수:', questionsData.length);

    // 파일 삭제
    fs.unlinkSync(filePath);

    if (!Array.isArray(questionsData)) {
      console.error('❌ 질문 데이터가 배열이 아님:', typeof questionsData);
      return res.status(400).json({
        success: false,
        message: '질문 데이터는 배열 형태여야 합니다.'
      });
    }

    let insertedCount = 0;
    let errorCount = 0;
    const errors = [];

    questionsData.forEach((questionData, index) => {
      const {
        id, type, format, difficulty, experienceLevel, field, category,
        question, options, correctAnswer, correctAnswerText,
        requiredKeywords, points, tags
      } = questionData;

      // 필수 필드 검증
      if (!type || !format || !difficulty || !experienceLevel || !question || !points) {
        errors.push(`질문 ${index + 1}: 필수 필드가 누락되었습니다. (type: ${type}, format: ${format}, difficulty: ${difficulty}, experienceLevel: ${experienceLevel}, question: ${question ? '있음' : '없음'}, points: ${points})`);
        errorCount++;
        return;
      }

      // ID가 있으면 사용하고, 없으면 새로 생성
      const questionId = id || uuidv4();

      db.run(
        `INSERT INTO questions (
          id, type, format, difficulty, experience_level, field, category,
          question, options, correct_answer, correct_answer_text,
          required_keywords, points, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          questionId, type, format, difficulty, experienceLevel, field, category,
          question,
          options ? JSON.stringify(options) : null,
          correctAnswer || null,
          correctAnswerText || null,
          requiredKeywords ? JSON.stringify(requiredKeywords) : null,
          points
        ],
        function(err) {
          if (err) {
            console.error(`질문 ${index + 1} 저장 오류:`, err);
            errors.push(`질문 ${index + 1}: ${err.message}`);
            errorCount++;
          } else {
            insertedCount++;
          }

          // 모든 질문 처리 완료 시 응답
          if (insertedCount + errorCount === questionsData.length) {
            res.json({
              success: errorCount === 0,
              message: `${insertedCount}개 질문이 성공적으로 저장되었습니다.${errorCount > 0 ? ` ${errorCount}개 오류 발생.` : ''}`,
              data: {
                inserted: insertedCount,
                errors: errorCount,
                errorDetails: errors
              }
            });
          }
        }
      );
    });

  } catch (error) {
    console.error('❌ JSON 파일 처리 오류:', error);
    console.error('오류 유형:', error.name);
    console.error('오류 메시지:', error.message);
    
    // 파일이 존재하면 삭제
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('🗑️  임시 파일 삭제 완료');
    }

    let errorMessage = 'JSON 파일 처리 중 오류가 발생했습니다.';
    
    if (error instanceof SyntaxError) {
      errorMessage = 'JSON 파일 형식이 올바르지 않습니다. 유효한 JSON 파일인지 확인해주세요.';
    } else if (error.code === 'ENOENT') {
      errorMessage = '파일을 찾을 수 없습니다.';
    }

    res.status(400).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// 특정 질문 조회
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM questions WHERE id = ?', [id], (err, question) => {
    if (err) {
      console.error('질문 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '질문을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: {
        ...question,
        options: question.options ? JSON.parse(question.options) : null,
        requiredKeywords: question.required_keywords ? JSON.parse(question.required_keywords) : null,
        createdAt: new Date(question.created_at),
        updatedAt: new Date(question.updated_at)
      }
    });
  });
});

// 질문 삭제 (관리자만)
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM questions WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('질문 삭제 오류:', err);
      return res.status(500).json({
        success: false,
        message: '질문 삭제 중 오류가 발생했습니다.'
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '질문을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '질문이 삭제되었습니다.'
    });
  });
});

// 테스트용 질문 생성 (관리자만)
router.post('/generate-test', requireAdmin, (req, res) => {
  const { candidateId, appliedField, experienceLevel } = req.body;

  if (!candidateId || !appliedField || !experienceLevel) {
    return res.status(400).json({
      success: false,
      message: '필수 정보가 누락되었습니다.'
    });
  }

  // 질문 구성: 기술 5개, 인성 3개, 문제해결 2개 (총 10개)
  const questionCounts = {
    technical: 5,
    personality: 3,
    'problem-solving': 2
  };

  const selectedQuestions = [];
  let completed = 0;
  const totalTypes = Object.keys(questionCounts).length;

  Object.entries(questionCounts).forEach(([type, count]) => {
    let query;
    const params = [type, experienceLevel];

    if (type === 'technical') {
      // 기술 질문은 지원 분야에 맞게
      query = 'SELECT * FROM questions WHERE type = ? AND experience_level = ? AND (field = ? OR field = "common") ORDER BY RANDOM() LIMIT ?';
      params.push(appliedField, count);
    } else {
      // 인성, 문제해결 질문은 공통
      query = 'SELECT * FROM questions WHERE type = ? AND experience_level = ? AND (field = "common" OR field IS NULL) ORDER BY RANDOM() LIMIT ?';
      params.push(count);
    }

    db.all(query, params, (err, questions) => {
      if (err) {
        console.error(`${type} 질문 조회 오류:`, err);
        return res.status(500).json({
          success: false,
          message: '질문 생성 중 오류가 발생했습니다.'
        });
      }

      selectedQuestions.push(...questions);
      completed++;

      if (completed === totalTypes) {
        // 모든 타입의 질문 수집 완료
        res.json({
          success: true,
          data: {
            questions: selectedQuestions.map(question => ({
              ...question,
              options: question.options ? JSON.parse(question.options) : null,
              requiredKeywords: question.required_keywords ? JSON.parse(question.required_keywords) : null
            })),
            totalQuestions: selectedQuestions.length
          }
        });
      }
    });
  });
});

module.exports = router; 