const express = require('express');
const router = express.Router();
const {
    getTrash,
    restoreItem,
    deletePermanent
} = require('../controllers/trashController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getTrash);
router.put('/:type/:id/restore', protect, restoreItem);
router.delete('/:type/:id', protect, deletePermanent);

module.exports = router;
