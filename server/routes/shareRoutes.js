const express = require('express');
const router = express.Router();
const {
    shareResource,
    getPermissions,
    accessPublicResource,
    downloadPublicFile
} = require('../controllers/shareController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, shareResource);
router.get('/:resourceId', protect, getPermissions);
router.get('/public/:token', accessPublicResource);
router.get('/public/:token/download', downloadPublicFile); // New route

module.exports = router;
