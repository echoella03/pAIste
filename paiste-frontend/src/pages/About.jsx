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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'white' }}>
      
      {/* Navbar - Original Structure Preserved */}
      <nav className="navbar-dark px-4 md:px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src="/pAIste-logo.png" alt="pAIste" className="h-10 w-10 object-contain shrink-0" />
          <span className="font-londrina text-white text-m tracking-widest hidden md:block">
            INVASIVE ALIEN SPECIES DETECTION SYSTEM
          </span>
        </div>
        
        {/* Adjusted gap for mobile (gap-3) vs desktop (gap-6) to prevent overflow */}
        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <button onClick={() => navigate('/')} className="text-white font-londrina tracking-wider text-xs md:text-m hover:text-green-300">HOME</button>
          <button onClick={() => navigate('/about')} className="text-white font-londrina tracking-wider text-xs md:text-m hover:text-green-300 border-b-2 border-green-300">ABOUT</button>
          <button onClick={() => navigate('/login')} className="text-white font-londrina tracking-wider text-xs md:text-m hover:text-green-300">LOGIN</button>
          <button onClick={() => navigate('/register')} className="text-white font-londrina tracking-wider text-xs md:text-m hover:text-green-300">REGISTER</button>
        </div>
      </nav>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        
        <section className="rounded-2xl p-8 shadow-sm bg-[#FAFAF4]">
          <h2 className="font-nerko text-3xl text-center mb-4 text-[#0D3A24]">What is pAIste?</h2>
          <p className="font-manjari text-gray-700 text-center leading-relaxed">
            <strong>pAIste</strong> is a web-based monitoring and analytics platform developed to protect the unique
            biodiversity of the Davao Region (Region XI). Our system addresses the ecological threat of Invasive
            Alien Species (IAS) by providing an automated tool for real-time identification and geographical mapping.
          </p>
        </section>

        <section className="rounded-2xl p-8 shadow-sm bg-[#FAFAF4]">
          <h2 className="font-nerko text-3xl text-center mb-4 text-[#0D3A24]">Technical Workflow</h2>
          <ol className="space-y-3 font-manjari text-gray-700">
            <li><strong>1. Detection (YOLOv8):</strong> Scans the environment to locate organisms.</li>
            <li><strong>2. Classification (ResNet50):</strong> Performs high-accuracy classification of species.</li>
            <li><strong>3. Mapping & Analytics:</strong> Location tagging and interactive visualization.</li>
          </ol>
        </section>

        {/* Development Team Section */}
        <section className="rounded-2xl p-8 shadow-sm bg-[#FAFAF4]">
          <h2 className="font-nerko text-3xl text-center mb-10 text-[#0D3A24]">Development Team</h2>
          
          {/* Top Row: Students */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {team.slice(0, 3).map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4 shadow">
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
                <p className="font-manjari font-bold text-gray-800">{member.name}</p>
                <p className="font-londrina text-xs tracking-widest mt-1 text-[#466958]">{member.role}</p>
                <p className="font-manjari text-gray-500 text-sm mt-2 italic px-2">{member.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom Row: Adviser (Centered) */}
          <div className="flex justify-center border-t border-gray-100 pt-8">
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4 shadow border-2 border-[#466958]">
                <img
                  src={team[3].photo}
                  alt={team[3].name}
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.parentElement.style.background = '#466958';
                  }}
                />
              </div>
              <p className="font-manjari font-bold text-gray-800">{team[3].name}</p>
              <p className="font-londrina text-xs tracking-widest mt-1 text-[#0D3A24]">{team[3].role}</p>
              <p className="font-manjari text-gray-500 text-sm mt-2 italic">{team[3].desc}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
