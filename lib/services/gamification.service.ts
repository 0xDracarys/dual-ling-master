import { getAdminDb } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { Timestamp } from 'firebase-admin/firestore';

export class GamificationService {
  private get usersCollection() {
    return getAdminDb().collection('users');
  }

  /**
   * Add XP to a user and update their streak.
   */
  async addXP(userId: string, xpToAdd: number): Promise<{ newXp: number; newStreak: number; leveledUp: boolean }> {
    const spanId = traceLogger.startSpan('Gamification', 'addXP', { userId, xpToAdd });

    try {
      const userRef = this.usersCollection.doc(userId);
      
      const result = await getAdminDb().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        const userData = userDoc.data() || {};
        
        // Calculate new XP
        const currentXp = userData.xp || 0;
        const newXp = currentXp + xpToAdd;
        
        // Level logic (e.g., 100 XP per level)
        const currentLevel = Math.floor(currentXp / 100) + 1;
        const newLevel = Math.floor(newXp / 100) + 1;
        const leveledUp = newLevel > currentLevel;

        // Calculate Streak
        let currentStreak = userData.streak || 0;
        const lastLessonDate = userData.lastLessonDate ? (userData.lastLessonDate as Timestamp).toDate() : null;
        const now = new Date();
        
        // Strip time to just compare dates
        const todayStr = now.toISOString().split('T')[0];
        const lastLessonStr = lastLessonDate ? lastLessonDate.toISOString().split('T')[0] : null;

        if (lastLessonStr !== todayStr) {
          // It's a new day!
          if (lastLessonDate) {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (lastLessonStr === yesterdayStr) {
              // They did a lesson yesterday, increment streak
              currentStreak += 1;
            } else {
              // They missed a day, reset streak to 1
              currentStreak = 1;
            }
          } else {
             // First lesson ever
             currentStreak = 1;
          }
        }

        transaction.update(userRef, {
          xp: newXp,
          streak: currentStreak,
          lastLessonDate: Timestamp.now(),
        });

        return { newXp, newStreak: currentStreak, leveledUp };
      });

      traceLogger.endSpan(spanId, 'success', result);
      return result;
    } catch (error: any) {
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }
}
