import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronRight, ChevronLeft, Check, ArrowDown, Video, Instagram, AlertCircle } from 'lucide-react';
import { supabase } from './supabaseClient'; 

export default function InfluencerForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  // === CUSTOM MODAL STATE ===
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'error' });

  const showMessage = (title, message, type = 'error') => {
    setModal({ show: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, show: false });
    if (modal.type === 'success') {
      window.location.href = '/'; 
    }
  };

  // 1. Main form data
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', 
    tiktokLink: '', instagramLink: '',
    followerCounts: '', 
    ugcExperience: 'No', contentSamples: '',
    collaborationReason: '', agreement: false
  });

  // 2. State for dynamic platform selection
  const [platforms, setPlatforms] = useState({ tiktok: false, instagram: false, facebook: false });
  const [counts, setCounts] = useState({ tiktok: '', instagram: '', facebook: '' });

  // 3. Auto-update followerCounts string whenever platforms/counts change
  useEffect(() => {
    const lines = [];
    if (platforms.tiktok) lines.push(`TikTok: ${counts.tiktok || 'N/A'}`);
    if (platforms.instagram) lines.push(`Instagram: ${counts.instagram || 'N/A'}`);
    if (platforms.facebook) lines.push(`Facebook/Other: ${counts.facebook || 'N/A'}`);
    setFormData(prev => ({ ...prev, followerCounts: lines.join('\n') }));
  }, [platforms, counts]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollTop = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePlatformToggle = (key) => setPlatforms(prev => ({ ...prev, [key]: !prev[key] }));
  const handleCountChange = (key, value) => setCounts(prev => ({ ...prev, [key]: value }));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // === VALIDATION ===
  const validateStep1 = () => {
    if (!formData.fullName.trim()) { showMessage("Missing Name", "Please enter your full name."); return false; }
    
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 10) { 
        showMessage("Invalid Phone", "Phone number must be 9-10 digits."); 
        return false; 
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { 
        showMessage("Invalid Email", "Please enter a valid email address."); 
        return false; 
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1) {
        if (!validateStep1()) {
            scrollTop(); 
            return;
        }
    }
    if (step === 2) {
        if (!formData.tiktokLink && !formData.instagramLink && !formData.followerCounts) {
            showMessage("Socials Required", "Please provide at least one profile link or follower count.");
            scrollTop();
            return;
        }
    }
    setStep(s => s + 1);
    scrollTop();
  };

  const prevStep = () => { setStep(s => s - 1); scrollTop(); };

  const handleSubmit = async () => {
    if (!formData.agreement) {
        return showMessage("Agreement Required", "You must agree to the content terms to proceed.");
    }
    
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('Influencer') 
        .insert([
          {
            full_name: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            tiktok_link: formData.tiktokLink,
            instagram_link: formData.instagramLink,
            follower_counts: formData.followerCounts,
            ugc_experience: formData.ugcExperience,
            content_samples: formData.contentSamples,
            collaboration_reason: formData.collaborationReason
          }
        ]);

      if (error) throw error;
      showMessage("Application Sent!", "Welcome to the Creator Circle.", "success");
    } catch (error) {
      console.error(error);
      showMessage("Network Error", "Unable to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-sans bg-white text-gray-900 relative">
      
      {modal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-black flex flex-col items-center text-center p-8 animate-in zoom-in-95 duration-200">
             <div className={`mb-6 p-4 rounded-full ${modal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {modal.type === 'success' ? <Check size={32} /> : <AlertCircle size={32} />}
             </div>
             <h3 className="text-xl font-bold uppercase tracking-widest mb-3">{modal.title}</h3>
             <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed px-2">{modal.message}</p>
             <button onClick={closeModal} className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-neutral-800 transition shadow-lg text-xs">
               {modal.type === 'success' ? 'Finish' : 'Understood'}
             </button>
          </div>
        </div>
      )}

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-center items-center shadow-sm transition-all duration-300">
        <div className="w-30 h-20 flex items-center justify-center">
           <img src="/logo.jpg" alt="BARE Logo" className="h-full object-contain" />
        </div>
      </nav>

      <div className="min-h-screen flex flex-col items-center justify-center relative p-6 pt-32">
        <div className="text-center space-y-6 max-w-3xl">
          <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">Influencer Program</p>
          <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-widest leading-tight">PR Box<br />Creator</h1>
          <button onClick={scrollToForm} className="bg-black text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-xl mt-8">
             Apply for PR
          </button>
        </div>
        <div className="absolute bottom-10 animate-bounce cursor-pointer" onClick={scrollToForm}>
          <ArrowDown className="text-gray-400 w-6 h-6" />
        </div>
      </div>

      <div ref={formRef} className="scroll-mt-32 min-h-screen flex flex-col items-center pb-20 px-6">
        <div className="w-full max-w-4xl relative">
          <div className="flex justify-center items-center mb-16 pt-10">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all border-2 ${step === num ? 'bg-black text-white border-black scale-110' : step > num ? 'bg-black text-white border-black' : 'bg-white text-gray-300 border-gray-200'}`}>
                  {step > num ? <Check size={24} /> : num}
                </div>
                {num !== 3 && <div className={`w-24 h-0.5 mx-4 ${step > num ? 'bg-black' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase">01. Identity</h2>
              <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g. Sok Dara" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField label="Telegram Phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g. 096 123 4567" maxLength={10} />
                <InputField label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" placeholder="name@example.com" />
              </div>
              <div className="flex justify-end pt-8">
                <button onClick={nextStep} className="bg-black text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-3 text-sm">Next Step <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase">02. Social Presence</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField label="TikTok Profile Link" name="tiktokLink" value={formData.tiktokLink} onChange={handleChange} placeholder="https://tiktok.com/@yourname" />
                <InputField label="Instagram Profile Link" name="instagramLink" value={formData.instagramLink} onChange={handleChange} placeholder="https://instagram.com/yourname" />
              </div>
              <div className="mb-8 p-6 bg-gray-50 border-l-4 border-black">
                <label className="block text-sm font-bold text-gray-900 mb-4 uppercase">Follower Counts (Select Active)</label>
                <div className="mb-4">
                   <label className="flex items-center gap-3 cursor-pointer mb-2">
                      <input type="checkbox" checked={platforms.tiktok} onChange={() => handlePlatformToggle('tiktok')} className="w-5 h-5 accent-black" />
                      <span className="font-bold uppercase text-xs flex items-center gap-2"><Video size={14}/> TikTok</span>
                   </label>
                   {platforms.tiktok && (
                      <input type="text" value={counts.tiktok} onChange={(e) => handleCountChange('tiktok', e.target.value)} className="w-full bg-white border border-gray-200 p-3 text-sm outline-none focus:border-black transition-colors" placeholder="e.g. 50k" />
                   )}
                </div>
                <div className="mb-4">
                   <label className="flex items-center gap-3 cursor-pointer mb-2">
                      <input type="checkbox" checked={platforms.instagram} onChange={() => handlePlatformToggle('instagram')} className="w-5 h-5 accent-black" />
                      <span className="font-bold uppercase text-xs flex items-center gap-2"><Instagram size={14}/> Instagram</span>
                   </label>
                   {platforms.instagram && (
                      <input type="text" value={counts.instagram} onChange={(e) => handleCountChange('instagram', e.target.value)} className="w-full bg-white border border-gray-200 p-3 text-sm outline-none focus:border-black transition-colors" placeholder="e.g. 10k" />
                   )}
                </div>
                <div>
                   <label className="flex items-center gap-3 cursor-pointer mb-2">
                      <input type="checkbox" checked={platforms.facebook} onChange={() => handlePlatformToggle('facebook')} className="w-5 h-5 accent-black" />
                      <span className="font-bold uppercase text-xs">Facebook / Other</span>
                   </label>
                   {platforms.facebook && (
                      <input type="text" value={counts.facebook} onChange={(e) => handleCountChange('facebook', e.target.value)} className="w-full bg-white border border-gray-200 p-3 text-sm outline-none focus:border-black transition-colors" placeholder="e.g. 200k" />
                   )}
                </div>
              </div>
              <div className="flex justify-between pt-8">
                <button onClick={prevStep} className="text-gray-500 font-bold uppercase flex items-center gap-2 hover:text-black transition text-sm"><ChevronLeft size={18} /> Back</button>
                <button onClick={nextStep} className="bg-black text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-3 text-sm">Next Step <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase">03. Experience & Terms</h2>
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-900 mb-4 uppercase">Have you created UGC before?</label>
                <div className="flex gap-8">
                  {['Yes', 'No'].map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="ugcExperience" value={opt} checked={formData.ugcExperience === opt} onChange={handleChange} className="w-5 h-5 accent-black" />
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              {formData.ugcExperience === 'Yes' && (
                <div className="mb-8">
                   <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Previous Content Samples</label>
                   <textarea name="contentSamples" value={formData.contentSamples} onChange={handleChange} className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 outline-none text-lg h-32 focus:border-black transition-colors resize-none" placeholder="Paste links to your best videos here..." />
                </div>
              )}
              <div className="mb-8">
                 <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Why collaborate with BARE?</label>
                 <textarea name="collaborationReason" value={formData.collaborationReason} onChange={handleChange} className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 outline-none text-lg h-32 focus:border-black transition-colors resize-none" placeholder="Tell us your story and why you love skincare..." />
              </div>
              <div className="bg-black text-white p-8 rounded-sm mb-8">
                <h3 className="text-sm font-bold uppercase mb-4 tracking-wider border-b border-gray-700 pb-2">Creator Agreement</h3>
                <ul className="text-xs text-gray-400 space-y-2 mb-6 list-disc pl-4">
                    <li>I agree to create <strong>1 video</strong> within <strong>10 days</strong> of receiving the product.</li>
                    <li>I understand this collaboration is <strong>product-gifted</strong> only (no cash payment).</li>
                    <li>I grant BARE rights to repost the content on social media.</li>
                </ul>
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setFormData({...formData, agreement: !formData.agreement})}>
                    <div className={`w-5 h-5 border-2 border-white flex items-center justify-center transition-colors ${formData.agreement ? 'bg-white' : 'bg-transparent'}`}>
                        {formData.agreement && <Check size={14} className="text-black" />}
                    </div>
                    <input type="checkbox" name="agreement" checked={formData.agreement} onChange={handleChange} className="hidden" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">I agree and understand</span>
                </div>
              </div>
              <div className="flex justify-between pt-8">
                <button onClick={prevStep} className="text-gray-500 font-bold uppercase flex items-center gap-2 hover:text-black transition text-sm"><ChevronLeft size={18} /> Back</button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="bg-black text-white px-12 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-lg text-sm flex items-center gap-3">
                  {isSubmitting ? 'Sending...' : 'Submit Application'} <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
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
}

const InputField = ({ label, name, value, onChange, type = "text", placeholder, maxLength }) => (
  <div className="mb-8">
    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">{label}</label>
    <input 
      type={type} 
      name={name} 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      maxLength={maxLength}
      className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 outline-none text-lg focus:border-black transition-colors" 
    />
  </div>
);