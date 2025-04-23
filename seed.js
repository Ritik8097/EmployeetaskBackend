const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Task = require('./models/Task');
const Department = require('./models/Department');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Task.deleteMany();
    await Department.deleteMany();

    console.log('Data cleared...');

    // Create departments
    const departments = await Department.create([
      {
        name: 'Engineering',
        description: 'Software development and engineering'
      },
      {
        name: 'Marketing',
        description: 'Marketing and communications'
      },
      {
        name: 'Sales',
        description: 'Sales and customer relationships'
      },
      {
        name: 'Finance',
        description: 'Financial operations and accounting'
      },
      {
        name: 'HR',
        description: 'Human resources and personnel management'
      }
    ]);

    console.log('Departments created...');

    // Create users (including admin)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      department: 'Management'
    });

    const engineer1 = await User.create({
      name: 'Cp7',
      email: 'cp@example.com',
      password: 'chandan123',
      department: 'Engineering'
    });

    const marketer1 = await User.create({
      name: 'Sarah ',
      email: 'sarah@example.com',
      password: 'password123',
      department: 'Marketing'
    });

    const sales1 = await User.create({
      name: 'Mike ',
      email: 'mike@example.com',
      password: 'password123',
      department: 'Sales'
    });

    console.log('Users created...');

    // Create tasks
    await Task.create([
      {
        title: 'Develop API endpoints',
        description: 'Create REST API endpoints for the task manager',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date('2025-05-05'),
        employeeId: engineer1._id
      },
      {
        title: 'Fix frontend bugs',
        description: 'Address UI issues in the dashboard',
        status: 'To Do',
        priority: 'Medium',
        dueDate: new Date('2025-05-10'),
        employeeId: engineer1._id
      },
      {
        title: 'Create marketing campaign',
        description: 'Develop Q2 marketing campaign for new product launch',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date('2025-05-15'),
        employeeId: marketer1._id
      },
      {
        title: 'Contact new leads',
        description: 'Reach out to potential customers from the trade show',
        status: 'To Do',
        priority: 'Urgent',
        dueDate: new Date('2025-04-25'),
        employeeId: sales1._id
      },
      {
        title: 'Prepare sales report',
        description: 'Compile Q1 sales figures for management review',
        status: 'Done',
        priority: 'Medium',
        dueDate: new Date('2025-04-10'),
        employeeId: sales1._id
      }
    ]);

    console.log('Tasks created...');
    console.log('Seeding completed!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

// Run seeder
seedData();