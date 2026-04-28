import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, ArrowDown, AlertCircle, ArrowLeft } from 'lucide-react';

export default function UGCForm() {
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

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', shippingAddress: '', dob: '',
    tiktokHandle: '', instagramHandle: '', portfolioLink: '', 
    contentNiche: [], // Multi-select array
    skinType: '', skinTone: '', skinConcerns: [], rates: '', usageRights: false
  });

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollTop = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // === MULTI-SELECT LOGIC (Content Niche) ===
  const handleNicheToggle = (value) => {
    setFormData(prev => {
      const list = prev.contentNiche;
      return list.includes(value) 
        ? { ...prev, contentNiche: list.filter(item => item !== value) } 
        : { ...prev, contentNiche: [...list, value] };
    });
  };

  // === MULTI-SELECT LOGIC (Skin Concerns) ===
  const handleCheckbox = (value, field) => {
    setFormData(prev => {
      const list = prev[field];
      return list.includes(value) ? { ...prev, [field]: list.filter(item => item !== value) } : { ...prev, [field]: [...list, value] };
    });
  };

  // === VALIDATION ===
  const validateStep1 = () => {
    if (!formData.fullName.trim()) { showMessage("Missing Name", "Please enter your full name."); return false; }
    
    // Strict Phone Validation
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

    if (!formData.shippingAddress.trim()) { showMessage("Address Required", "Please provide a shipping address."); return false; }
    if (!formData.dob) { showMessage("DOB Required", "Please enter your date of birth."); return false; }

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
       if (formData.contentNiche.length === 0) {
          showMessage("Selection Required", "Please select at least one content niche.");
          scrollTop();
          return;
       }
       if (!formData.portfolioLink) {
          showMessage("Portfolio Required", "Please provide a link to your portfolio.");
          scrollTop();
          return;
       }
    }
    setStep(s => s + 1);
    scrollTop();
  };

  const prevStep = () => { setStep(s => s - 1); scrollTop(); };

  const handleSubmit = async () => {
    if (!formData.usageRights) {
        return showMessage("Agreement Required", "Please agree to the usage rights to proceed.");
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('https://my-backend-bareregistration.onrender.com/submit-ugc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showMessage("Application Submitted!", "Welcome to the B.A.R.E Content Circle.", "success");
      } else {
        const errorText = await response.text();
        console.error("Server Error:", errorText);
        showMessage("Submission Failed", "Server error. Please check console.");
      }
    } catch (error) { 
      console.error(error); 
      showMessage("Network Error", "Unable to connect to server."); 
    } 
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="font-sans bg-white text-gray-900 relative">
      
      {/* MODAL */}
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

      {/* HEADER WITH BACK BUTTON */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-center items-center shadow-sm transition-all duration-300">
        <Link 
          to="/" 
          className="absolute left-6 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-all duration-300"
          title="Return to Selection"
        >
           <ArrowLeft size={24} />
        </Link>
        <div className="w-30 h-20 flex items-center justify-center">
           <img src="/logo.jpg" alt="BARE Logo" className="h-full object-contain" />
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="min-h-screen flex flex-col items-center justify-center relative p-6 pt-32">
        <div className="text-center space-y-6 max-w-3xl">
          <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">Content Creator Program</p>
          <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-widest leading-tight">UGC &<br />Influencer</h1>
          
          <button onClick={scrollToForm} className="bg-black text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-xl mt-8">
             Start Application
          </button>
        </div>
        <div className="absolute bottom-10 animate-bounce cursor-pointer" onClick={scrollToForm}>
          <ArrowDown className="text-gray-400 w-6 h-6" />
        </div>
      </div>

      {/* FORM SECTION */}
      <div ref={formRef} className="scroll-mt-32 min-h-screen flex flex-col items-center pb-20 px-6">
        <div className="w-full max-w-4xl relative">
          
          {/* STEPPER */}
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

          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase">01. Personal Details</h2>
              
              <InputField 
                label="Full Legal Name" 
                name="fullName" 
                value={formData.fullName} 
                onChange={handleChange} 
                placeholder="e.g. Chan Thida" 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField 
                  label="Phone Number" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="e.g. 096 123 4567" 
                  maxLength={10} 
                />
                <InputField 
                  label="Email Address" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  type="email" 
                  placeholder="name@example.com" 
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Shipping Address</label>
                <textarea 
                  name="shippingAddress" 
                  value={formData.shippingAddress} 
                  onChange={handleChange} 
                  className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 outline-none text-lg h-32 focus:border-black transition-colors" 
                  placeholder="e.g. House #123, St 456, Sangkat..." 
                />
              </div>

              <div className="w-full md:w-1/2">
                 <InputField 
                   label="Date of Birth" 
                   name="dob" 
                   value={formData.dob} 
                   onChange={handleChange} 
                   type="date" 
                 />
              </div>

              <div className="flex justify-end pt-8">
                <button onClick={nextStep} className="bg-black text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-3 text-sm">Next Step <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase">02. Social & Portfolio</h2>
              
              <InputField 
                label="Portfolio Link (Drive/Canva)" 
                name="portfolioLink" 
                value={formData.portfolioLink} 
                onChange={handleChange} 
                placeholder="https://drive.google.com/..." 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField 
                  label="TikTok Handle" 
                  name="tiktokHandle" 
                  value={formData.tiktokHandle} 
                  onChange={handleChange} 
                  placeholder="@username" 
                />
                <InputField 
                  label="Instagram Handle" 
                  name="instagramHandle" 
                  value={formData.instagramHandle} 
                  onChange={handleChange} 
                  placeholder="@username" 
                />
              </div>
              
              {/* === MULTI-SELECT CONTENT NICHE === */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-900 mb-4 uppercase">Content Niche (Select all that apply)</label>
                <div className="flex flex-wrap gap-4">
                  {['Skincare', 'Makeup', 'Lifestyle', 'ASMR', 'Vlog'].map(opt => (
                    <button 
                        key={opt} 
                        onClick={() => handleNicheToggle(opt)} 
                        className={`px-6 py-3 border-2 font-bold uppercase tracking-widest transition 
                        ${formData.contentNiche.includes(opt) 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white border-gray-200 text-gray-400 hover:border-black hover:text-black'}`}
                    >
                        {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-900 mb-4 uppercase">Collaboration Rates</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Gifted Only (Product Exchange)', 'Paid Content Creation'].map(opt => (
                    <label key={opt} className={`p-6 border-2 cursor-pointer text-center transition ${formData.rates === opt ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black'}`}>
                      <input type="radio" name="rates" value={opt} checked={formData.rates === opt} onChange={handleChange} className="hidden" />
                      <span className="text-xs font-bold uppercase tracking-wide">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button onClick={prevStep} className="text-gray-500 font-bold uppercase flex items-center gap-2 hover:text-black transition text-sm"><ChevronLeft size={18} /> Back</button>
                <button onClick={nextStep} className="bg-black text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-3 text-sm">Next Step <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase">03. Skin Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Skin Type</label>
                  <select name="skinType" value={formData.skinType} onChange={handleChange} className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 outline-none text-lg">
                    <option value="">Select Type...</option>
                    {['Oily', 'Dry', 'Combination', 'Sensitive'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Skin Tone</label>
                  <select name="skinTone" value={formData.skinTone} onChange={handleChange} className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 outline-none text-lg">
                    <option value="">Select Tone...</option>
                    {['Fair', 'Light', 'Medium', 'Tan', 'Deep'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-10">
                <label className="block text-sm font-bold text-gray-900 mb-4 uppercase">Main Concerns (Select all that apply)</label>
                <div className="grid grid-cols-2 gap-4">
                  {['Acne', 'Dark Spots', 'Texture', 'Dryness', 'Redness', 'Aging'].map(concern => (
                    <label key={concern} className="flex items-center gap-3 cursor-pointer p-4 border border-gray-100 hover:border-black transition">
                      <input 
                        type="checkbox" 
                        checked={formData.skinConcerns.includes(concern)} 
                        onChange={() => handleCheckbox(concern, 'skinConcerns')} 
                        className="accent-black w-5 h-5 shrink-0" 
                      />
                      <span className="text-sm font-bold uppercase tracking-wide text-gray-700">{concern}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* === ALIGNED CHECKBOX (FIXED) === */}
              <div className="flex items-center gap-4 p-6 border border-gray-200 bg-gray-50 mb-8 cursor-pointer" onClick={() => setFormData({...formData, usageRights: !formData.usageRights})}>
                <div className={`w-6 h-6 border-2 flex items-center justify-center transition-colors shrink-0 ${formData.usageRights ? 'bg-black border-black' : 'border-gray-300 bg-white'}`}>
                   {formData.usageRights && <Check size={16} className="text-white" />}
                </div>
                <input 
                    type="checkbox" 
                    checked={formData.usageRights} 
                    onChange={(e) => setFormData({...formData, usageRights: e.target.checked})} 
                    className="hidden" 
                />
                <span className="text-xs text-gray-600 uppercase tracking-wide font-bold leading-relaxed">
                    I agree that videos created for B.A.R.E Trading may be used for marketing purposes.
                </span>
              </div>

              <div className="flex justify-between pt-8">
                <button onClick={prevStep} className="text-gray-500 font-bold uppercase flex items-center gap-2 hover:text-black transition text-sm"><ChevronLeft size={18} /> Back</button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="bg-black text-white px-12 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-lg text-sm">
                  {isSubmitting ? 'Sending...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* FOOTER */}
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

// === MOVED OUTSIDE ===
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