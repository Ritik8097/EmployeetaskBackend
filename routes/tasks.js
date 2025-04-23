const express = require('express');
const { 
  getTasks, 
  getTask, 
  createTask, 
  updateTask, 
  deleteTask, 
  getEmployeeTasks,
  exportTasks 
} = require('../controllers/tasks');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

router.route('/')
  .get(authorize('admin'), getTasks)
  .post(createTask);

router.route('/export')
  .get(authorize('admin'), exportTasks);

router.route('/employee/:id')
  .get(getEmployeeTasks);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
