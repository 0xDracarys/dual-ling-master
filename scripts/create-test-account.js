const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User model (simplified for this script)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/langexchange');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestAccounts() {
  try {
    await connectDB();
    
    // Clear existing test accounts
    await User.deleteMany({ 
      $or: [
        { email: { $regex: /test.*@/ } },
        { username: { $regex: /^test/ } }
      ]
    });
    console.log('Cleared existing test accounts');

    const testAccounts = [
      {
        username: 'teststudent',
        email: 'teststudent@example.com',
        password: 'password123',
        role: 'student',
        firstName: 'Test',
        lastName: 'Student',
        bio: 'I love learning new languages!'
      },
      {
        username: 'testteacher',
        email: 'testteacher@example.com',
        password: 'password123',
        role: 'teacher',
        firstName: 'Test',
        lastName: 'Teacher',
        bio: 'Experienced language teacher with 5+ years of experience'
      },
      {
        username: 'testadmin',
        email: 'testadmin@example.com',
        password: 'password123',
        role: 'admin',
        firstName: 'Test',
        lastName: 'Admin',
        bio: 'Platform administrator'
      }
    ];

    for (const account of testAccounts) {
      const hashedPassword = await bcrypt.hash(account.password, 12);
      
      const user = new User({
        ...account,
        password: hashedPassword
      });

      await user.save();
      console.log(`✅ Created ${account.role} account: ${account.username} (${account.email})`);
    }

    console.log('\n🎉 Test accounts created successfully!');
    console.log('\n📋 Test Account Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍🎓 Student Account:');
    console.log('   Email: teststudent@example.com');
    console.log('   Password: password123');
    console.log('   Dashboard: http://localhost:3000/dashboard');
    console.log('');
    console.log('👨‍🏫 Teacher Account:');
    console.log('   Email: testteacher@example.com');
    console.log('   Password: password123');
    console.log('   Dashboard: http://localhost:3000/teacher/dashboard');
    console.log('');
    console.log('👨‍💼 Admin Account:');
    console.log('   Email: testadmin@example.com');
    console.log('   Password: password123');
    console.log('   Dashboard: http://localhost:3000/admin/dashboard');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('Error creating test accounts:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestAccounts();
