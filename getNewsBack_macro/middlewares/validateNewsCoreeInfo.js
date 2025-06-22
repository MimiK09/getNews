const { body, validationResult } = require('express-validator');

const validateNewsFromRSSFeed = [
  body('data').isArray().withMessage('data doit être un tableau'),
  body('data.*.url').isString().notEmpty().withMessage('Chaque news doit avoir un url string non vide'),
  body('data.*.keyword').optional().isString(),
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

module.exports = {
  validateNewsFromRSSFeed
};
