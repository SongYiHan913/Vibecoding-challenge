const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 모든 라우트에 인증 필요
router.use(authenticateToken);

// 테스트 설정 목록 조회 (관리자만)
router.get('/test-configs', requireAdmin, (req, res) => {
  db.all(
    'SELECT * FROM test_configs ORDER BY created_at DESC',
    [],
    (err, configs) => {
      if (err) {
        console.error('테스트 설정 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }

      res.json({
        success: true,
        data: configs.map(config => ({
          ...config,
          difficultyDistribution: config.difficulty_distribution ? JSON.parse(config.difficulty_distribution) : null,
          questionCounts: config.question_counts ? JSON.parse(config.question_counts) : null,
          isActive: Boolean(config.is_active),
          createdAt: new Date(config.created_at),
          updatedAt: new Date(config.updated_at)
        }))
      });
    }
  );
});

// 활성 테스트 설정 조회
router.get('/test-configs/active', (req, res) => {
  db.get(
    'SELECT * FROM test_configs WHERE is_active = 1',
    [],
    (err, config) => {
      if (err) {
        console.error('활성 테스트 설정 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }

      if (!config) {
        // 기본 설정 반환
        return res.json({
          success: true,
          data: {
            id: 'default',
            name: '기본 설정',
            totalTime: parseInt(process.env.DEFAULT_TEST_TIME) || 90,
            difficultyDistribution: {
              easy: 30,
              medium: 50,
              hard: 20
            },
            questionCounts: {
              technical: 5,
              personality: 3,
              'problem-solving': 2
            },
            cheatingToleranceLevel: parseInt(process.env.MAX_CHEATING_ATTEMPTS) || 3,
            isActive: true
          }
        });
      }

      res.json({
        success: true,
        data: {
          ...config,
          difficultyDistribution: config.difficulty_distribution ? JSON.parse(config.difficulty_distribution) : null,
          questionCounts: config.question_counts ? JSON.parse(config.question_counts) : null,
          isActive: Boolean(config.is_active),
          createdAt: new Date(config.created_at),
          updatedAt: new Date(config.updated_at)
        }
      });
    }
  );
});

// 테스트 설정 생성 (관리자만)
router.post('/test-configs', requireAdmin, (req, res) => {
  const {
    name,
    totalTime,
    difficultyDistribution,
    questionCounts,
    cheatingToleranceLevel,
    isActive
  } = req.body;

  if (!name || !totalTime || !difficultyDistribution || !questionCounts) {
    return res.status(400).json({
      success: false,
      message: '필수 정보가 누락되었습니다.'
    });
  }

  const configId = uuidv4();

  // 새로운 설정이 활성화되면 기존 활성 설정 비활성화
  const insertConfig = () => {
    db.run(
      `INSERT INTO test_configs (
        id, name, total_time, difficulty_distribution, question_counts,
        cheating_tolerance_level, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        configId,
        name,
        totalTime,
        JSON.stringify(difficultyDistribution),
        JSON.stringify(questionCounts),
        cheatingToleranceLevel || 3,
        isActive ? 1 : 0
      ],
      function(err) {
        if (err) {
          console.error('테스트 설정 생성 오류:', err);
          return res.status(500).json({
            success: false,
            message: '테스트 설정 생성 중 오류가 발생했습니다.'
          });
        }

        res.status(201).json({
          success: true,
          message: '테스트 설정이 생성되었습니다.',
          data: {
            id: configId,
            name,
            totalTime,
            difficultyDistribution,
            questionCounts,
            cheatingToleranceLevel: cheatingToleranceLevel || 3,
            isActive: Boolean(isActive)
          }
        });
      }
    );
  };

  if (isActive) {
    // 기존 활성 설정들 비활성화
    db.run(
      'UPDATE test_configs SET is_active = 0, updated_at = datetime("now")',
      [],
      (err) => {
        if (err) {
          console.error('기존 설정 비활성화 오류:', err);
          return res.status(500).json({
            success: false,
            message: '설정 업데이트 중 오류가 발생했습니다.'
          });
        }
        insertConfig();
      }
    );
  } else {
    insertConfig();
  }
});

// 테스트 설정 수정 (관리자만)
router.put('/test-configs/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const {
    name,
    totalTime,
    difficultyDistribution,
    questionCounts,
    cheatingToleranceLevel,
    isActive
  } = req.body;

  const updates = [];
  const params = [];

  if (name) {
    updates.push('name = ?');
    params.push(name);
  }

  if (totalTime) {
    updates.push('total_time = ?');
    params.push(totalTime);
  }

  if (difficultyDistribution) {
    updates.push('difficulty_distribution = ?');
    params.push(JSON.stringify(difficultyDistribution));
  }

  if (questionCounts) {
    updates.push('question_counts = ?');
    params.push(JSON.stringify(questionCounts));
  }

  if (cheatingToleranceLevel !== undefined) {
    updates.push('cheating_tolerance_level = ?');
    params.push(cheatingToleranceLevel);
  }

  if (isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: '수정할 데이터가 없습니다.'
    });
  }

  updates.push('updated_at = datetime("now")');
  params.push(id);

  const updateConfig = () => {
    const query = `UPDATE test_configs SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, params, function(err) {
      if (err) {
        console.error('테스트 설정 수정 오류:', err);
        return res.status(500).json({
          success: false,
          message: '테스트 설정 수정 중 오류가 발생했습니다.'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: '테스트 설정을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        message: '테스트 설정이 수정되었습니다.'
      });
    });
  };

  // 활성화하는 경우 기존 활성 설정들 비활성화
  if (isActive) {
    db.run(
      'UPDATE test_configs SET is_active = 0, updated_at = datetime("now") WHERE id != ?',
      [id],
      (err) => {
        if (err) {
          console.error('기존 설정 비활성화 오류:', err);
          return res.status(500).json({
            success: false,
            message: '설정 업데이트 중 오류가 발생했습니다.'
          });
        }
        updateConfig();
      }
    );
  } else {
    updateConfig();
  }
});

// 테스트 설정 삭제 (관리자만)
router.delete('/test-configs/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  // 활성 설정인지 확인
  db.get('SELECT is_active FROM test_configs WHERE id = ?', [id], (err, config) => {
    if (err) {
      console.error('테스트 설정 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    if (!config) {
      return res.status(404).json({
        success: false,
        message: '테스트 설정을 찾을 수 없습니다.'
      });
    }

    if (config.is_active) {
      return res.status(400).json({
        success: false,
        message: '활성 설정은 삭제할 수 없습니다. 먼저 다른 설정을 활성화하세요.'
      });
    }

    // 설정 삭제
    db.run('DELETE FROM test_configs WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('테스트 설정 삭제 오류:', err);
        return res.status(500).json({
          success: false,
          message: '테스트 설정 삭제 중 오류가 발생했습니다.'
        });
      }

      res.json({
        success: true,
        message: '테스트 설정이 삭제되었습니다.'
      });
    });
  });
});

// 시스템 정보 조회
router.get('/system-info', (req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: {
        llmEvaluation: Boolean(process.env.OPENAI_API_KEY),
        fileUpload: true,
        cheatingDetection: true
      },
      limits: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
        maxCheatingAttempts: parseInt(process.env.MAX_CHEATING_ATTEMPTS) || 3,
        defaultTestTime: parseInt(process.env.DEFAULT_TEST_TIME) || 90
      }
    }
  });
});

module.exports = router; 