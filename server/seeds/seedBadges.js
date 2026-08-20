import Badge from '../models/Badge.js'

export const defaultBadges = [
  { badgeId: 'first_note', name: 'First Note', description: 'Upload your first note', icon: '📝', category: 'notes', rarity: 'common', xpReward: 25, criteria: { type: 'count', field: 'notesUploaded', threshold: 1 } },
  { badgeId: 'note_master', name: 'Note Master', description: 'Upload 10 notes', icon: '📚', category: 'notes', rarity: 'rare', xpReward: 100, criteria: { type: 'count', field: 'notesUploaded', threshold: 10 } },
  { badgeId: 'note_legend', name: 'Note Legend', description: 'Upload 50 notes', icon: '🏛️', category: 'notes', rarity: 'legendary', xpReward: 500, criteria: { type: 'count', field: 'notesUploaded', threshold: 50 } },

  { badgeId: 'event_goer', name: 'Event Goer', description: 'Attend your first event', icon: '🎪', category: 'events', rarity: 'common', xpReward: 25, criteria: { type: 'count', field: 'eventsAttended', threshold: 1 } },
  { badgeId: 'event_organizer', name: 'Event Organizer', description: 'Create 5 events', icon: '🎯', category: 'events', rarity: 'rare', xpReward: 150, criteria: { type: 'count', field: 'eventsCreated', threshold: 5 } },

  { badgeId: 'social_butterfly', name: 'Social Butterfly', description: 'Create 10 posts', icon: '🦋', category: 'community', rarity: 'common', xpReward: 50, criteria: { type: 'count', field: 'postsCreated', threshold: 10 } },
  { badgeId: 'commentator', name: 'Commentator', description: 'Post 25 comments', icon: '💬', category: 'community', rarity: 'common', xpReward: 50, criteria: { type: 'count', field: 'commentsPosted', threshold: 25 } },

  { badgeId: 'quiz_whiz', name: 'Quiz Whiz', description: 'Complete 5 quizzes', icon: '🧠', category: 'placement', rarity: 'rare', xpReward: 100, criteria: { type: 'count', field: 'quizzesCompleted', threshold: 5 } },
  { badgeId: 'question_contributor', name: 'Question Contributor', description: 'Add 10 questions to the bank', icon: '❓', category: 'placement', rarity: 'rare', xpReward: 100, criteria: { type: 'count', field: 'questionsAdded', threshold: 10 } },

  { badgeId: 'good_samaritan', name: 'Good Samaritan', description: 'Help resolve a lost & found case', icon: '🤝', category: 'community', rarity: 'epic', xpReward: 75, criteria: { type: 'count', field: 'lostFoundResolved', threshold: 1 } },

  { badgeId: 'mentor', name: 'Mentor', description: 'Complete your first mentorship session', icon: '🎓', category: 'placement', rarity: 'epic', xpReward: 100, criteria: { type: 'count', field: 'mentorshipSessions', threshold: 1 } },

  { badgeId: 'streak_3', name: 'Getting Started', description: '3 day login streak', icon: '🔥', category: 'streak', rarity: 'common', xpReward: 30, criteria: { type: 'streak', threshold: 3 } },
  { badgeId: 'streak_7', name: 'Week Warrior', description: '7 day login streak', icon: '⚡', category: 'streak', rarity: 'rare', xpReward: 100, criteria: { type: 'streak', threshold: 7 } },
  { badgeId: 'streak_30', name: 'Unstoppable', description: '30 day login streak', icon: '💎', category: 'streak', rarity: 'legendary', xpReward: 500, criteria: { type: 'streak', threshold: 30 } },

  { badgeId: 'rising_star', name: 'Rising Star', description: 'Reach 500 XP', icon: '⭐', category: 'special', rarity: 'rare', xpReward: 0, criteria: { type: 'milestone', field: 'xp', threshold: 500 } },
  { badgeId: 'campus_legend', name: 'Campus Legend', description: 'Reach 2000 XP', icon: '👑', category: 'special', rarity: 'legendary', xpReward: 0, criteria: { type: 'milestone', field: 'xp', threshold: 2000 } },
]

export const seedBadges = async () => {
  for (const badge of defaultBadges) {
    await Badge.findOneAndUpdate({ badgeId: badge.badgeId }, badge, { upsert: true })
  }
  console.log('✅ Badges seeded')
}