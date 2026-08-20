import { useSection } from '../hooks/useSection'
import { useState, useRef } from 'react'
import Layout from '../components/Layout'
import useAuthStore from '../store/authStore'
import { Download, Plus, Trash2, Eye, EyeOff } from 'lucide-react'

const defaultResume = {
  personalInfo: {
    name: '', email: '', phone: '', location: '',
    linkedin: '', github: '', portfolio: '' },
  summary: '',
  education: [
    { institution: '', degree: '', field: '', year: '', gpa: '' }
  ],
  experience: [],
  projects: [
    { name: '', description: '', tech: '', link: '' }
  ],
  skills: {
    languages: '', frameworks: '', tools: '', databases: '' },
  achievements: [''] }

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 mb-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default function ResumeBuilder() {
   useSection('placement')
  const { user } = useAuthStore()
  const [resume, setResume] = useState({
    ...defaultResume,
    personalInfo: {
      ...defaultResume.personalInfo,
      name: user?.name || '',
      email: user?.email || '' } })
  const [preview, setPreview] = useState(false)
  const printRef = useRef()

  const updatePersonal = (field, val) =>
    setResume(r => ({ ...r, personalInfo: { ...r.personalInfo, [field]: val } }))

  const updateEducation = (i, field, val) =>
    setResume(r => {
      const edu = [...r.education]
      edu[i] = { ...edu[i], [field]: val }
      return { ...r, education: edu }
    })

  const addEducation = () =>
    setResume(r => ({
      ...r,
      education: [...r.education, { institution: '', degree: '', field: '', year: '', gpa: '' }]
    }))

  const removeEducation = (i) =>
    setResume(r => ({ ...r, education: r.education.filter((_, idx) => idx !== i) }))

  const updateExperience = (i, field, val) =>
    setResume(r => {
      const exp = [...r.experience]
      exp[i] = { ...exp[i], [field]: val }
      return { ...r, experience: exp }
    })

  const addExperience = () =>
    setResume(r => ({
      ...r,
      experience: [...r.experience, { company: '', role: '', duration: '', description: '' }]
    }))

  const removeExperience = (i) =>
    setResume(r => ({ ...r, experience: r.experience.filter((_, idx) => idx !== i) }))

  const updateProject = (i, field, val) =>
    setResume(r => {
      const proj = [...r.projects]
      proj[i] = { ...proj[i], [field]: val }
      return { ...r, projects: proj }
    })

  const addProject = () =>
    setResume(r => ({
      ...r,
      projects: [...r.projects, { name: '', description: '', tech: '', link: '' }]
    }))

  const removeProject = (i) =>
    setResume(r => ({ ...r, projects: r.projects.filter((_, idx) => idx !== i) }))

  const updateSkills = (field, val) =>
    setResume(r => ({ ...r, skills: { ...r.skills, [field]: val } }))

  const updateAchievement = (i, val) =>
    setResume(r => {
      const ach = [...r.achievements]
      ach[i] = val
      return { ...r, achievements: ach }
    })

  const addAchievement = () =>
    setResume(r => ({ ...r, achievements: [...r.achievements, ''] }))

  const removeAchievement = (i) =>
    setResume(r => ({ ...r, achievements: r.achievements.filter((_, idx) => idx !== i) }))

  const handlePrint = () => {
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank')
    win.document.write(`
      <html>
        <head>
          <title>${resume.personalInfo.name} - Resume</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; color: #111; padding: 32px; font-size: 13px; }
            h1 { font-size: 22px; font-weight: 700; }
            h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #4338ca; border-bottom: 1.5px solid #4338ca; padding-bottom: 3px; margin: 16px 0 8px; }
            h3 { font-size: 13px; font-weight: 600; }
            p, li { font-size: 12px; line-height: 1.5; color: #374151; }
            ul { padding-left: 16px; }
            .contact { font-size: 11px; color: #6b7280; }
            .flex { display: flex; justify-content: space-between; align-items: baseline; }
            .tag { background: #EEF2FF; color: #4338ca; font-size: 10px; padding: 1px 6px; border-radius: 4px; margin-right: 4px; display: inline-block; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  // Resume preview HTML
  const ResumePreview = () => (
    <div ref={printRef} className="bg-white p-8 min-h-96 text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-4 pb-4 border-b-2 border-indigo-600">
        <h1 className="text-2xl font-bold text-gray-900">{resume.personalInfo.name || 'Your Name'}</h1>
        <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs text-gray-500">
          {resume.personalInfo.email && <span>{resume.personalInfo.email}</span>}
          {resume.personalInfo.phone && <span>· {resume.personalInfo.phone}</span>}
          {resume.personalInfo.location && <span>· {resume.personalInfo.location}</span>}
          {resume.personalInfo.linkedin && <span>· {resume.personalInfo.linkedin}</span>}
          {resume.personalInfo.github && <span>· {resume.personalInfo.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {resume.summary && (
        <div className="mb-4">
          <h2 className="text-xs font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-200 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-xs text-gray-700 leading-relaxed">{resume.summary}</p>
        </div>
      )}

      {/* Education */}
      {resume.education.some(e => e.institution) && (
        <div className="mb-4">
          <h2 className="text-xs font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-200 pb-1 mb-2">
            Education
          </h2>
          {resume.education.filter(e => e.institution).map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold">{edu.institution}</span>
                <span className="text-xs text-gray-500">{edu.year}</span>
              </div>
              <p className="text-xs text-gray-600">
                {edu.degree} {edu.field && `in ${edu.field}`}
                {edu.gpa && ` · GPA: ${edu.gpa}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Experience */}
      {resume.experience.some(e => e.company) && (
        <div className="mb-4">
          <h2 className="text-xs font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-200 pb-1 mb-2">
            Experience
          </h2>
          {resume.experience.filter(e => e.company).map((exp, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold">{exp.role}</span>
                <span className="text-xs text-gray-500">{exp.duration}</span>
              </div>
              <p className="text-xs text-indigo-600 font-medium mb-1">{exp.company}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {resume.projects.some(p => p.name) && (
        <div className="mb-4">
          <h2 className="text-xs font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-200 pb-1 mb-2">
            Projects
          </h2>
          {resume.projects.filter(p => p.name).map((proj, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold">{proj.name}</span>
                {proj.link && <span className="text-xs text-indigo-600">{proj.link}</span>}
              </div>
              {proj.tech && (
                <div className="flex flex-wrap gap-1 my-1">
                  {proj.tech.split(',').map((t, j) => (
                    <span key={j} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-600 leading-relaxed">{proj.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {Object.values(resume.skills).some(Boolean) && (
        <div className="mb-4">
          <h2 className="text-xs font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-200 pb-1 mb-2">
            Technical Skills
          </h2>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {resume.skills.languages && (
              <p><span className="font-semibold">Languages:</span> {resume.skills.languages}</p>
            )}
            {resume.skills.frameworks && (
              <p><span className="font-semibold">Frameworks:</span> {resume.skills.frameworks}</p>
            )}
            {resume.skills.tools && (
              <p><span className="font-semibold">Tools:</span> {resume.skills.tools}</p>
            )}
            {resume.skills.databases && (
              <p><span className="font-semibold">Databases:</span> {resume.skills.databases}</p>
            )}
          </div>
        </div>
      )}

      {/* Achievements */}
      {resume.achievements.some(Boolean) && (
        <div className="mb-4">
          <h2 className="text-xs font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-200 pb-1 mb-2">
            Achievements & Awards
          </h2>
          <ul className="list-disc pl-4 space-y-1">
            {resume.achievements.filter(Boolean).map((a, i) => (
              <li key={i} className="text-xs text-gray-700">{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Resume Builder</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Build an ATS-friendly resume</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {preview ? <EyeOff size={15} /> : <Eye size={15} />}
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>

      {preview ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <ResumePreview />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column — form */}
          <div>
            {/* Personal Info */}
            <Section title="Personal Information">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Full Name" value={resume.personalInfo.name}
                  onChange={e => updatePersonal('name', e.target.value)} placeholder="Rajan Kumar" />
                <Input label="Email" value={resume.personalInfo.email}
                  onChange={e => updatePersonal('email', e.target.value)} placeholder="you@email.com" />
                <Input label="Phone" value={resume.personalInfo.phone}
                  onChange={e => updatePersonal('phone', e.target.value)} placeholder="+91 98765 43210" />
                <Input label="Location" value={resume.personalInfo.location}
                  onChange={e => updatePersonal('location', e.target.value)} placeholder="Pilani, Rajasthan" />
                <Input label="LinkedIn" value={resume.personalInfo.linkedin}
                  onChange={e => updatePersonal('linkedin', e.target.value)} placeholder="linkedin.com/in/..." />
                <Input label="GitHub" value={resume.personalInfo.github}
                  onChange={e => updatePersonal('github', e.target.value)} placeholder="github.com/..." />
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Portfolio URL</label>
                <input value={resume.personalInfo.portfolio}
                  onChange={e => updatePersonal('portfolio', e.target.value)}
                  placeholder="yourportfolio.com"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </Section>

            {/* Summary */}
            <Section title="Professional Summary">
              <textarea
                value={resume.summary}
                onChange={e => setResume(r => ({ ...r, summary: e.target.value }))}
                placeholder="Brief summary of your skills, experience, and what you're looking for..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </Section>

            {/* Skills */}
            <Section title="Technical Skills">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Programming Languages" value={resume.skills.languages}
                  onChange={e => updateSkills('languages', e.target.value)} placeholder="Python, Java, C++" />
                <Input label="Frameworks" value={resume.skills.frameworks}
                  onChange={e => updateSkills('frameworks', e.target.value)} placeholder="React, Node.js, Django" />
                <Input label="Tools" value={resume.skills.tools}
                  onChange={e => updateSkills('tools', e.target.value)} placeholder="Git, Docker, AWS" />
                <Input label="Databases" value={resume.skills.databases}
                  onChange={e => updateSkills('databases', e.target.value)} placeholder="MongoDB, MySQL, Redis" />
              </div>
            </Section>
          </div>

          {/* Right column */}
          <div>
            {/* Education */}
            <Section title="Education">
              {resume.education.map((edu, i) => (
                <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-xl p-3 mb-3 relative">
                  {resume.education.length > 1 && (
                    <button onClick={() => removeEducation(i)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Institution" value={edu.institution}
                      onChange={e => updateEducation(i, 'institution', e.target.value)}
                      placeholder="BITS Pilani" />
                    <Input label="Degree" value={edu.degree}
                      onChange={e => updateEducation(i, 'degree', e.target.value)}
                      placeholder="B.Tech" />
                    <Input label="Field of Study" value={edu.field}
                      onChange={e => updateEducation(i, 'field', e.target.value)}
                      placeholder="Computer Science" />
                    <Input label="Year" value={edu.year}
                      onChange={e => updateEducation(i, 'year', e.target.value)}
                      placeholder="2022 - 2026" />
                    <Input label="GPA/%" value={edu.gpa}
                      onChange={e => updateEducation(i, 'gpa', e.target.value)}
                      placeholder="8.5 / 10" />
                  </div>
                </div>
              ))}
              <button onClick={addEducation}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                <Plus size={13} /> Add Education
              </button>
            </Section>

            {/* Experience */}
            <Section title="Work Experience">
              {resume.experience.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-600 mb-3">No experience added yet</p>
              ) : (
                resume.experience.map((exp, i) => (
                  <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-xl p-3 mb-3 relative">
                    <button onClick={() => removeExperience(i)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Company" value={exp.company}
                        onChange={e => updateExperience(i, 'company', e.target.value)}
                        placeholder="Google" />
                      <Input label="Role" value={exp.role}
                        onChange={e => updateExperience(i, 'role', e.target.value)}
                        placeholder="SWE Intern" />
                      <div className="col-span-2">
                        <Input label="Duration" value={exp.duration}
                          onChange={e => updateExperience(i, 'duration', e.target.value)}
                          placeholder="May 2024 - Aug 2024" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
                        <textarea value={exp.description}
                          onChange={e => updateExperience(i, 'description', e.target.value)}
                          placeholder="What you did, impact, technologies used..."
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                      </div>
                    </div>
                  </div>
                ))
              )}
              <button onClick={addExperience}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                <Plus size={13} /> Add Experience
              </button>
            </Section>

            {/* Projects */}
            <Section title="Projects">
              {resume.projects.map((proj, i) => (
                <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-xl p-3 mb-3 relative">
                  {resume.projects.length > 1 && (
                    <button onClick={() => removeProject(i)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Project Name" value={proj.name}
                      onChange={e => updateProject(i, 'name', e.target.value)}
                      placeholder="CampusConnect" />
                    <Input label="GitHub/Live Link" value={proj.link}
                      onChange={e => updateProject(i, 'link', e.target.value)}
                      placeholder="github.com/..." />
                    <div className="col-span-2">
                      <Input label="Tech Stack (comma separated)" value={proj.tech}
                        onChange={e => updateProject(i, 'tech', e.target.value)}
                        placeholder="React, Node.js, MongoDB" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
                      <textarea value={proj.description}
                        onChange={e => updateProject(i, 'description', e.target.value)}
                        placeholder="What it does, key features, your role..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addProject}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                <Plus size={13} /> Add Project
              </button>
            </Section>

            {/* Achievements */}
            <Section title="Achievements & Awards">
              {resume.achievements.map((ach, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={ach}
                    onChange={e => updateAchievement(i, e.target.value)}
                    placeholder="e.g. Winner of Smart India Hackathon 2024"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {resume.achievements.length > 1 && (
                    <button onClick={() => removeAchievement(i)}
                      className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addAchievement}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                <Plus size={13} /> Add Achievement
              </button>
            </Section>
          </div>
        </div>
      )}
    </Layout>
  )
}