const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Task = require('../models/Task');
const User = require('../models/User');
const ExcelJS = require('exceljs');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private/Admin
exports.getTasks = asyncHandler(async (req, res, next) => {
  const tasks = await Task.find().populate({
    path: 'employeeId',
    select: 'name department',
    model: User
  });

  // Transform data to match frontend expectations
  const transformedTasks = tasks.map(task => ({
    _id: task._id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    employee: {
      _id: task.employeeId._id,
      name: task.employeeId.name,
      department: task.employeeId.department
    }
  }));

  res.status(200).json(transformedTasks);
});

// @desc    Get tasks for a specific employee
// @route   GET /api/tasks/employee/:id
// @access  Private
exports.getEmployeeTasks = asyncHandler(async (req, res, next) => {
  // Make sure employee exists
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`No user with the id of ${req.params.id}`, 404));
  }

  // Make sure user is authorized to view these tasks
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return next(new ErrorResponse('Not authorized to access these tasks', 401));
  }

  const tasks = await Task.find({ employeeId: req.params.id });

  res.status(200).json(tasks);
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate({
    path: 'employeeId',
    select: 'name department',
    model: User
  });

  if (!task) {
    return next(new ErrorResponse(`No task with the id of ${req.params.id}`, 404));
  }

  // Make sure user is authorized to view the task
  if (req.user.role !== 'admin' && req.user.id !== task.employeeId.toString()) {
    return next(new ErrorResponse('Not authorized to access this task', 401));
  }

  res.status(200).json(task);
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.employeeId = req.body.employeeId || req.user.id;

  // Make sure user is authorized to create tasks for this employee
  if (req.user.role !== 'admin' && req.user.id !== req.body.employeeId) {
    return next(new ErrorResponse('Not authorized to create tasks for other employees', 401));
  }

  const task = await Task.create(req.body);

  res.status(201).json(task);
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse(`No task with the id of ${req.params.id}`, 404));
  }

  // Make sure user is authorized to update the task
  if (req.user.role !== 'admin' && req.user.id !== task.employeeId.toString()) {
    return next(new ErrorResponse('Not authorized to update this task', 401));
  }

  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json(task);
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse(`No task with the id of ${req.params.id}`, 404));
  }

  // Make sure user is authorized to delete the task
  if (req.user.role !== 'admin' && req.user.id !== task.employeeId.toString()) {
    return next(new ErrorResponse('Not authorized to delete this task', 401));
  }

  await task.deleteOne();

  res.status(200).json({ success: true, data: {} });
});

// @desc    Export tasks to Excel
// @route   GET /api/tasks/export
// @access  Private/Admin
exports.exportTasks = asyncHandler(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to export tasks', 401));
  }

  // Set query for department filter
  let query = {};
  if (req.query.department && req.query.department !== 'all') {
    // Get employee IDs for this department
    const employees = await User.find({ department: req.query.department }).select('_id');
    const employeeIds = employees.map(emp => emp._id);
    query = { employeeId: { $in: employeeIds } };
  }

  // Get tasks with employee details
  const tasks = await Task.find(query).populate({
    path: 'employeeId',
    select: 'name department',
    model: User
  });

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tasks');

  // Add headers
  worksheet.columns = [
    { header: 'Task ID', key: 'id', width: 26 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Priority', key: 'priority', width: 15 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Employee', key: 'employee', width: 20 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Created At', key: 'createdAt', width: 20 }
  ];

  // Add task data
  tasks.forEach(task => {
    worksheet.addRow({
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set',
      employee: task.employeeId.name,
      department: task.employeeId.department,
      createdAt: new Date(task.createdAt).toLocaleDateString()
    });
  });

  // Style headers
  worksheet.getRow(1).font = { bold: true };

  // Set content type and disposition
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=tasks-${new Date().toISOString().slice(0,10)}.xlsx`);

  // Write to response
  await workbook.xlsx.write(res);
  res.end();
});