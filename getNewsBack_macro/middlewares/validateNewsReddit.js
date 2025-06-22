const { body, validationResult } = require('express-validator');

const validateNewsReddit = [
  body('data').isArray().withMessage('data doit être un tableau'),
  body('data.*.id').isString().notEmpty().withMessage('Chaque item doit avoir un id string'),
  body('data.*.action').isIn(['publish', 'delete']).withMessage('action doit être publish ou delete'),
  // flair optionnel
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array(),
        code: 400
      });
    }
    next();
  }
];

module.exports = validateNewsReddit;
