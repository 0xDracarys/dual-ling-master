const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/langexchange')
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  firstName: String,
  lastName: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

// Course Schema
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  shortDescription: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherName: String,
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  estimatedDuration: { type: Number, required: true },
  enrolledStudents: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  tags: [String],
  thumbnail: String,
  isPublished: { type: Boolean, default: true },
  lessons: [{
    title: String,
    type: { type: String, enum: ['text', 'video', 'quiz'] },
    content: String,
    duration: Number,
    order: Number
  }],
  createdAt: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)
const Course = mongoose.model('Course', courseSchema)

// Sample data
const sampleUsers = [
  {
    username: 'sarah_chen',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'teacher',
    firstName: 'Sarah',
    lastName: 'Chen'
  },
  {
    username: 'marcus_johnson',
    email: 'marcus@example.com',
    password: 'password123',
    role: 'teacher',
    firstName: 'Marcus',
    lastName: 'Johnson'
  },
  {
    username: 'elena_rodriguez',
    email: 'elena@example.com',
    password: 'password123',
    role: 'teacher',
    firstName: 'Elena',
    lastName: 'Rodriguez'
  },
  {
    username: 'david_kim',
    email: 'david@example.com',
    password: 'password123',
    role: 'teacher',
    firstName: 'David',
    lastName: 'Kim'
  }
]

