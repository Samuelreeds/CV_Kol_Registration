import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, Check, ChevronRight, ChevronLeft, ArrowDown, Trash2, X, AlertCircle, ArrowLeft } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { generateBlankPDF } from './pdfGenerator';

export default function WholesaleForm() {
  const [step, setStep] = useState(1);
  const formRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [isCompressing, setIsCompressing] = useState(false);

  // === HELPER: GET TODAY'S DATE (YYYY-MM-DD) ===
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // === CUSTOM ALERT STATE ===
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'error' });

  const showMessage = (title, message, type = 'error') => {
    setModal({ show: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, show: false });
    if (modal.type === 'success') {
      window.location.href = '/'; // Redirect home on success
    }
  };

  const [formData, setFormData] = useState({
    companyName: '',
    regNumber: '',
    yearEstablished: '',
    businessAddress: '',
    storeAddress: '',
    numStores: '',
    exactNumStores: '',
    contactPerson: '',
    position: '',
    phone: '',
    email: '',
    commMethod: [],
    businessType: [],
    salesChannels: [],
    customerSegment: [],
    interestedProducts: [],
    monthlyVolume: '',
    preferredPackage: '',
    paymentMethod: '',
    paymentTerm: '',
    applicantName: '',
    signature: '',
    declarationDate: getTodayString(),
    businessLicense: null,
    storePhotos: null,
    idPassport: null,
    socialLinks: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    setIsCompressing(true);

    try {
      let finalFile = file;
      if (file.type.startsWith('image/')) {
        const compressedBlob = await imageCompression(file, options);
        finalFile = new File([compressedBlob], file.name, {
          type: compressedBlob.type,
          lastModified: Date.now(),
        });
      }
      setFormData(prev => ({ ...prev, [fieldName]: finalFile }));
      if (errors[fieldName]) setErrors(prev => ({ ...prev, [fieldName]: null }));
    } catch (error) {
      console.error("Compression failed:", error);
      setFormData(prev => ({ ...prev, [fieldName]: file }));
    } finally {
      setIsCompressing(false);
    }
  };

  const removeFile = (fieldName) => {
    setFormData(prev => ({ ...prev, [fieldName]: null }));
  };

  const handleCheckbox = (e, field) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const newList = checked 
        ? [...prev[field], value] 
        : prev[field].filter(item => item !== value);
      return { ...prev, [field]: newList };
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handlePaymentMethod = (value) => {
    setFormData(prev => ({ ...prev, paymentMethod: value }));
    if (errors.paymentMethod) setErrors(prev => ({ ...prev, paymentMethod: null }));
  };

  const scrollToFormTop = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // === VALIDATION ===
  const validateStep1 = () => {
    let tempErrors = {};
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.companyName.trim()) tempErrors.companyName = "Required";
    if (!formData.regNumber.trim()) tempErrors.regNumber = "Required";
    if (!formData.yearEstablished) tempErrors.yearEstablished = "Required";
    if (!formData.businessAddress.trim()) tempErrors.businessAddress = "Required";
    
    if (!formData.numStores) tempErrors.numStores = "Required";
    if (formData.numStores === 'More than 3' && !formData.exactNumStores) {
        tempErrors.exactNumStores = "Please specify number";
    }

    if (!formData.contactPerson.trim()) tempErrors.contactPerson = "Required";
    
    // === STRICT PHONE VALIDATION ===
    if (!formData.phone.trim()) {
        tempErrors.phone = "Required";
    } else if (phoneDigits.length < 9 || phoneDigits.length > 10) {
        tempErrors.phone = "Invalid: Must be 9-10 digits";
    }

    if (!formData.email.trim()) {
        tempErrors.email = "Required";
    } else if (!emailRegex.test(formData.email)) {
        tempErrors.email = "Invalid Email";
    }

    if (formData.commMethod.length === 0) tempErrors.commMethod = "Select at least one";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0; 
  };

  const validateStep2 = () => {
    let tempErrors = {};
    if (formData.businessType.length === 0) tempErrors.businessType = "Select at least one";
    if (formData.salesChannels.length === 0) tempErrors.salesChannels = "Select at least one";
    if (formData.customerSegment.length === 0) tempErrors.customerSegment = "Select at least one";
    if (formData.interestedProducts.length === 0) tempErrors.interestedProducts = "Select at least one";
    if (!formData.monthlyVolume.trim()) tempErrors.monthlyVolume = "Required";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
        if (validateStep1()) {
            setStep(2);
            setTimeout(scrollToFormTop, 100);
        } else {
            showMessage("Attention Required", "Please fill in all required fields in Step 1.");
            scrollToFormTop();
        }
    } else if (step === 2) {
        if (validateStep2()) {
            setStep(3);
            setTimeout(scrollToFormTop, 100);
        } else {
            showMessage("Attention Required", "Please complete the Business Profile section.");
            scrollToFormTop();
        }
    }
  };

  const prevStep = () => { setStep(s => s - 1); setTimeout(scrollToFormTop, 100); };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    let tempErrors = {};

    if (!formData.paymentMethod) tempErrors.paymentMethod = "Required";
    if (!formData.paymentTerm) tempErrors.paymentMethod = "Required";
    if (!formData.applicantName.trim()) tempErrors.applicantName = "Required";
    if (!formData.signature.trim()) tempErrors.signature = "Required";
    if (!formData.declarationDate) tempErrors.declarationDate = "Required";
    if (!formData.businessLicense) tempErrors.businessLicense = "Document required";
    if (!formData.storePhotos) tempErrors.storePhotos = "Photos required";
    if (!formData.idPassport) tempErrors.idPassport = "ID required";
    if (!formData.socialLinks) tempErrors.socialLinks = "Links required";

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length > 0) {
      showMessage("Attention Required", "Please upload all documents and sign the form.");
      scrollToFormTop();
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (Array.isArray(formData[key])) {
        data.append(key, JSON.stringify(formData[key]));
      } else {
        data.append(key, formData[key]);
      }
    });

    if (formData.numStores === 'More than 3') {
      data.set('numStores', `More than 3 (${formData.exactNumStores})`);
    }

    try {
      const response = await fetch('https://my-backend-bareregistration.onrender.com/submit', {
        method: 'POST',
        body: data 
      });

      if (response.ok) {
        showMessage("Success", "Application Successfully Submitted!", "success");
      } else {
        showMessage("Submission Failed", "Server error. Please check your connection.");
      }
    } catch (error) {
      showMessage("Network Error", "Unable to connect to server.");
    }
  };

  return (
    <div className="font-sans bg-white text-gray-900 relative">
      
      {/* HEADER WITH BACK BUTTON */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-center items-center shadow-sm transition-all duration-300">
        
        {/* Return to Home Icon */}
        <Link 
          to="/" 
          className="absolute left-6 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-all duration-300"
          title="Return to Selection"
        >
           <ArrowLeft size={24} />
        </Link>

        {/* Logo */}
        <div className="w-30 h-20 flex items-center justify-center">
           <img src="/logo.jpg" alt="BARE Logo" className="h-full object-contain" />
        </div>
      </nav>

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

      {/* HERO */}
      <div className="min-h-screen flex flex-col items-center justify-center relative p-6 pt-32">
        <div className="text-center space-y-6 max-w-3xl">
          <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">Official Application</p>
          <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-widest leading-tight">Wholesale &<br />Retailer</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
              <button 
                  onClick={generateBlankPDF}
                  className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-100 text-gray-400 font-bold uppercase tracking-widest hover:border-black hover:text-black transition"
              >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                  Download Form
              </button>

              <button 
                  onClick={scrollToFormTop} 
                  className="bg-black text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-xl"
              >
                  Start Application
              </button>
          </div>

        </div>
        <div className="absolute bottom-10 animate-bounce cursor-pointer" onClick={scrollToFormTop}>
          <ArrowDown className="text-gray-400 w-6 h-6" />
        </div>
      </div>

      {/* FORM */}
      <div ref={formRef} className="scroll-mt-32 min-h-screen flex flex-col items-center pb-20 px-6">
        <div className="w-full max-w-4xl relative">
          
          {/* Stepper */}
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
            <div className="space-y-12 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase">A. Applicant Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Registered Company Name</label>
                    <input name="companyName" onChange={handleChange} value={formData.companyName} placeholder="e.g. BARE Trading Co., Ltd." type="text" className={`w-full bg-gray-50 border-b-2 p-4 outline-none text-lg ${errors.companyName ? 'border-red-500' : 'border-gray-200'}`} />
                    {errors.companyName && <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.companyName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Business Registration Number</label>
                    <input name="regNumber" onChange={handleChange} value={formData.regNumber} placeholder="e.g. Co.12345/08" type="text" className={`w-full bg-gray-50 border-b-2 p-4 outline-none text-lg ${errors.regNumber ? 'border-red-500' : 'border-gray-200'}`} />
                    {errors.regNumber && <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.regNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Year Established</label>
                    <input name="yearEstablished" onChange={handleChange} value={formData.yearEstablished} placeholder="e.g. 2020" type="text" className={`w-full bg-gray-50 border-b-2 p-4 outline-none text-lg ${errors.yearEstablished ? 'border-red-500' : 'border-gray-200'}`} />
                    {errors.yearEstablished && <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.yearEstablished}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Registered Business Address</label>
                    <input name="businessAddress" onChange={handleChange} value={formData.businessAddress} placeholder="#123, St 456, Phnom Penh..." type="text" className={`w-full bg-gray-50 border-b-2 p-4 outline-none text-lg ${errors.businessAddress ? 'border-red-500' : 'border-gray-200'}`} />
                    {errors.businessAddress && <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.businessAddress}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Physical Store Address</label>
                    <input name="storeAddress" onChange={handleChange} value={formData.storeAddress} placeholder="If different from registered address..." type="text" className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 outline-none text-lg" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-4 uppercase">Number of Physical Stores</label>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-8">
                        {['1', '2-3', 'More than 3'].map(opt => (
                          <label key={opt} className="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="numStores" value={opt} checked={formData.numStores === opt} onChange={handleChange} className="appearance-none w-6 h-6 border-2 border-gray-300 rounded-full checked:border-black checked:bg-black" />
                            <span className="text-gray-600 font-medium">{opt}</span>
                          </label>
                        ))}
                      </div>
                      {errors.numStores && <p className="text-red-500 text-xs font-bold uppercase">{errors.numStores}</p>}
                      {formData.numStores === 'More than 3' && (
                        <div className="mt-2">
                          <input name="exactNumStores" onChange={handleChange} value={formData.exactNumStores} type="number" placeholder="Enter Exact Number" className={`w-48 bg-gray-50 border-b-2 p-2 outline-none ${errors.exactNumStores ? 'border-red-500' : 'border-gray-300'}`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase">B. Contact Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Authorized Contact Person</label>
                    <input name="contactPerson" onChange={handleChange} value={formData.contactPerson} placeholder="Full Name" type="text" className={`w-full bg-gray-50 border-b-2 p-4 outline-none text-lg ${errors.contactPerson ? 'border-red-500' : 'border-gray-200'}`} />
                    {errors.contactPerson && <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.contactPerson}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Position / Title</label>
                    <input name="position" onChange={handleChange} value={formData.position} placeholder="e.g. General Manager" type="text" className="w-full bg-gray-50 border-b-2 border-gray-200 p-4 outline-none text-lg" />
                  </div>
                  
                  {/* === UPDATED PHONE INPUT === */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Phone Number</label>
                    <input 
                      name="phone" 
                      onChange={handleChange} 
                      value={formData.phone} 
                      type="tel" 
                      maxLength={10} // Prevents typing > 10
                      placeholder="e.g. 096 123 4567" 
                      className={`w-full bg-gray-50 border-b-2 p-4 outline-none text-lg ${errors.phone ? 'border-red-500' : 'border-gray-200'}`} 
                    />
                    {errors.phone && <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Email Address</label>
                    <input name="email" onChange={handleChange} value={formData.email} placeholder="name@example.com" type="email" className={`w-full bg-gray-50 border-b-2 p-4 outline-none text-lg ${errors.email ? 'border-red-500' : 'border-gray-200'}`} />
                    {errors.email && <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.email}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-4 uppercase">Communication Method</label>
                    <div className="flex flex-wrap gap-8">
                      {['Phone', 'Email', 'Telegram App'].map(opt => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" value={opt} onChange={(e) => handleCheckbox(e, 'commMethod')} checked={formData.commMethod.includes(opt)} className="appearance-none w-6 h-6 border-2 border-gray-300 rounded checked:bg-black" />
                          <span className="text-gray-600 font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                    {errors.commMethod && <p className="text-red-500 text-xs font-bold mt-2 uppercase">{errors.commMethod}</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-8">
                <button onClick={handleNext} className="bg-black text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-3 text-sm">Next Step <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-12 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase">C. Business Profile</h2>
                <div className="space-y-10">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-4 uppercase">Business Type</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['Cosmetic Retail Store', 'Clinic / Pharmacy', 'Department Store', 'Distributor / Wholesaler', 'Salon / Beauty Service', 'Other'].map(opt => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 hover:border-black transition-colors">
                          <input type="checkbox" value={opt} onChange={(e) => handleCheckbox(e, 'businessType')} checked={formData.businessType.includes(opt)} className="appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:bg-black" />
                          <span className="text-gray-600 font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                    {errors.businessType && <p className="text-red-500 text-xs font-bold mt-2 uppercase">{errors.businessType}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide text-center lg:text-left">Primary Sales Channels</label>
                    <div className="space-y-3">
                      {['Physical Store', 'Social Media', 'E-commerce'].map(opt => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" value={opt} onChange={(e) => handleCheckbox(e, 'salesChannels')} checked={formData.salesChannels.includes(opt)} className="appearance-none w-5 h-5 border-2 border-gray-300 rounded checked:bg-black" />
                          <span className="text-gray-600 font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                    {errors.salesChannels && <p className="text-red-500 text-xs font-bold mt-2 uppercase">{errors.salesChannels}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide text-center lg:text-left">Target Customer Segment</label>
                    <div className="flex flex-wrap gap-6">
                      {['Mass Market', 'Mid-range', 'Premium', 'Professional'].map(opt => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" value={opt} onChange={(e) => handleCheckbox(e, 'customerSegment')} checked={formData.customerSegment.includes(opt)} className="appearance-none w-5 h-5 border-2 border-gray-300 rounded checked:bg-black" />
                          <span className="text-gray-600 font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                    {errors.customerSegment && <p className="text-red-500 text-xs font-bold mt-2 uppercase">{errors.customerSegment}</p>}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase text-center lg:text-left">D. Wholesale Interest</h2>
                <div className="space-y-10">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-4 uppercase">Products Interested In</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Skincare', 'Cosmetics', 'Sunscreen', 'Accessories', 'Other'].map(opt => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" value={opt} onChange={(e) => handleCheckbox(e, 'interestedProducts')} checked={formData.interestedProducts.includes(opt)} className="appearance-none w-5 h-5 border-2 border-gray-300 rounded checked:bg-black" />
                          <span className="text-gray-600 font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                    {errors.interestedProducts && <p className="text-red-500 text-xs font-bold mt-2 uppercase">{errors.interestedProducts}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide text-center lg:text-left">Estimated Monthly Order Volume</label>
                    <input name="monthlyVolume" onChange={handleChange} value={formData.monthlyVolume} type="text" placeholder="e.g. 5000" className={`w-full bg-gray-50 border-b-2 p-4 outline-none text-lg transition-colors ${errors.monthlyVolume ? 'border-red-500' : 'border-gray-200'}`} />
                    {errors.monthlyVolume && <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.monthlyVolume}</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-8">
                <button onClick={prevStep} className="text-gray-500 font-bold uppercase flex items-center gap-2 hover:text-black transition text-sm"><ChevronLeft size={18} /> Back</button>
                <button onClick={handleNext} className="bg-black text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-3 text-sm">Next Step <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-12 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase text-center lg:text-left">E. Payment & Commercial</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* PREFERRED PACKAGE */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-4 uppercase">Preferred Package</label>
                    {['Starter Package', 'Premium Package', 'Custom Discussion'].map(opt => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer mb-3">
                        <input type="radio" name="preferredPackage" value={opt} checked={formData.preferredPackage === opt} onChange={handleChange} className="appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:bg-black" />
                        <span className="text-gray-600 font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>

                  {/* PAYMENT DETAILS */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide text-center lg:text-left">Preferred Payment Method</label>
                    {['Bank Transfer', 'Cash', 'Other'].map(opt => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer mb-3">
                        <input type="checkbox" checked={formData.paymentMethod === opt} onChange={() => handlePaymentMethod(opt)} className="appearance-none w-5 h-5 border-2 border-gray-300 rounded checked:bg-black" />
                        <span className="text-gray-600 font-medium">{opt}</span>
                      </label>
                    ))}
                    {errors.paymentMethod && <p className="text-red-500 text-xs font-bold uppercase">{errors.paymentMethod}</p>}

                    {/* NEW PAYMENT TERM SECTION */}
                    <label className="block text-sm font-bold text-gray-900 mb-4 uppercase mt-6">Requested Payment Term:</label>
                    {['Prepaid', 'Deposit + Balance Before Delivery', 'Other (subject to approval)'].map(opt => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer mb-3">
                        <input 
                            type="radio" 
                            name="paymentTerm" 
                            value={opt} 
                            checked={formData.paymentTerm === opt} 
                            onChange={handleChange} 
                            className="appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:bg-black" 
                        />
                        <span className="text-gray-600 font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION F: DOCUMENTS */}
              <div>
                <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase tracking-wide text-center lg:text-left">
                  F. Required Documents
                </h2>
                <p className="text-sm text-gray-500 mb-6 uppercase tracking-wide text-center lg:text-left">
                  Please upload copies of the following (All fields required):
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { id: 'businessLicense', label: 'Business Registration / License' },
                    { id: 'storePhotos', label: 'Store Photos (Interior & Exterior)' },
                    { id: 'idPassport', label: 'ID / Passport of Signatory' },
                    { id: 'socialLinks', label: 'Social Media or Website Links' }
                  ].map((doc) => (
                    <div key={doc.id} className="flex flex-col">
                      {formData[doc.id] ? (
                        <div className="border-2 border-green-500 bg-green-50 p-8 flex flex-col items-center justify-center text-center rounded-lg relative min-h-[180px]">
                           <button 
                             onClick={() => removeFile(doc.id)}
                             className="absolute top-3 right-3 p-2 bg-white rounded-full text-red-500 shadow-sm hover:bg-red-50 transition"
                             title="Remove and Re-upload"
                           >
                             <Trash2 size={18} />
                           </button>
                           <Check className="text-green-500 mb-3" size={32} />
                           <span className="text-sm font-bold uppercase tracking-wide">{doc.label}</span>
                           <span className="text-[10px] text-green-700 mt-2 font-bold truncate max-w-full px-2 bg-white/50 py-1 rounded">
                             {formData[doc.id].name}
                           </span>
                           <span className="text-[9px] text-gray-400 mt-1">
                              {(formData[doc.id].size / 1024 / 1024).toFixed(2)} MB
                           </span>
                        </div>
                      ) : (
                        <label className={`border-2 border-dashed p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[180px]
                          ${errors[doc.id] ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-black hover:bg-gray-50'}`}>
                          
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(e, doc.id)}
                          />
                          
                          <UploadCloud className={`${errors[doc.id] ? 'text-red-400' : 'text-gray-400'} mb-3`} size={32} />
                          <span className="text-sm font-bold uppercase tracking-wide">{doc.label}</span>
                          <span className="text-[10px] text-gray-400 mt-2">Click to Upload (Max 5MB)</span>
                        </label>
                      )}
                      
                      {errors[doc.id] && (
                        <p className="text-red-500 text-[10px] font-bold uppercase mt-1 text-center">
                          {errors[doc.id]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION G: DECLARATION */}
              <div>
                <h2 className="text-2xl font-bold border-b-2 border-black pb-4 mb-8 uppercase tracking-wide text-center lg:text-left">G. Declaration</h2>
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Applicant Name</label>
                    <input name="applicantName" onChange={handleChange} value={formData.applicantName} placeholder="Full Legal Name" type="text" className={`w-full bg-gray-50 border-b-2 p-4 outline-none text-lg ${errors.applicantName ? 'border-red-500' : 'border-gray-200'}`} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Signature</label>
                      <input name="signature" onChange={handleChange} value={formData.signature} type="text" placeholder="(Type full name to sign)" className={`w-full bg-gray-50 border-b-2 p-4 outline-none text-lg font-serif italic ${errors.signature ? 'border-red-500' : 'border-gray-200'}`} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Date</label>
                      <input name="declarationDate" onChange={handleChange} value={formData.declarationDate} type="date" className={`w-full bg-gray-50 border-b-2 p-4 outline-none text-lg ${errors.declarationDate ? 'border-red-500' : 'border-gray-200'}`} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-12">
                <button onClick={prevStep} className="text-gray-500 font-bold uppercase flex items-center gap-2 hover:text-black transition text-sm"><ChevronLeft size={18} /> Back</button>
                <button onClick={handleSubmit} className="bg-black text-white px-12 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-lg text-sm">
                   {isCompressing ? 'Processing Files...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-black pt-20 md:pt-32 pb-16 px-6 md:px-12 border-t border-neutral-800 font-sans text-white">
        <div className="max-w-[1400px] mx-auto">
          {/* Footer content unchanged */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
            <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="w-20 md:w-24 aspect-square mb-8 rounded-full overflow-hidden border border-neutral-800 transition-all duration-500 ease-in-out hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
                 <img src="/logo.jpg" alt="BARE Logo" className="w-full h-full object-cover" />
              </div>
              <p className="text-neutral-400 text-sm mb-10 max-w-sm leading-loose font-sans tracking-wide">Inspiring confidence, creativity, and community through authentic beauty products.</p>
              <h4 className="font-bold uppercase tracking-[0.2em] text-xs mb-6 font-sans text-neutral-300">Ready to Partner?</h4>
              <div className="flex flex-col gap-4 w-full md:w-auto">
                <a href="https://t.me/jyongwang" target="_blank" rel="noopener noreferrer" className="bg-white text-black px-10 py-4 uppercase text-xs font-bold tracking-[0.2em] hover:bg-neutral-200 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] w-full md:w-auto inline-block text-center font-sans mb-2">Start Partnership</a>
                <a href="https://www.instagram.com/_bare.official_?igsh=MTFhYnpzcW8xcjBvZA==" target="_blank" rel="noopener noreferrer" className="bg-black text-white border-2 border-white px-10 py-4 uppercase text-xs font-bold tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300 w-full md:w-auto inline-block text-center font-sans">Instagram</a>
                <a href="https://www.facebook.com/bareofficialpage" target="_blank" rel="noopener noreferrer" className="bg-black text-white border-2 border-white px-10 py-4 uppercase text-xs font-bold tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300 w-full md:w-auto inline-block text-center font-sans">Facebook</a>
              </div>
            </div>
            <div className="lg:col-span-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-10 border-b border-neutral-800 pb-4 inline-block font-sans text-neutral-300">Contact Us</h3>
              <ul className="space-y-8 text-sm text-neutral-400 font-sans tracking-wide">
                <li className="flex gap-5 items-start">
                  <span className="leading-relaxed">B.A.R.E Trading Co., Ltd.<br/>Phnom Penh, Cambodia</span>
                </li>
                <li className="flex gap-5 items-start">
                  <div className="flex flex-col gap-2"><a href="tel:+855968166665" className="hover:text-white transition-colors">+855 96 816 6665</a><a href="tel:+855966665133" className="hover:text-white transition-colors">+855 96 666 5133</a></div>
                </li>
                <li className="flex gap-5 items-center">
                  <a href="mailto:Barecambodia@gmail.com" className="hover:text-white transition-colors decoration-1 hover:underline underline-offset-4">Barecambodia@gmail.com</a>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-10 border-b border-neutral-800 pb-4 inline-block font-sans text-neutral-300">Company</h3>
              <ul className="space-y-6 text-sm text-neutral-400 font-medium font-sans tracking-wide">
                <li><a href="#" className="hover:text-white hover:pl-2 transition-all duration-300">About BARE</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold text-center md:text-left font-sans mt-20 md:mt-32">
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