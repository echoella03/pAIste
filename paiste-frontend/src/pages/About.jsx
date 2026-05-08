import { useNavigate } from 'react-router-dom'

const team = [
  {
    name: 'Daniela J. Comapon',
    role: 'PROJECT LEADER',
    photo: '/dan.jpg',
    desc: '"Responsible for System Design, Coding and Model Training"',
  },
  {
    name: 'Andrae D. Bretana',
    role: 'TEAM MEMBER',
    photo: '/andrae.jpg',
    desc: '"Oversees data collection, dataset validation, and final research paper documentation."',
  },
  {
    name: 'Yza J. Prochina',
    role: 'TEAM MEMBER',
    photo: '/yza.jpg',
    desc: '"Manages dataset acquisition, system field testing, and technical documentation."',
  },
]

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'white' }}>
      <nav className="navbar-dark px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">                                     
          <img src="/pAIste-logo.png" alt="pAIste" className="h-10 w-10 object-contain" />
          <span className="font-londrina text-white text-m tracking-widest hidden md:block">
            INVASIVE ALIEN SPECIES DETECTION SYSTEM
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/')} className="text-white font-londrina tracking-wider text-m hover:text-green-300">HOME</button>
          <button onClick={() => navigate('/about')} className="text-white font-londrina tracking-wider text-m hover:text-green-300">ABOUT</button>
          <button onClick={() => navigate('/login')} className="text-white font-londrina tracking-wider text-m hover:text-green-300">LOGIN</button>
          <button onClick={() => navigate('/register')} className="text-white font-londrina tracking-wider text-m hover:text-green-300">REGISTER</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* What is pAIste */}
        <section className="rounded-2xl p-8 shadow-sm" style={{ backgroundColor: '#FAFAF4' }}>
          <h2 className="font-nerko text-3xl text-center mb-4" style={{ color: '#0D3A24' }}>What is pAIste?</h2>
          <p className="font-manjari text-gray-700 text-center leading-relaxed">
            <strong>pAIste</strong> is a web-based monitoring and analytics platform developed to protect the unique
            biodiversity of the Davao Region (Region XI). Our system addresses the ecological threat of Invasive
            Alien Species (IAS) by providing an automated tool for real-time identification and geographical
            mapping. By integrating advanced deep learning, pAIste enables environmentalists to track the
            spread of non-native species that disrupt local ecosystems and agriculture.
          </p>
        </section>

        {/* Technical Workflow */}
        <section className="rounded-2xl p-8 shadow-sm" style={{ backgroundColor: '#FAFAF4' }}>
          <h2 className="font-nerko text-3xl text-center mb-4" style={{ color: '#0D3A24' }}>Technical Workflow</h2>
          <p className="font-manjari text-gray-700 mb-3">The system employs a Two-Stage Hybrid Pipeline for maximum precision:</p>
          <ol className="space-y-3 font-manjari text-gray-700">
            <li>
              <strong>1. Detection (YOLOv8):</strong> Scans the environment to locate potential organisms in real-time and isolates them for analysis.
            </li>
            <li>
              <strong>2. Classification (ResNet50):</strong> ResNet-50 is a deep neural network that uses residual learning, which task is to perform high-accuracy classification to identify the specific invasive species among 17 priority targets.
            </li>
            <li>
              <strong>3. Mapping & Analytics:</strong> Confirmed detections are tagged with location data and visualized on an interactive dashboard to track species distribution across the Davao landscape.
            </li>
          </ol>
        </section>

        {/* Why it matters */}
        <section className="rounded-2xl p-8 shadow-sm" style={{ backgroundColor: '#FAFAF4' }}>
          <h2 className="font-nerko text-3xl text-center mb-4" style={{ color: '#0D3A24' }}>Why it matters?</h2>
          <p className="font-manjari text-gray-700 text-center leading-relaxed">
            Invasive Alien Species are a primary driver of biodiversity loss. In the Davao Region, these species
            threaten endemic wildlife and agricultural stability. pAIste provides a scalable, AI-driven solution to
            assist local authorities and researchers in identifying these threats before they cause irreversible
            damage to our environment.
          </p>
        </section>

        {/* Development Team */}
        <section className="rounded-2xl p-8 shadow-sm" style={{ backgroundColor: '#FAFAF4' }}>
          <h2 className="font-nerko text-3xl text-center mb-8" style={{ color: '#0D3A24' }}>Development Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4 shadow">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = 'none'
                      e.target.parentElement.style.background = '#466958'
                    }}
                  />
                </div>
                <p className="font-manjari font-bold text-gray-800">{member.name}</p>
                <p className="font-londrina text-xs tracking-widest mt-1" style={{ color: '#466958' }}>{member.role}</p>
                <p className="font-manjari text-gray-500 text-sm mt-2 italic">{member.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
