import React, { useState, useEffect } from 'react';
import { 
  getDatabase, 
  addTeamMember, 
  editTeamMember, 
  deleteTeamMember 
} from '../utils/mockDatabase';
import { 
  UserPlus, 
  Edit2, 
  Trash2, 
  User, 
  Briefcase, 
  Mail, 
  Phone, 
  Shield, 
  X,
  CheckCircle,
  Plus
} from 'lucide-react';

export default function TeamManagement() {
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [toast, setToast] = useState('');

  // Form modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form values
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [empId, setEmpId] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [phone, setPhone] = useState('');
  const [assignedProjects, setAssignedProjects] = useState([]);

  const loadData = () => {
    const db = getDatabase();
    if (db) {
      setMembers(db.users.filter(u => u.role !== 'admin'));
      setProjects(db.projects);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('database_updated', handleUpdate);
    return () => window.removeEventListener('database_updated', handleUpdate);
  }, []);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !empId) return;

    const payload = {
      id: empId,
      name,
      email,
      department,
      phone,
      assignedProjects: assignedProjects.length > 0 ? assignedProjects : ['Nexora ERP']
    };

    const res = addTeamMember(payload);
    if (res.success) {
      triggerToast(`Account created for ${name}!`);
      setShowAddModal(false);
      resetForm();
      window.dispatchEvent(new Event('database_updated'));
    } else {
      alert(res.error);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    const payload = {
      name,
      email,
      department,
      phone,
      assignedProjects: assignedProjects.length > 0 ? assignedProjects : ['Nexora ERP']
    };

    const res = editTeamMember(selectedMember.id, payload);
    if (res.success) {
      triggerToast(`Account details updated!`);
      setShowEditModal(false);
      resetForm();
      window.dispatchEvent(new Event('database_updated'));
    } else {
      alert(res.error);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove team member ${name}? This action cannot be undone.`)) {
      const res = deleteTeamMember(id);
      if (res.success) {
        triggerToast(`Removed ${name} from registry.`);
        window.dispatchEvent(new Event('database_updated'));
      } else {
        alert(res.error);
      }
    }
  };

  const triggerOpenEdit = (member) => {
    setSelectedMember(member);
    setName(member.name);
    setEmail(member.email);
    setEmpId(member.id);
    setDepartment(member.department);
    setPhone(member.phone || '');
    setAssignedProjects(member.assignedProjects || []);
    setShowEditModal(true);
  };

  const toggleProjectSelect = (projectName) => {
    setAssignedProjects(prev => 
      prev.includes(projectName)
        ? prev.filter(p => p !== projectName)
        : [...prev, projectName]
    );
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setEmpId('');
    setDepartment('Engineering');
    setPhone('');
    setAssignedProjects([]);
    setSelectedMember(null);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Toast popup */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-nexora-purple shadow-glow-purple text-xs text-slate-200 animate-slide-in flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-nexora-purple animate-ping" />
          {toast}
        </div>
      )}

      {/* Header bar */}
      <div className="flex justify-between items-center bg-slate-950/20 p-5 rounded-2xl glass-panel border border-slate-800/40">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Team Member Management Registry</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Create, edit and manage project allocations for your crew</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-nexora-purple to-nexora-blue text-white shadow-glow-purple hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {/* Team registry list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {members.map(member => (
          <div 
            key={member.id}
            className="glass-panel p-5 rounded-2xl shadow-glass flex flex-col justify-between border border-slate-800/50 hover:border-slate-700/60 transition-all duration-300 relative group"
          >
            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex gap-1">
              <button
                onClick={() => triggerOpenEdit(member)}
                title="Edit Details"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(member.id, member.name)}
                title="Remove Member"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Profile strip */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={member.avatar} 
                  alt={member.name} 
                  className="h-11 w-11 rounded-full object-cover border border-slate-800 bg-slate-900"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{member.name}</h4>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{member.id} • {member.department}</span>
                </div>
              </div>

              {/* Attributes stack */}
              <div className="space-y-2 border-t border-slate-850 pt-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>{member.phone || '+1 (555) 000-0000'}</span>
                </div>
              </div>

              {/* Projects chips list */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Project Allocation</span>
                <div className="flex flex-wrap gap-1">
                  {member.assignedProjects.map((p, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-bold border border-indigo-500/10"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* ADD MEMBER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl glass-panel p-6 shadow-glass border border-slate-800 bg-slate-950 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <UserPlus className="h-4.5 w-4.5 text-nexora-purple" />
                Add New Team Member
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Employee ID *</label>
                <input
                  type="text"
                  required
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  placeholder="e.g. EMP-105"
                  className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none bg-[#0c1125] cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="QA">Quality Assurance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. jane@nexora.com"
                    className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-3382"
                    className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                  />
                </div>
              </div>

              {/* Project assignments checklist */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Project Allocations</label>
                <div className="grid grid-cols-2 gap-2 p-3.5 bg-slate-950/40 rounded-xl border border-slate-800">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProjectSelect(p.name)}
                      className={`py-1.5 px-2 rounded-lg border text-[10px] text-center font-bold transition-all cursor-pointer ${
                        assignedProjects.includes(p.name)
                          ? 'bg-nexora-purple/10 text-nexora-purple border-nexora-purple/20'
                          : 'bg-transparent text-slate-400 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-semibold bg-gradient-to-r from-nexora-purple to-nexora-blue text-white shadow-glow-purple hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex justify-center items-center gap-1"
              >
                Create Team Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowEditModal(false); resetForm(); }} />
          <div className="relative w-full max-w-md rounded-2xl glass-panel p-6 shadow-glass border border-slate-800 bg-slate-950 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Edit2 className="h-4 w-4 text-nexora-blue" />
                Edit Team Member details
              </h3>
              <button onClick={() => { setShowEditModal(false); resetForm(); }} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none bg-[#0c1125]"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="QA">Quality Assurance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input focus:outline-none"
                  />
                </div>
              </div>

              {/* Project assignments checklist */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Project Allocations</label>
                <div className="grid grid-cols-2 gap-2 p-3.5 bg-slate-950/40 rounded-xl border border-slate-800">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProjectSelect(p.name)}
                      className={`py-1.5 px-2 rounded-lg border text-[10px] text-center font-bold transition-all cursor-pointer ${
                        assignedProjects.includes(p.name)
                          ? 'bg-nexora-purple/10 text-nexora-purple border-nexora-purple/20'
                          : 'bg-transparent text-slate-400 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-semibold bg-gradient-to-r from-nexora-blue to-nexora-indigo text-white hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex justify-center items-center gap-1"
              >
                Save Details
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
