import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Star, Briefcase } from 'lucide-react';

import InfluencerForm from './InfluencerForm';
import JobForm from './JobForm';
import AdminDashboard from './Admin';

const Home = () => {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { path: '/influencer', title: 'Influencer / KOL', desc: 'PR Box Reviews & Promotion', icon: <Star size={18} /> },
    { path: '/careers', title: 'Careers @ BARE', desc: 'Join the Corporate Team', icon: <Briefcase size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col justify-between">
      
      {/* === HEADER === */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-center shadow-sm">
          <div className="w-30 h-20 flex items-center justify-center">
             <img src="/logo.jpg" alt="BARE Logo" className="h-full object-contain" />
          </div>
      </nav>

      {/* === MAIN CONTENT === */}
      <div className="flex-grow flex flex-col items-center justify-center px-6 pt-30 pb-20 w-full relative z-10 min-h-[100vh]">
        
        <div className="text-center mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Welcome to B.A.R.E</p>
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-widest leading-tight mb-4">
            Registration
          </h1>
          <p className="text-gray-500 text-sm tracking-wide">Select your pathway below.</p>
        </div>

        {/* === STYLED DROPDOWN === */}
        <div className="w-full max-w-md relative animate-in zoom-in-95 duration-500">
           
           <button 
              onClick={() => setIsOpen(!isOpen)} 
              className={`w-full flex items-center justify-between p-6 bg-black text-white text-left transition-all duration-300 ${isOpen ? 'rounded-t-xl' : 'rounded-xl shadow-2xl hover:scale-[1.02]'}`}
           >
              <span className="text-sm font-bold uppercase tracking-widest">Select Application Type</span>
              <ChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
           </button>

           {isOpen && (
             <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 shadow-2xl rounded-b-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                {options.map((opt, idx) => (
                   <Link 
                      key={idx} 
                      to={opt.path} 
                      className="flex items-center gap-4 p-6 border-b border-gray-50 hover:bg-gray-50 transition-colors group"
                   >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-black group-hover:text-white transition-colors">
                         {opt.icon}
                      </div>
                      <div className="flex-1">
                         <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 group-hover:tracking-widest transition-all">{opt.title}</h3>
                         <p className="text-[10px] text-gray-400 uppercase tracking-wider">{opt.desc}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                   </Link>
                ))}
             </div>
           )}

           {isOpen && <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />}
        </div>

      </div>

      {/* === FOOTER === */}
      <footer className="bg-black pt-20 md:pt-32 pb-16 px-6 md:px-12 border-t border-neutral-800 font-sans text-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
            <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="w-20 md:w-24 aspect-square mb-8 rounded-full overflow-hidden border border-neutral-800"><img src="/logo.jpg" alt="BARE Logo" className="w-full h-full object-cover" /></div>
              <p className="text-neutral-400 text-sm mb-10 max-w-sm leading-loose font-sans tracking-wide">Inspiring confidence, creativity, and community through authentic beauty products.</p>
              <h4 className="font-bold uppercase tracking-[0.2em] text-xs mb-6 font-sans text-neutral-300">Ready to Partner?</h4>
              <div className="flex flex-col gap-4 w-full md:w-auto">
                <a href="https://t.me/jyongwang" target="_blank" rel="noopener noreferrer" className="bg-white text-black px-10 py-4 uppercase text-xs font-bold tracking-[0.2em] hover:bg-neutral-200 transition w-full md:w-auto text-center">Start Partnership</a>
                <a href="https://www.instagram.com/_bare.official_?igsh=MTFhYnpzcW8xcjBvZA==" target="_blank" rel="noopener noreferrer" className="bg-black text-white border-2 border-white px-10 py-4 uppercase text-xs font-bold tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300 w-full md:w-auto inline-block text-center font-sans">Instagram</a>
                <a href="https://www.facebook.com/bareofficialpage" target="_blank" rel="noopener noreferrer" className="bg-black text-white border-2 border-white px-10 py-4 uppercase text-xs font-bold tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300 w-full md:w-auto inline-block text-center font-sans">Facebook</a>
              </div>
            </div>
            <div className="lg:col-span-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-10 border-b border-neutral-800 pb-4 inline-block font-sans text-neutral-300">Contact Us</h3>
              <ul className="space-y-8 text-sm text-neutral-400 font-sans tracking-wide">
                <li>B.A.R.E Trading Co., Ltd.<br/>Phnom Penh, Cambodia</li>
                <li><a href="mailto:Barecambodia@gmail.com" className="hover:text-white">Barecambodia@gmail.com</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mt-20 md:mt-32">
            <p>© 2025 B.A.R.E Trading Co., Ltd. All rights reserved.</p>
            <div className="flex gap-8 mt-6 md:mt-0">
              <a href="https://barepartnership.netlify.app/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="https://bareofficialtermandcondition.netlify.app/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Terms & Conditions</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/influencer" element={<InfluencerForm />} />
        <Route path="/careers" element={<JobForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}