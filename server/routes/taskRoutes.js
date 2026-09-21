import express from 'express';
import {
  getTasks, getMyTasks, createTask, updateTask, moveTask, deleteTask, addComment
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/my', getMyTasks);
router.route('/').get(getTasks).post(createTask);
router.route('/:id').put(updateTask).delete(deleteTask);
router.patch('/:id/move', moveTask);
router.post('/:id/comments', addComment);

export default router;
