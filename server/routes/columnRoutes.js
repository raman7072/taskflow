import express from 'express';
import {
  getColumns, createColumn, updateColumn, deleteColumn, reorderColumns
} from '../controllers/columnController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.route('/').get(getColumns).post(createColumn);
router.put('/reorder', reorderColumns);
router.route('/:id').put(updateColumn).delete(deleteColumn);

export default router;
