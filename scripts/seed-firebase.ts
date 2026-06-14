import { getAdminApp, getAdminAuth, getAdminDb } from '../lib/firebase/admin';

async function seedFirebase() {
  console.log('🌱 Starting Firebase Seeding...\n');
  
  try {
    const app = getAdminApp();
    const auth = getAdminAuth();
    const db = getAdminDb();
    
    console.log('✅ Connected to Firebase');
    console.log(`   Project ID: ${app.options.projectId}\n`);
    
    // 1. Create sample teachers
    const teachers = [
      {
        email: 'teacher1@example.com',
        password: 'password123',
        displayName: 'Sarah Teacher',
        role: 'teacher'
      },
      {
        email: 'teacher2@example.com',
        password: 'password123',
        displayName: 'John Instructor',
        role: 'teacher'
      }
    ];

    console.log('👩‍🏫 Creating Teachers...');
    const createdTeachers = [];
    for (const t of teachers) {
      try {
        let user;
        try {
          user = await auth.getUserByEmail(t.email);
          console.log(`   Teacher ${t.email} already exists.`);
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            user = await auth.createUser({
              email: t.email,
              password: t.password,
              displayName: t.displayName,
            });
            console.log(`   Created Teacher ${t.email}`);
          } else {
            throw e;
          }
        }
        
        // Set custom claims
        await auth.setCustomUserClaims(user.uid, { role: 'teacher' });
        
        // Add to Firestore
        await db.collection('users').doc(user.uid).set({
          email: t.email,
          displayName: t.displayName,
          role: 'teacher',
          createdAt: new Date(),
        }, { merge: true });

        createdTeachers.push(user);
      } catch (err) {
        console.error(`   Failed to create teacher ${t.email}:`, err);
      }
    }

    // 2. Create sample students
    const students = [
      {
        email: 'student1@example.com',
        password: 'password123',
        displayName: 'Alex Student',
        role: 'student'
      },
      {
        email: 'student2@example.com',
        password: 'password123',
        displayName: 'Maria Learner',
        role: 'student'
      }
    ];

    console.log('\n👨‍🎓 Creating Students...');
    const createdStudents = [];
    for (const s of students) {
      try {
        let user;
        try {
          user = await auth.getUserByEmail(s.email);
          console.log(`   Student ${s.email} already exists.`);
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            user = await auth.createUser({
              email: s.email,
              password: s.password,
              displayName: s.displayName,
            });
            console.log(`   Created Student ${s.email}`);
          } else {
            throw e;
          }
        }
        
        // Set custom claims
        await auth.setCustomUserClaims(user.uid, { role: 'student' });
        
        // Add to Firestore
        await db.collection('users').doc(user.uid).set({
          email: s.email,
          displayName: s.displayName,
          role: 'student',
          createdAt: new Date(),
        }, { merge: true });

        createdStudents.push(user);
      } catch (err) {
        console.error(`   Failed to create student ${s.email}:`, err);
      }
    }

    if (createdTeachers.length === 0) {
      console.log('No teachers created/found, skipping course creation.');
      process.exit(1);
    }

    // 3. Create sample courses
    console.log('\n📚 Creating Sample Courses...');
    const courses = [
      {
        title: "Complete Spanish for Beginners",
        description: "Learn Spanish from scratch with this comprehensive course designed for absolute beginners. Master essential vocabulary, grammar, and conversational skills.",
        shortDescription: "Master Spanish from zero with interactive lessons and real-world practice.",
        language: "en",
        targetLanguage: "es",
        level: "beginner",
        estimatedHours: 40,
        teacherId: createdTeachers[0].uid,
        teacherName: createdTeachers[0].displayName,
        isPublished: true,
        enrollmentCount: 0,
        lessonsCount: 3,
        lessons: [
          { title: "Introduction to Spanish", type: "reading", duration: 15, order: 1, contentMarkdown: "Welcome to Spanish 101! Hola = Hello." },
          { title: "Basic Greetings", type: "video", duration: 20, order: 2, videoUrl: "https://www.youtube.com/watch?v=12345" },
          { title: "Numbers and Colors", type: "quiz", duration: 25, order: 3, quizQuestions: [
            { id: "q1", question: "How do you say Hello?", options: ["Hola", "Adios"], correctAnswer: 0, points: 1 }
          ] }
        ]
      },
      {
        title: "French Conversation Mastery",
        description: "Improve your French speaking skills through interactive conversations, role-plays, and real-life scenarios. Perfect for intermediate learners.",
        shortDescription: "Boost your French speaking confidence with practical conversation practice.",
        language: "en",
        targetLanguage: "fr",
        level: "intermediate",
        estimatedHours: 35,
        teacherId: createdTeachers[Math.min(1, createdTeachers.length - 1)].uid,
        teacherName: createdTeachers[Math.min(1, createdTeachers.length - 1)].displayName,
        isPublished: true,
        enrollmentCount: 0,
        lessonsCount: 2,
        lessons: [
          { title: "Everyday Conversations", type: "video", duration: 30, order: 1, videoUrl: "https://www.youtube.com/watch?v=abcdef" },
          { title: "Business French", type: "reading", duration: 25, order: 2, contentMarkdown: "Let's learn some business terms in French." }
        ]
      }
    ];

    for (const course of courses) {
      const { lessons, ...courseData } = course;
      
      // Check if course already exists by title
      const existingCourses = await db.collection('courses')
        .where('title', '==', courseData.title)
        .where('teacherId', '==', courseData.teacherId)
        .get();
        
      if (!existingCourses.empty) {
        console.log(`   Course '${courseData.title}' already exists.`);
        continue;
      }
      
      const courseRef = await db.collection('courses').add({
        ...courseData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`   Created Course: ${courseData.title} (${courseRef.id})`);
      
      // Add lessons
      for (const lesson of lessons) {
        await db.collection('courses').doc(courseRef.id).collection('lessons').add({
          ...lesson,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`      Added Lesson: ${lesson.title}`);
      }
    }

    console.log('\n🎉 Seeding complete!\n');
    console.log('You can now log in with the following accounts:');
    console.log('Teachers: teacher1@example.com, teacher2@example.com (Password: password123)');
    console.log('Students: student1@example.com, student2@example.com (Password: password123)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedFirebase();
