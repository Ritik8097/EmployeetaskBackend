const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Department = require('../models/Department');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = asyncHandler(async (req, res, next) => {
  const departments = await Department.find();

  res.status(200).json(departments);
});

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorResponse(`No department with the id of ${req.params.id}`, 404));
  }

  res.status(200).json(department);
});

// @desc    Create new department
// @route   POST /api/departments
// @access  Private/Admin
exports.createDepartment = asyncHandler(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to create departments', 401));
  }

  const department = await Department.create(req.body);

  res.status(201).json(department);
});

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/Admin
exports.updateDepartment = asyncHandler(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update departments', 401));
  }

  let department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorResponse(`No department with the id of ${req.params.id}`, 404));
  }

  department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json(department);
});

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
exports.deleteDepartment = asyncHandler(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete departments', 401));
  }

  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorResponse(`No department with the id of ${req.params.id}`, 404));
  }

  await department.deleteOne();

  res.status(200).json({ success: true, data: {} });
});