/**
 * Language Detection Utility
 * 
 * Detects whether text is in English or Lithuanian using heuristic-based analysis.
 * This is a lightweight solution for the chatbot to maintain language consistency.
 */

export type SupportedLanguage = 'en' | 'lt'

/**
 * Detects the language of the input text
 * @param text - The text to analyze
 * @returns 'en' for English, 'lt' for Lithuanian
 */
export function detectLanguage(text: string): SupportedLanguage {
  if (!text || text.trim().length === 0) {
    return 'en' // Default to English for empty text
  }

  const lowerText = text.toLowerCase()
  
  // Lithuanian-specific characters
  const lithuanianChars = /[ąčęėįšųūž]/gi
  const lithuanianCharMatches = text.match(lithuanianChars)
  
  // Common Lithuanian words (most frequent words in Lithuanian)
  const lithuanianWords = [
    /\b(ir|yra|su|kad|bet|o|taip|ne|tai|ar|kaip|būti|turėti|gali|galiu|man|mano)\b/gi,
    /\b(labai|puiku|sukurti|pamoka|kursas|turinys|tema|mokymas|mokytis)\b/gi,
    /\b(sėkmingai|dabar|prašau|ačiū|gerai|blogai|geras|blogas)\b/gi,
  ]
  
  // Common English words (most frequent words in English)
  const englishWords = [
    /\b(the|be|to|of|and|a|in|that|have|i|it|for|not|on|with|he|as|you|do|at)\b/gi,
    /\b(this|but|his|by|from|they|we|say|her|she|or|an|will|my|one|all|would|there|their)\b/gi,
    /\b(create|course|lesson|content|topic|teaching|learning|language)\b/gi,
  ]
  
  let lithuanianScore = 0
  let englishScore = 0
  
  // Score based on Lithuanian characters (strong indicator)
  if (lithuanianCharMatches) {
    lithuanianScore += lithuanianCharMatches.length * 3 // Heavy weight
  }
  
  // Score based on Lithuanian words
  lithuanianWords.forEach(pattern => {
    const matches = lowerText.match(pattern)
    if (matches) {
      lithuanianScore += matches.length * 2
    }
  })
  
  // Score based on English words
  englishWords.forEach(pattern => {
    const matches = lowerText.match(pattern)
    if (matches) {
      englishScore += matches.length
    }
  })
  
  // Decision logic:
  // - If there are ANY Lithuanian characters, heavily favor Lithuanian
  // - Otherwise, compare word counts
  if (lithuanianCharMatches && lithuanianCharMatches.length > 0) {
    return 'lt'
  }
  
  // If Lithuanian score is significantly higher, classify as Lithuanian
  if (lithuanianScore >= englishScore * 1.5) {
    return 'lt'
  }
  
  // Default to English (safer assumption for international platform)
  return 'en'
}

/**
 * Gets the human-readable name of the language
 */
export function getLanguageName(lang: SupportedLanguage): string {
  return lang === 'en' ? 'English' : 'Lithuanian'
}

/**
 * Detects if user is requesting a building action (course/lesson creation)
 * Used for smart mode switching suggestion
 */
export function detectBuildingIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  
  const buildingKeywords = [
    // English keywords
    'create course', 'create lesson', 'create quiz', 'create the',
    'make a course', 'make a lesson', 'build a course', 'build a lesson',
    'generate course', 'generate lesson', 'generate quiz',
    'create it', 'build it', 'make it', 'do it', 'go ahead', 'proceed',
    'yes, create', 'yes create', 'yes, make', 'yes make', 
    'yes, build', 'yes build', 'yes, do it', 'yes do it',
    'create all', 'make all', 'build all',
    
    // Lithuanian keywords
    'sukurti kursą', 'sukurti pamoką', 'sukurk kursą', 'sukurk pamoką',
    'sukurkime', 'sukursime', 'taip, sukurk', 'taip sukurk',
    'gerai, sukurk', 'gerai sukurk', 'tęsk', 'toliau',
    'padaryk', 'daryk', 'vykdyk'
  ]
  
  return buildingKeywords.some(keyword => lowerMessage.includes(keyword))
}