const sampleCourses = [
  {
    title: "Complete Spanish for Beginners",
    description: "Learn Spanish from scratch with this comprehensive course designed for absolute beginners. Master essential vocabulary, grammar, and conversational skills.",
    shortDescription: "Master Spanish from zero with interactive lessons and real-world practice.",
    category: "spanish",
    difficulty: "beginner",
    estimatedDuration: 40,
    enrolledStudents: 1250,
    rating: 4.8,
    totalRatings: 320,
    tags: ["spanish", "beginner", "conversation", "grammar"],
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=300&fit=crop",
    lessons: [
      { title: "Introduction to Spanish", type: "text", duration: 15, order: 1 },
      { title: "Basic Greetings", type: "video", duration: 20, order: 2 },
      { title: "Numbers and Colors", type: "quiz", duration: 25, order: 3 }
    ]
  },
  {
    title: "French Conversation Mastery",
    description: "Improve your French speaking skills through interactive conversations, role-plays, and real-life scenarios. Perfect for intermediate learners.",
    shortDescription: "Boost your French speaking confidence with practical conversation practice.",
    category: "french",
    difficulty: "intermediate",
    estimatedDuration: 35,
    enrolledStudents: 890,
    rating: 4.7,
    totalRatings: 245,
    tags: ["french", "conversation", "intermediate", "speaking"],
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop",
    lessons: [
      { title: "Everyday Conversations", type: "video", duration: 30, order: 1 },
      { title: "Business French", type: "text", duration: 25, order: 2 },
      { title: "Cultural Context", type: "quiz", duration: 20, order: 3 }
    ]
  },
  {
    title: "German Grammar Intensive",
    description: "Master German grammar with detailed explanations, exercises, and practice tests. Ideal for serious learners who want to understand the language structure.",
    shortDescription: "Deep dive into German grammar with comprehensive exercises and explanations.",
    category: "german",
    difficulty: "advanced",
    estimatedDuration: 50,
    enrolledStudents: 650,
    rating: 4.9,
    totalRatings: 180,
    tags: ["german", "grammar", "advanced", "writing"],
    thumbnail: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&h=300&fit=crop",
    lessons: [
      { title: "Complex Sentence Structure", type: "text", duration: 40, order: 1 },
      { title: "Advanced Grammar Rules", type: "video", duration: 35, order: 2 },
      { title: "Grammar Practice Test", type: "quiz", duration: 30, order: 3 }
    ]
  },
  {
    title: "Japanese Hiragana & Katakana",
    description: "Learn the Japanese writing systems step by step. Perfect for beginners who want to read and write Japanese characters.",
    shortDescription: "Master Japanese characters with fun, interactive lessons and memory techniques.",
    category: "japanese",
    difficulty: "beginner",
    estimatedDuration: 25,
    enrolledStudents: 2100,
    rating: 4.6,
    totalRatings: 450,
    tags: ["japanese", "writing", "hiragana", "katakana", "beginner"],
    thumbnail: "https://images.unsplash.com/photo-1542640244-a13b6d5a7c9e?w=500&h=300&fit=crop",
    lessons: [
      { title: "Hiragana Basics", type: "video", duration: 20, order: 1 },
      { title: "Katakana Introduction", type: "text", duration: 15, order: 2 },
      { title: "Character Recognition", type: "quiz", duration: 25, order: 3 }
    ]
  },
  {
    title: "Italian for Travelers",
    description: "Essential Italian phrases and vocabulary for travelers. Learn what you need to know for your next trip to Italy.",
    shortDescription: "Essential Italian for your next trip to Italy - practical and fun!",
    category: "italian",
    difficulty: "beginner",
    estimatedDuration: 20,
    enrolledStudents: 1800,
    rating: 4.5,
    totalRatings: 380,
    tags: ["italian", "travel", "phrases", "beginner", "practical"],
    thumbnail: "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=500&h=300&fit=crop",
    lessons: [
      { title: "Airport & Hotel", type: "video", duration: 15, order: 1 },
      { title: "Restaurant & Shopping", type: "text", duration: 20, order: 2 },
      { title: "Emergency Phrases", type: "quiz", duration: 10, order: 3 }
    ]
  },
  {
    title: "Korean Pronunciation Mastery",
    description: "Perfect your Korean pronunciation with detailed audio lessons and practice exercises. Learn the subtle differences in Korean sounds.",
    shortDescription: "Master Korean pronunciation with expert guidance and practice exercises.",
    category: "korean",
    difficulty: "intermediate",
    estimatedDuration: 30,
    enrolledStudents: 750,
    rating: 4.8,
    totalRatings: 200,
    tags: ["korean", "pronunciation", "intermediate", "speaking"],
    thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=300&fit=crop",
    lessons: [
      { title: "Vowel Sounds", type: "video", duration: 25, order: 1 },
      { title: "Consonant Clusters", type: "text", duration: 20, order: 2 },
      { title: "Tone Practice", type: "quiz", duration: 15, order: 3 }
    ]
  },
  {
    title: "Chinese Business Language",
    description: "Learn Chinese for business contexts. Master professional vocabulary, email writing, and business etiquette.",
    shortDescription: "Professional Chinese for business success - vocabulary, writing, and etiquette.",
    category: "chinese",
    difficulty: "advanced",
    estimatedDuration: 45,
    enrolledStudents: 420,
    rating: 4.7,
    totalRatings: 95,
    tags: ["chinese", "business", "professional", "advanced", "writing"],
    thumbnail: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=500&h=300&fit=crop",
    lessons: [
      { title: "Business Vocabulary", type: "text", duration: 30, order: 1 },
      { title: "Email Writing", type: "video", duration: 25, order: 2 },
      { title: "Meeting Etiquette", type: "quiz", duration: 20, order: 3 }
    ]
  },
  {
    title: "Portuguese for Spanish Speakers",
    description: "Leverage your Spanish knowledge to learn Portuguese quickly. Focus on the differences and similarities between the two languages.",
    shortDescription: "Fast-track Portuguese learning using your existing Spanish knowledge.",
    category: "portuguese",
    difficulty: "intermediate",
    estimatedDuration: 28,
    enrolledStudents: 680,
    rating: 4.6,
    totalRatings: 160,
    tags: ["portuguese", "spanish", "comparative", "intermediate"],
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=300&fit=crop",
    lessons: [
      { title: "Similarities & Differences", type: "text", duration: 20, order: 1 },
      { title: "False Friends", type: "video", duration: 25, order: 2 },
      { title: "Pronunciation Guide", type: "quiz", duration: 15, order: 3 }
    ]
  }
]

async function seedDatabase() {
  try {
    await connectDB()

    // Clear existing data
    await User.deleteMany({})
    await Course.deleteMany({})
    console.log('Cleared existing data')

    // Create users
    const hashedUsers = await Promise.all(
      sampleUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10)
      }))
    )

    const createdUsers = await User.insertMany(hashedUsers)
    console.log(`Created ${createdUsers.length} users`)

    // Create courses with teacher references
    const coursesWithTeachers = sampleCourses.map((course, index) => ({
      ...course,
      teacherId: createdUsers[index % createdUsers.length]._id,
      teacherName: `${createdUsers[index % createdUsers.length].firstName} ${createdUsers[index % createdUsers.length].lastName}`
    }))

    const createdCourses = await Course.insertMany(coursesWithTeachers)
    console.log(`Created ${createdCourses.length} courses`)

    console.log('Database seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
