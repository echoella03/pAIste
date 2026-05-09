import React from 'react';
import { useNavigate } from 'react-router-dom';

const team = [
  {
    name: 'Daniela J. Comapon',
    role: 'PROJECT LEADER',
    photo: '/dan.jpg',
    desc: '"Responsible for System Design, Coding and Model Training"',
  },
  {
    name: 'Andrae D. Bretaña',
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
  {
    name: 'Dr. Maureen M. Villamor',
    role: 'THESIS ADVISER',
    photo: '/maui.png',
    desc: '"Supervises research development and academic validation of the system."',
  },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="navbar-dark px-4 md:px-8 py-3 flex items-center justify-between bg-[#0D3A24]">
        <div className="flex items-center gap-3">
          <img src="/pAIste-logo.png" alt="pAIste" className="h-10 w-10 object-contain" />
          <span className="font-londrina text-white text-sm md:text-m tracking-widest hidden sm:block">
            INVASIVE ALIEN SPECIES DETECTION SYSTEM
          </span>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <button onClick={() => navigate('/')} className="text-white font-londrina tracking-wider text-xs md:text-m hover:text-green-300">HOME</button>
          <button onClick={() => navigate('/about')} className="text-white font-londrina tracking-wider text-xs md:text-m hover:text-green-300 border-b-2 border-green-300">ABOUT</button>
          <button onClick={() => navigate('/login')} className="text-white font-londrina tracking-wider text-xs md:text-m hover:text-green-300">LOGIN</button>
          <button onClick={() => navigate('/register')} className="text-white font-londrina tracking-wider text-xs md:text-m hover:text-green-300">REGISTER</button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        
        {/* Project Info Sections */}
        <div className="grid grid-cols-1 gap-8">
          <section className="rounded-2xl p-6 md:p-8 shadow-sm bg-[#FAFAF4]">
            <h2 className="font-nerko text-3xl text-center mb-4 text-[#0D3A24]">What is pAIste?</h2>
            <p className="font-manjari text-gray-700 text-center leading-relaxed">
              <strong>pAIste</strong> is a web-based monitoring and analytics platform developed to protect the unique
              biodiversity of the Davao Region (Region XI). Our system addresses the ecological threat of Invasive
              Alien Species (IAS) by providing an automated tool for real-time identification and geographical
              mapping.
            </p>
          </section>

          <section className="rounded-2xl p-6 md:p-8 shadow-sm bg-[#FAFAF4]">
            <h2 className="font-nerko text-3xl text-center mb-4 text-[#0D3A24]">Technical Workflow</h2>
            <div className="space-y-4 font-manjari text-gray-700">
              <div className="flex gap-4">
                <span className="font-bold text-[#466958]">01</span>
                <p><strong>Detection (YOLOv8):</strong> Scans the environment to locate potential organisms in real-time.</p>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-[#466958]">02</span>
                <p><strong>Classification (ResNet50):</strong> Performs high-accuracy classification among 17 target species.</p>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-[#466958]">03</span>
                <p><strong>Mapping & Analytics:</strong> Visualizes distribution data across the Davao landscape.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Team Section */}
        <section className="rounded-2xl p-6 md:p-10 shadow-sm bg-[#FAFAF4]">
          <h2 className="font-nerko text-4xl text-center mb-12 text-[#0D3A24]">Development Team</h2>
          
          {/* Student Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
            {team.slice(0, 3).map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center group">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-gray-200 mb-4 shadow-md transition-transform group-hover:scale-105">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = 'none';
                      e.target.parentElement.style.background = '#466958';
                    }}
                  />
                </div>
                <p className="font-manjari font-bold text-gray-800 text-lg">{member.name}</p>
                <p className="font-londrina text-xs tracking-widest mt-1 text-[#466958]">{member.role}</p>
                <p className="font-manjari text-gray-500 text-sm mt-3 italic px-2">{member.desc}</p>
              </div>
            ))}
          </div>

          {/* Thesis Adviser - Centered Below */}
          <div className="flex justify-center border-t border-gray-200 pt-12">
            <div className="flex flex-col items-center text-center max-w-sm group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-gray-200 mb-4 shadow-lg border-4 border-[#466958] transition-transform group-hover:scale-105">
                <img
                  src={team[3].photo}
                  alt={team[3].name}
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.parentElement.style.background = '#0D3A24';
                  }}
                />
              </div>
              <p className="font-manjari font-bold text-gray-800 text-lg">{team[3].name}</p>
              <p className="font-londrina text-xs tracking-widest mt-1 text-[#0D3A24]">{team[3].role}</p>
              <p className="font-manjari text-gray-600 text-sm mt-3 italic px-4 font-medium leading-relaxed">
                {team[3].desc}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
