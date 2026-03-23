import React, { useState, useEffect, useContext, useRef } from 'react';
import { Camera, Save, X, Edit, User as UserIcon, Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api, { BACKEND_URL } from '../../services/api';
import toast from 'react-hot-toast';

export default function ProfileForm() {
    const { user, updateUser } = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

    // Form State
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        address: user?.address || '',
        gender: user?.gender || '',
        dob: user?.dob ? new Date(user?.dob).toISOString().split('T')[0] : '',
        about: user?.about || '',
        specialization: user?.specialization || ''
    });

    const [profileImage, setProfileImage] = useState(null);
    const [removePhotoSelected, setRemovePhotoSelected] = useState(false);
    const [imagePreview, setImagePreview] = useState(user?.profile_image ? (user?.profile_image.startsWith('http') ? user?.profile_image : `${BACKEND_URL}${user?.profile_image}`) : null);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user?.fullName || '',
                phone: user?.phone || '',
                address: user?.address || '',
                gender: user?.gender || '',
                dob: user?.dob ? new Date(user?.dob).toISOString().split('T')[0] : '',
                about: user?.about || '',
                specialization: user?.specialization || ''
            });
            setImagePreview(user?.profile_image ? (user?.profile_image.startsWith('http') ? user?.profile_image : `${BACKEND_URL}${user?.profile_image}`) : null);
            setRemovePhotoSelected(false);
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            setProfileImage(file);
            setRemovePhotoSelected(false);
            setImagePreview(URL.createObjectURL(file));
            toast.success('Photo selected! Click Save to confirm.');
        }
    };

    const handleRemovePhoto = () => {
        setProfileImage(null);
        setRemovePhotoSelected(true);
        setImagePreview(null);
        toast.info('Photo slated for removal. Click Save to confirm.');
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (user) {
            setFormData({
                fullName: user?.fullName || '',
                phone: user?.phone || '',
                address: user?.address || '',
                gender: user?.gender || '',
                dob: user?.dob ? new Date(user?.dob).toISOString().split('T')[0] : '',
                about: user?.about || '',
                specialization: user?.specialization || ''
            });
            setImagePreview(user?.profile_image ? (user?.profile_image.startsWith('http') ? user?.profile_image : `${BACKEND_URL}${user?.profile_image}`) : null);
            setProfileImage(null);
            setRemovePhotoSelected(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const loadingToast = toast.loading('Updating your profile...');

        try {
            const uploadData = new FormData();
            Object.keys(formData).forEach(key => {
                uploadData.append(key, formData[key]);
            });

            if (profileImage) {
                uploadData.append('profile_image', profileImage);
                setUploadingImage(true);
            }

            if (removePhotoSelected) {
                uploadData.append('remove_photo', true);
            }

            const response = await api.put(`/users/update-profile/${user?.id}`, uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.success) {
                updateUser(response.data);
                setIsEditing(false);
                setProfileImage(null);
                setRemovePhotoSelected(false);
                toast.success('Profile updated successfully!', { id: loadingToast });
            } else {
                toast.error(response.message || 'Failed to update profile', { id: loadingToast });
            }
        } catch (error) {
            toast.error(error.message || 'An error occurred while updating', { id: loadingToast });
        } finally {
            setLoading(false);
            setUploadingImage(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Profile Hero Header */}
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary-600 to-indigo-600 opacity-10 dark:opacity-20"></div>

                <div className="relative pt-12 pb-8 px-8 sm:px-12 flex flex-col sm:flex-row items-center sm:items-end gap-8">
                    {/* Avatar Container */}
                    <div className="relative -mb-4">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-2xl relative group">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300">
                                    <UserIcon className="w-16 h-16" />
                                </div>
                            )}

                            {isEditing && (
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                    <div className="flex flex-col items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
                                            title="Change Photo"
                                        >
                                            <Camera className="w-6 h-6" />
                                        </button>
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={handleRemovePhoto}
                                                className="p-2 bg-red-500/40 hover:bg-red-500/60 rounded-full transition-colors"
                                                title="Remove Photo"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider mt-2">Manage Photo</span>
                                </div>
                            )}

                            {uploadingImage && (
                                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center z-10">
                                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                                </div>
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white capitalize tracking-tight">{user?.fullName || 'Health Professional'}</h1>
                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-2">
                            <span className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-widest">{user?.role}</span>
                            {user?.specialization && (
                                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium italic">{user?.specialization}</span>
                            )}
                        </div>
                    </div>

                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="sm:mb-4 px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Edit className="w-4 h-4" />
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Form Sections */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Personal Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/20 dark:shadow-none h-full">
                            <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white font-bold text-lg border-b border-slate-50 dark:border-slate-800 pb-4">
                                <UserIcon className="w-5 h-5 text-primary-600" />
                                Personal Information
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        readOnly={!isEditing}
                                        className={`w-full px-4 py-3 rounded-2xl text-sm transition-all ${!isEditing
                                            ? 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-700 dark:text-slate-300 font-medium'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 border shadow-sm'}`}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        readOnly={!isEditing}
                                        className={`w-full px-4 py-3 rounded-2xl text-sm transition-all ${!isEditing
                                            ? 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-700 dark:text-slate-300 font-medium'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 border shadow-sm'}`}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-3 rounded-2xl text-sm transition-all appearance-none ${!isEditing
                                            ? 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-700 dark:text-slate-300 font-medium'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 border shadow-sm'}`}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        readOnly={!isEditing}
                                        className={`w-full px-4 py-3 rounded-2xl text-sm transition-all ${!isEditing
                                            ? 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-700 dark:text-slate-300 font-medium'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 border shadow-sm'}`}
                                    />
                                </div>

                                <div className="sm:col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Street Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        readOnly={!isEditing}
                                        rows="3"
                                        className={`w-full px-4 py-3 rounded-2xl text-sm transition-all resize-none ${!isEditing
                                            ? 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-700 dark:text-slate-300 font-medium'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 border shadow-sm'}`}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Role Specific & Image Preview */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/20 dark:shadow-none">
                            <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white font-bold text-lg border-b border-slate-50 dark:border-slate-800 pb-4">
                                <AlertCircle className="w-5 h-5 text-indigo-600" />
                                Account Details
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                                    <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent text-slate-500 dark:text-slate-400 text-sm font-medium italic">
                                        {user?.email}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 italic">* Email cannot be changed</p>
                                </div>

                                {user?.role === 'doctor' && (
                                    <div className="space-y-1.5 animate-in fade-in duration-300">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Specialization</label>
                                        <input
                                            type="text"
                                            name="specialization"
                                            value={formData.specialization}
                                            onChange={handleChange}
                                            readOnly={!isEditing}
                                            placeholder="e.g. Cardiologist"
                                            className={`w-full px-4 py-3 rounded-2xl text-sm transition-all ${!isEditing
                                                ? 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-700 dark:text-slate-300 font-medium'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 border shadow-sm'}`}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Professional Bio */}
                        <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-primary-600/20">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <div className="p-1 bg-white/20 rounded-lg">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                                Professional Bio
                            </h3>
                            <textarea
                                name="about"
                                value={formData.about}
                                onChange={handleChange}
                                readOnly={!isEditing}
                                placeholder="Your professional journey and expertise..."
                                rows="6"
                                className={`w-full px-4 py-3 rounded-2xl text-sm transition-all bg-white/10 border-white/20 placeholder-white/40 text-white resize-none scrollbar-hide ${!isEditing
                                    ? 'border-transparent focus:ring-0 cursor-default'
                                    : 'focus:ring-2 focus:ring-white/50 border-white/40'}`}
                            ></textarea>
                            {!isEditing && !formData.about && (
                                <p className="text-xs text-white/60 mt-2 italic text-center">No bio provided yet. Personalize your profile.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Floating Action Buttons */}
                {isEditing && (
                    <div className="fixed bottom-8 right-8 z-50 flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-right-8 duration-300">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                            className="bg-white dark:bg-slate-800 text-slate-600 shadow-2xl border border-slate-100 dark:border-slate-700 px-8 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <X className="w-5 h-5" /> Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary-600 text-white shadow-2xl shadow-primary-600/30 px-8 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all flex items-center gap-2 active:scale-95 group"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            )}
                            Save Changes
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
