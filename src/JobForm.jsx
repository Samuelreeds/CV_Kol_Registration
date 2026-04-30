import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, UploadCloud, FileText, ArrowDown, Check, AlertCircle } from 'lucide-react';
import { supabase } from './supabaseClient'; 

export default function JobForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeName, setResumeName] = useState(''); 
  const [positions, setPositions] = useState([]);
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
    fullName: '', email: '', phone: '', linkedinUrl: '',
    position: '', salary: '', startDate: '', coverLetter: '', resume: null 
  });

  // === FETCH POSITIONS FROM SUPABASE ===
  useEffect(() => {
    async function fetchPositions() {
      try {
        const { data, error } = await supabase
          .from('Position') 
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setPositions(data || []);
      } catch (err) {
        console.error("Error fetching positions:", err);
      }
    }
    fetchPositions();
  }, []);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, resume: file }));
      setResumeName(file.name);
    }
  };

  // === VALIDATION LOGIC ===
  const validateStep1 = () => {
    if (!formData.fullName.trim()) { showMessage("Missing Name", "Please enter your full name."); return false; }
    
    // Phone Validation (9-10 digits)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 10) { 
        showMessage("Invalid Phone", "Phone number must be 9-10 digits."); 
        return false; 
    }

    // Email Validation
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
    setStep(s => s + 1);
    scrollTop();
  };

  const prevStep = () => { setStep(s => s - 1); scrollTop(); };

  // === SUBMIT DATA TO SUPABASE ===
  const handleSubmit = async () => {
    if (!formData.position) return showMessage("Position Required", "Please select the position you are applying for.");
    if (!formData.salary) return showMessage("Salary Required", "Please enter your expected salary.");
    if (!formData.startDate) return showMessage("Start Date Required", "Please select when you can start.");
    if (!formData.resume) return showMessage("Resume Required", "Please upload your Resume/CV (PDF) to proceed.");
    
    setIsSubmitting(true);

    try {
      // 1. Upload Resume to Supabase Storage
      const fileExt = formData.resume.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('Bucket') 
        .upload(fileName, formData.resume);

      if (uploadError) throw uploadError;

      // 2. Get Public URL of the uploaded resume
      const { data: { publicUrl } } = supabase.storage
        .from('Bucket') 
        .getPublicUrl(fileName);

      // 3. Insert Application Data into the database
      const { error: dbError } = await supabase
        .from('JobApplicant') // <--- FIXED: Now matches your actual table name exactly
        .insert([{
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          linkedin_url: formData.linkedinUrl,
          position_applied: formData.position,
          expected_salary: formData.salary,
          start_date: formData.startDate,
          cover_letter: formData.coverLetter,
          resume_url: publicUrl 
        }]);

      if (dbError) throw dbError;

      showMessage("Application Submitted!", "Good luck! We will review your application soon.", "success");
    } catch (error) { 
      console.error("Submission Error:", error); 
      showMessage("Submission Failed", "Unable to connect to server or upload file. Please try again."); 
    } 
    finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="font-sans bg-white text-gray-900 relative">
      
      {/* === CUSTOM MODAL === */}
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

      {/* HEADER */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-center shadow-sm">
        <div className="w-30 h-20 flex items-center justify-center">
           <img src="/logo.jpg" alt="BARE Logo" className="h-full object-contain" />
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="min-h-screen flex flex-col items-center justify-center relative p-6 pt-32">
        <div className="text-center space-y-6 max-w-3xl">
          <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">Careers at BARE</p>
          <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-widest leading-tight">Join The<br />Team</h1>
          <button onClick={scrollToForm} className="bg-black text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-xl mt-8">
             Apply Now
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
            {[1, 2].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all border-2 ${step === num ? 'bg-black text-white border-black scale-110' : step > num ? 'bg-black text-white border-black' : 'bg-white text-gray-300 border-gray-200'}`}>
                  {step > num ? <Check size={24} /> : num}
                </div>
                {num !== 2 && <div className={`w-24 h-0.5 mx-4 ${step > num ? 'bg-black' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase">01. Who are you?</h2>
              
              <InputField 
                label="Full Name" 
                name="fullName" 
                value={formData.fullName} 
                onChange={handleChange} 
                placeholder="e.g. Sok Dara" 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField 
                  label="Phone Number" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="e.g. 096 123 4567" 
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
              
              <InputField 
                label="LinkedIn Profile" 
                name="linkedinUrl" 
                value={formData.linkedinUrl} 
                onChange={handleChange} 
                placeholder="e.g. linkedin.com/in/yourname (Optional)" 
              />
              
              <div className="flex justify-end pt-8">
                <button onClick={nextStep} className="bg-black text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-3 text-sm">Next Step <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase">02. The Position</h2>
              
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Position Applied For</label>
                <select name="position" value={formData.position} onChange={handleChange} className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 outline-none text-lg">
                  <option value="">Select Role...</option>
                  {positions.map(role => <option key={role.id} value={role.title}>{role.title}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField 
                  label="Expected Salary ($)" 
                  name="salary" 
                  value={formData.salary} 
                  onChange={handleChange} 
                  placeholder="e.g. 500" 
                />
                <InputField 
                  label="Available Start Date" 
                  name="startDate" 
                  value={formData.startDate} 
                  onChange={handleChange} 
                  type="date" 
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Upload CV / Resume (PDF)</label>
                <div className="relative w-full h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-black transition flex flex-col items-center justify-center cursor-pointer bg-gray-50">
                  <input type="file" onChange={handleFileChange} accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="text-center pointer-events-none">
                    {resumeName ? <div className="flex items-center gap-2 text-black font-bold"><FileText size={24} /> {resumeName}</div> : <><UploadCloud size={32} className="mx-auto text-gray-400 mb-2" /><span className="text-xs font-bold uppercase text-gray-400">Click to Upload (Max 5MB)</span></>}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Cover Letter</label>
                <textarea 
                  name="coverLetter" 
                  value={formData.coverLetter} 
                  onChange={handleChange} 
                  placeholder="Briefly tell us why you want to join B.A.R.E..." 
                  className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 outline-none text-lg h-32 resize-none transition-colors" 
                />
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
                <a href="#" className="bg-white text-black px-10 py-4 uppercase text-xs font-bold tracking-[0.2em] hover:bg-neutral-200 transition w-full md:w-auto text-center">Start Partnership</a>
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
          </div>
        </div>
      </footer>
    </div>
  );
}

// === MOVED OUTSIDE ===
const InputField = ({ label, name, value, onChange, type = "text", placeholder }) => (
  <div className="mb-8">
    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">{label}</label>
    <input 
      type={type} 
      name={name} 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 outline-none text-lg focus:border-black transition-colors" 
    />
  </div>
);