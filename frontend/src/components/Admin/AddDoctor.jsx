import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    User, Mail, Phone, Lock, Briefcase, GraduationCap, 
    Image as ImageIcon, FileText, CheckCircle2, AlertCircle, 
    ArrowLeft, Loader2, Upload, Trash2, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AddDoctor() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        gender: 'Male',
        specialization: 'General Physician',
        experience: '',
        fees: '500'
    });

    const [files, setFiles] = useState({
        profileImage: null,
        signature: null,
        degreeCertificate: null,
        certifications: []
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        if (name === 'certifications') {
            setFiles(prev => ({
                ...prev,
                certifications: [...prev.certifications, ...Array.from(selectedFiles)]
            }));
        } else {
            setFiles(prev => ({
                ...prev,
                [name]: selectedFiles[0]
            }));
        }
    };

    const removeCertification = (index) => {
        setFiles(prev => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            
            if (files.profileImage) data.append('profileImage', files.profileImage);
            if (files.signature) data.append('signature', files.signature);
            if (files.degreeCertificate) data.append('degreeCertificate', files.degreeCertificate);
            
            files.certifications.forEach(file => {
                data.append('certifications', file);
            });

            const res = await api.post('/doctor/register', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.success) {
                toast.success('Doctor registered successfully!');
                navigate('/admin-dashboard/doctors');
            } else {
                setError(res.message || 'Failed to register doctor');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Something went wrong');
            toast.error(err.message || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-8 flex items-center gap-4">
                <button 
                    onClick={() => navigate('/admin-dashboard/doctors')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Add New Doctor</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Register a new medical specialist to the platform.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400"
                    >
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm font-bold">{error}</p>
                    </motion.div>
                )}

                {/* Section 1: Personal Information */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600">
                            <User className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Personal Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    name="fullName"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Dr. John Doe"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john.doe@example.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Gender</label>
                            <select 
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white appearance-none"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                    </div>
                </div>
                {/* Section 2: Professional Information */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center text-teal-600">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Professional Details</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Specialization</label>
                            <select 
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleChange}
                                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                            >
                                <option value="General Physician">General Physician</option>
                                <option value="Cardiology">Cardiology</option>
                                <option value="Neurology">Neurology</option>
                                <option value="Pediatrics">Pediatrics</option>
                                <option value="Orthopedics">Orthopedics</option>
                                <option value="Dermatology">Dermatology</option>
                                <option value="Psychiatry">Psychiatry</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Experience (Years)</label>
                            <input 
                                name="experience"
                                type="number"
                                required
                                value={formData.experience}
                                onChange={handleChange}
                                placeholder="E.g. 5"
                                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Consultation Fees (₹)</label>
                            <input 
                                name="fees"
                                type="number"
                                required
                                value={formData.fees}
                                onChange={handleChange}
                                placeholder="500"
                                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3: Documents Upload */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Documents & Uploads</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Profile Image */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> Profile Image (JPG/PNG)
                            </label>
                            <div className="relative group cursor-pointer">
                                <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/10 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-2xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-all"></div>
                                <input 
                                    type="file" 
                                    name="profileImage"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <div className="relative py-8 flex flex-col items-center justify-center gap-2">
                                    {files.profileImage ? (
                                        <div className="text-center">
                                            <CheckCircle2 className="w-8 h-8 text-teal-500 mx-auto" />
                                            <p className="text-xs font-bold text-slate-900 dark:text-white mt-2 truncate max-w-[150px]">{files.profileImage.name}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-slate-400" />
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upload Image</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Signature */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Digital Signature (JPG/PNG)
                            </label>
                            <div className="relative group cursor-pointer">
                                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl group-hover:bg-slate-100 transition-all"></div>
                                <input 
                                    type="file" 
                                    name="signature"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <div className="relative py-8 flex flex-col items-center justify-center gap-2">
                                    {files.signature ? (
                                        <div className="text-center">
                                            <CheckCircle2 className="w-8 h-8 text-teal-500 mx-auto" />
                                            <p className="text-xs font-bold text-slate-900 dark:text-white mt-2 truncate max-w-[150px]">{files.signature.name}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-slate-400" />
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upload Signature</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Degree Certificate */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" /> Degree Certificate (PDF/Image)
                            </label>
                            <div className="relative group cursor-pointer">
                                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl group-hover:bg-slate-100 transition-all"></div>
                                <input 
                                    type="file" 
                                    name="degreeCertificate"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <div className="relative py-8 flex flex-col items-center justify-center gap-2">
                                    {files.degreeCertificate ? (
                                        <div className="text-center">
                                            <CheckCircle2 className="w-8 h-8 text-teal-500 mx-auto" />
                                            <p className="text-xs font-bold text-slate-900 dark:text-white mt-2 truncate max-w-[150px]">{files.degreeCertificate.name}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-slate-400" />
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upload Certificate</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Other Certifications */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Other Certifications (Multiple)
                            </label>
                            <div className="space-y-3">
                                <div className="relative group cursor-pointer">
                                    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl group-hover:bg-slate-100 transition-all"></div>
                                    <input 
                                        type="file" 
                                        name="certifications"
                                        multiple
                                        accept="image/*,application/pdf"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="relative py-8 flex flex-col items-center justify-center gap-2">
                                        <Upload className="w-8 h-8 text-slate-400" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Add Files</p>
                                    </div>
                                </div>
                                
                                {/* Certification List */}
                                <div className="flex flex-wrap gap-2">
                                    {files.certifications?.map((file, i) => (
                                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[80px]">{file.name}</span>
                                            <button type="button" onClick={() => removeCertification(i)} className="text-red-500 hover:text-red-600">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Container */}
                <div className="flex items-center justify-between gap-6 pt-6">
                    <button 
                        type="button" 
                        onClick={() => navigate('/admin-dashboard/doctors')}
                        className="px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-[0.98]"
                    >
                        CANCEL & GO BACK
                    </button>
                    <button 
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:translate-y-[-2px] transition-all active:scale-[0.98] shadow-xl shadow-primary-600/20 disabled:opacity-70 disabled:translate-y-0"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                REGISTERING DOCTOR...
                            </>
                        ) : (
                            <>
                                REGISTER DOCTOR NOW
                                <CheckCircle2 className="w-6 h-6" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
