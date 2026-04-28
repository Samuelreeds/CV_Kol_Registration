import React, { useState, useEffect } from 'react';
import { Search, LogOut, Eye, Trash2, X, Filter, Calendar as CalendarIcon, AlertCircle, CheckCircle, HelpCircle, Instagram, Video, ExternalLink, Briefcase, FileText, Plus, Edit2, Check } from 'lucide-react';
import * as XLSX from 'xlsx'; 
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// === 🔴 IMPORTANT: CHANGE THIS WHEN DEPLOYING ===
const API_URL = 'http://localhost:3001/api';

export default function AdminDashboard() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [dataList, setDataList] = useState([]); 
  const [password, setPassword] = useState('');
  
  const getToday = () => new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState('creators'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(getToday()); 
  const [filterStatus, setFilterStatus] = useState('Pending'); 

  const [selectedItem, setSelectedItem] = useState(null); 
  
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [rolesList, setRolesList] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [editingRoleId, setEditingRoleId] = useState(null); 
  const [editRoleText, setEditRoleText] = useState('');     

  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const showAlert = (title, message, type = 'error') => setAlertModal({ show: true, title, message, type });
  const closeAlert = () => setAlertModal({ ...alertModal, show: false });
  const requestConfirm = (title, message, action) => setConfirmModal({ show: true, title, message, onConfirm: action });
  const closeConfirm = () => setConfirmModal({ ...confirmModal, show: false });

  const formatText = (text) => {
    if (!text) return 'N/A';
    try {
        if (typeof text !== 'string') return text;
        if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
            const parsed = JSON.parse(text);
            return Array.isArray(parsed) ? parsed.join(', ') : text;
        }
    } catch (e) { return text; }
    return text;
  };

  // === LOGIN ===
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('adminToken', data.token);
        setToken(data.token);
      } else {
        showAlert("Access Denied", "Incorrect Password", "error");
      }
    } catch (err) { showAlert("Error", "Server connection failed", "error"); }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
  };

  // === FETCH DATA ===
  const fetchData = async () => {
    let endpoint = activeTab === 'creators' ? '/influencers' : '/jobs';

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        const data = await res.json();
        setDataList(data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, activeTab]);

  // === ROLE FUNCTIONS ===
  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/positions`);
      if (res.ok) { const data = await res.json(); setRolesList(data); }
    } catch (err) { console.error(err); }
  };

  const handleAddRole = async () => {
    if (!newRole) return;
    try {
      const res = await fetch(`${API_URL}/positions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token 
        },
        body: JSON.stringify({ title: newRole })
      });
      if (res.ok) { setNewRole(''); fetchRoles(); }
    } catch (err) { console.error(err); }
  };

  const handleDeleteRole = async (id) => {
    if(!window.confirm("Remove this position option?")) return;
    try {
      const res = await fetch(`${API_URL}/positions/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) fetchRoles();
    } catch (err) { console.error(err); }
  };

  const startEditRole = (role) => { setEditingRoleId(role.id); setEditRoleText(role.title); };
  
  const saveEditRole = async (id) => {
    if (!editRoleText.trim()) return;
    try {
      const res = await fetch(`${API_URL}/positions/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token 
        },
        body: JSON.stringify({ title: editRoleText })
      });
      if (res.ok) { setEditingRoleId(null); fetchRoles(); }
    } catch (err) { console.error(err); }
  };

  // === EXPORT ===
  const handleExport = () => {
    if (!filterDate) { showAlert("Date Required", "Please select a date.", "error"); return; }
    const dailyData = dataList.filter(item => {
      const itemDate = new Date(item.created_at).toISOString().split('T')[0];
      return itemDate === filterDate;
    });

    if (dailyData.length === 0) { showAlert("No Data", "No records found.", "error"); return; }

    const ws = XLSX.utils.json_to_sheet(dailyData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${activeTab.toUpperCase()}_Report_${filterDate}.xlsx`);
  };

  // === ACTIONS ===
  const updateStatus = (id, status) => {
    requestConfirm(`Mark as ${status}?`, `Update status to ${status}?`, async () => {
      let endpoint = activeTab === 'creators' ? `/influencers/${id}/status` : `/jobs/${id}/status`;

      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': token },
          body: JSON.stringify({ status })
        });
        if (res.ok) {
          fetchData();
          setSelectedItem(prev => prev ? ({ ...prev, status }) : null);
          showAlert("Success", "Status Updated", "success");
        }
      } catch (err) { showAlert("Failed", "Update failed", "error"); }
    });
  };

  const deleteItem = (id) => {
    requestConfirm("Delete Record?", "This cannot be undone.", async () => {
      let endpoint = activeTab === 'creators' ? `/influencers/${id}` : `/jobs/${id}`;

      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: 'DELETE',
          headers: { 'Authorization': token }
        });
        if (res.ok) {
          fetchData();
          setSelectedItem(null);
          showAlert("Deleted", "Record removed", "success");
        }
      } catch (err) { showAlert("Failed", "Delete failed", "error"); }
    });
  };

  const filteredList = dataList.filter(item => {
    let name = item.full_name; 

    const matchesSearch = (
      (name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.phone || '').includes(searchTerm)
    );
    const matchesStatus = filterStatus ? item.status === filterStatus : true;
    let matchesDate = true;
    if (filterDate) {
       const itemDate = new Date(item.created_at).toISOString().split('T')[0];
       matchesDate = itemDate === filterDate;
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (!token) return <LoginScreen password={password} setPassword={setPassword} handleLogin={handleLogin} alertModal={alertModal} closeAlert={closeAlert} />;

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 md:p-8 font-sans text-gray-900">
      
      <style>{`
        .react-datepicker-wrapper { width: auto; }
        .react-datepicker__input-container input { outline: none; cursor: pointer; }
      `}</style>

      {alertModal.show && <AlertModal data={alertModal} close={closeAlert} />}
      {confirmModal.show && <ConfirmModal data={confirmModal} close={closeConfirm} />}

      {/* HEADER */}
      <header className="bg-white rounded-2xl shadow-sm px-6 py-5 md:py-6 flex justify-between items-center mb-8">
         <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-black flex items-center justify-center rounded text-white font-bold text-sm">B</div>
            <h1 className="font-bold tracking-[0.2em] text-xs md:text-sm">DASHBOARD</h1>
         </div>
         <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-400 hover:text-black transition uppercase tracking-widest">
            <span className="hidden md:inline">LOGOUT</span> <LogOut size={16} />
         </button>
      </header>

      {/* CONTROLS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
         <div className="flex gap-2 bg-white/50 p-1 rounded-full w-full xl:w-auto overflow-x-auto shrink-0">
            {['creators', 'jobs'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} 
                className={`px-6 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap 
                ${activeTab === tab ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black'}`}>
                {tab === 'creators' ? 'Influencers' : 'Careers'}
              </button>
            ))}
         </div>

         <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
             {activeTab === 'jobs' && (
               <button onClick={() => { setShowRolesModal(true); fetchRoles(); }} className="px-6 py-3 rounded-full bg-white text-gray-600 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition shadow-sm flex items-center gap-2 whitespace-nowrap">
                  <Briefcase size={14} /> Roles
               </button>
             )}

            <div className="relative">
               <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
               <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full sm:w-40 pl-10 pr-4 py-3 rounded-full bg-white border-none shadow-sm text-xs font-bold uppercase tracking-wider text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-100 appearance-none cursor-pointer">
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
               </select>
            </div>
            
            <div className="relative flex items-center bg-white rounded-full shadow-sm pr-1">
               <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-gray-400" size={14} />
               <DatePicker 
                  selected={filterDate ? new Date(filterDate) : null}
                  onChange={(date) => setFilterDate(date ? date.toISOString().split('T')[0] : '')}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select Date"
                  className="pl-10 pr-4 py-3 rounded-full bg-transparent border-none text-xs font-bold text-gray-600 uppercase tracking-wider w-32 sm:w-auto focus:ring-0 leading-none"
               />
               <button onClick={handleExport} className="mr-1 px-6 py-2 rounded-full bg-green-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition shadow-sm whitespace-nowrap">
                  Export
               </button>
            </div>

            <div className="relative flex-1">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
               <input className="w-full sm:w-64 pl-12 pr-6 py-3 rounded-full bg-white border-none shadow-sm text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100 transition" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
         </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-50">
         <div className="overflow-x-auto"> 
            <table className="w-full min-w-[900px]">
               <thead className="bg-white border-b border-gray-100">
                  <tr className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                     <th className="px-8 py-6">Identity</th>
                     <th className="px-8 py-6">
                        {activeTab === 'jobs' ? 'Position' : 'Handle'}
                     </th>
                     <th className="px-8 py-6">Contact</th>
                     <th className="px-8 py-6">Status</th>
                     <th className="px-8 py-6 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {filteredList.map((item) => {
                    let name = item.full_name;
                    let subDetail = `ID: #${item.id}`;
                    let col2 = activeTab === 'jobs' ? item.position_applied : (item.instagram_link || item.tiktok_link);
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 font-bold flex items-center justify-center text-xs">
                                {name ? name.charAt(0).toUpperCase() : '?'}
                             </div>
                             <div>
                                <p className="font-bold text-sm text-gray-900">{name}</p>
                                <p className="text-[10px] text-gray-400 font-medium tracking-wide">{subDetail}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wide max-w-xs truncate">{col2 || '-'}</td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col gap-1">
                              <p className="text-sm font-medium text-gray-600">{item.email}</p>
                              <p className="text-xs text-gray-400 font-mono">{item.phone}</p>
                           </div>
                        </td>
                        <td className="px-8 py-5"><StatusBadge status={item.status} /></td>
                        <td className="px-8 py-5 text-right">
                           <button onClick={() => setSelectedItem(item)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition ml-auto"><Eye size={14} /></button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredList.length === 0 && (
                    <tr><td colSpan="5" className="px-8 py-12 text-center text-gray-400 text-sm">
                      No records found for {filterDate}.<br/>
                      <button onClick={() => { setFilterDate(''); setFilterStatus(''); }} className="mt-2 text-black underline font-bold hover:text-gray-600">Clear Filters</button>
                    </td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 flex-shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-black text-white font-bold flex items-center justify-center text-xl">
                       {selectedItem.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                       <h2 className="text-xl md:text-2xl font-bold text-gray-900 line-clamp-1">
                         {selectedItem.full_name}
                       </h2>
                       <p className="text-sm text-gray-500 font-medium">{activeTab.toUpperCase()} Application #{selectedItem.id}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-black"><X size={24} /></button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <DetailItem label="Phone" value={selectedItem.phone} />
                    <DetailItem label="Email" value={selectedItem.email} />

                    {activeTab === 'creators' && (
                      <>
                        <DetailItem label="UGC Experience" value={selectedItem.ugc_experience} />
                        <SocialLinks item={selectedItem} />
                      </>
                    )}

                    {activeTab === 'jobs' && (
                      <>
                        <DetailItem label="Position" value={selectedItem.position_applied} />
                        <DetailItem label="Expected Salary" value={'$' + selectedItem.expected_salary} />
                        <DetailItem label="Start Date" value={new Date(selectedItem.start_date).toLocaleDateString()} />
                        <DetailItem label="LinkedIn" value={selectedItem.linkedin_url || 'N/A'} />
                        <DetailItem label="Cover Letter" value={selectedItem.cover_letter} full />
                        <div className="md:col-span-2 pt-4 border-t border-gray-50">
                           <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Resume</h4>
                           <DocPreview label="View Resume (PDF)" url={selectedItem.resume_url} large />
                        </div>
                      </>
                    )}
                 </div>
              </div>

              <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
                 <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => deleteItem(selectedItem.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 hover:border-red-200 transition">
                       <Trash2 size={16} />
                    </button>
                 </div>
                 <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => updateStatus(selectedItem.id, 'Rejected')} className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gray-200 text-gray-600 text-xs font-bold uppercase tracking-widest hover:bg-gray-300 transition">Reject</button>
                    <button onClick={() => updateStatus(selectedItem.id, 'Approved')} className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition shadow-lg">Approve</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ROLES MODAL */}
      {showRolesModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white max-w-sm w-full shadow-2xl border-2 border-black flex flex-col p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold uppercase tracking-widest">Manage Roles</h3>
                <button onClick={() => { setShowRolesModal(false); setEditingRoleId(null); }}><X size={20}/></button>
              </div>
              <div className="flex gap-2 mb-6">
                 <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="New Position Title" className="flex-1 bg-gray-50 p-3 rounded-lg text-sm outline-none border border-gray-200 focus:border-black" />
                 <button onClick={handleAddRole} className="p-3 bg-black text-white rounded-lg"><Plus size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto max-h-64 space-y-2">
                 {rolesList.map(role => (
                    <div key={role.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group">
                       {editingRoleId === role.id ? (
                          <div className="flex items-center gap-2 flex-1">
                             <input value={editRoleText} onChange={(e) => setEditRoleText(e.target.value)} className="flex-1 bg-white border border-black p-1 rounded text-sm outline-none" autoFocus />
                             <button onClick={() => saveEditRole(role.id)} className="text-green-600 hover:text-green-800"><Check size={16}/></button>
                             <button onClick={() => setEditingRoleId(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                          </div>
                       ) : (
                          <>
                             <span className="text-sm font-bold text-gray-700">{role.title}</span>
                             <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEditRole(role)} className="text-gray-400 hover:text-black transition"><Edit2 size={14}/></button>
                                <button onClick={() => handleDeleteRole(role.id)} className="text-red-300 hover:text-red-500 transition"><Trash2 size={14}/></button>
                             </div>
                          </>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

// === COMPONENT LIBRARY ===
const LoginScreen = ({ password, setPassword, handleLogin, alertModal, closeAlert }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] p-4 font-sans">
    {alertModal.show && <AlertModal data={alertModal} close={closeAlert} />}
    <form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-sm text-center">
      <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-lg mx-auto mb-6 font-bold text-xl">B</div>
      <h2 className="text-xl font-bold mb-8 tracking-widest uppercase">Admin Access</h2>
      <input type="password" placeholder="Passcode" className="w-full p-4 bg-gray-50 rounded-xl mb-4 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-black transition" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit" className="w-full bg-black text-white p-4 rounded-xl font-bold uppercase tracking-widest hover:bg-neutral-800 transition">Enter</button>
    </form>
  </div>
);
const DetailItem = ({ label, value, full }) => ( <div className={`w-full ${full ? 'md:col-span-2' : ''}`}> <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</h4> <div className="font-medium text-gray-900 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 break-words leading-relaxed whitespace-pre-wrap">{value || 'N/A'}</div> </div> );
const SocialLinks = ({ item }) => ( <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-50"> <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Social Profiles</h4> <div className="grid grid-cols-2 gap-4"> {item.tiktok_link && <SocialButton label="TikTok" url={item.tiktok_link} icon={<Video size={18}/>} />} {item.instagram_link && <SocialButton label="Instagram" url={item.instagram_link} icon={<Instagram size={18}/>} />} </div> </div> );
const StatusBadge = ({ status }) => ( <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status === 'Approved' ? 'bg-green-100 text-green-600' : status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}> {status || 'PENDING'} </span> );

// === FIX FOR CLOUDINARY URLS ===
const DocPreview = ({ label, url, large }) => { 
  if (!url) return null; 
  // If it's a Cloudinary URL, use it directly. If it's old local data, prepend local server.
  const fullUrl = url.startsWith('http') ? url : `http://localhost:3001/${url.replace(/\\/g, '/')}`; 
  
  return ( 
    <a href={fullUrl} target="_blank" rel="noopener noreferrer" className={`block group ${large ? 'w-full h-24 flex items-center justify-center bg-gray-100 rounded-xl border border-dashed border-gray-300 hover:border-black transition' : ''}`}> 
      {large ? ( 
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-black"><FileText size={20}/> {label}</span> 
      ) : ( 
        <> 
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200"> 
            <img src={fullUrl} alt={label} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" onError={(e) => { e.target.style.display='none'; e.target.parentElement.classList.add('flex','items-center','justify-center'); e.target.parentElement.innerHTML='<span class="text-xs font-bold text-gray-400">PDF</span>'; }} /> 
          </div> 
          <p className="text-[10px] text-center mt-2 font-bold text-gray-400 group-hover:text-black uppercase tracking-wide">{label}</p> 
        </> 
      )} 
    </a> 
  ); 
};

const SocialButton = ({ label, url, icon }) => ( <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-black hover:bg-gray-50 transition text-xs font-bold uppercase tracking-widest text-gray-700"> {icon} {label} <ExternalLink size={12} className="opacity-50"/> </a> );
const AlertModal = ({ data, close }) => ( <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in"> <div className="bg-white max-w-sm w-full shadow-2xl border-2 border-black flex flex-col items-center text-center p-8"> <div className={`mb-6 p-4 rounded-full ${data.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}> {data.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />} </div> <h3 className="text-xl font-bold uppercase tracking-widest mb-3">{data.title}</h3> <p className="text-sm text-gray-500 font-medium mb-8 px-2">{data.message}</p> <button onClick={close} className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-neutral-800 transition text-xs">Okay</button> </div> </div> );
const ConfirmModal = ({ data, close }) => ( <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in"> <div className="bg-white max-w-sm w-full shadow-2xl border-2 border-black flex flex-col items-center text-center p-8"> <div className="mb-6 p-4 rounded-full bg-yellow-100 text-yellow-600"><HelpCircle size={32} /></div> <h3 className="text-xl font-bold uppercase tracking-widest mb-3">{data.title}</h3> <p className="text-sm text-gray-500 font-medium mb-8 px-2">{data.message}</p> <div className="flex w-full gap-3"> <button onClick={close} className="flex-1 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition text-xs border border-gray-200">Cancel</button> <button onClick={() => { data.onConfirm(); close(); }} className="flex-1 bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-neutral-800 transition text-xs">Confirm</button> </div> </div> </div> );