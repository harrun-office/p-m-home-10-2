const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { requireRole } = require('../middleware/requireRole');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/', userController.list);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.patch('/:id/reset-password', userController.resetPassword);
router.delete('/:id', userController.remove);

module.exports = router;
