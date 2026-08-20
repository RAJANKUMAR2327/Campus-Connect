import Skill from '../models/Skill.js'

const defaultSkills = [
  { name: 'JavaScript', category: 'programming', icon: '🟨' },
  { name: 'Python', category: 'programming', icon: '🐍' },
  { name: 'Java', category: 'programming', icon: '☕' },
  { name: 'C++', category: 'programming', icon: '⚙️' },
  { name: 'React', category: 'frameworks', icon: '⚛️' },
  { name: 'Node.js', category: 'frameworks', icon: '🟢' },
  { name: 'Express', category: 'frameworks', icon: '🚂' },
  { name: 'MongoDB', category: 'databases', icon: '🍃' },
  { name: 'MySQL', category: 'databases', icon: '🐬' },
  { name: 'PostgreSQL', category: 'databases', icon: '🐘' },
  { name: 'Git', category: 'tools', icon: '📦' },
  { name: 'Docker', category: 'tools', icon: '🐳' },
  { name: 'AWS', category: 'tools', icon: '☁️' },
  { name: 'Data Structures', category: 'programming', icon: '🧩' },
  { name: 'Algorithms', category: 'programming', icon: '🔢' },
  { name: 'System Design', category: 'programming', icon: '🏗️' },
  { name: 'UI/UX Design', category: 'design', icon: '🎨' },
  { name: 'Figma', category: 'design', icon: '🎯' },
  { name: 'Public Speaking', category: 'soft-skills', icon: '🎤' },
  { name: 'Leadership', category: 'soft-skills', icon: '👑' },
  { name: 'Teamwork', category: 'soft-skills', icon: '🤝' },
]

export const seedSkills = async () => {
  for (const skill of defaultSkills) {
    await Skill.findOneAndUpdate({ name: skill.name }, skill, { upsert: true })
  }
  console.log('✅ Skills seeded')
}