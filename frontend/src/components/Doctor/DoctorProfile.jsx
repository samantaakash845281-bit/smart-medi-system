import React from 'react';
import ProfileForm from '../../components/profile/ProfileForm';

export default function DoctorProfile() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
            <div className="max-w-4xl">
                <ProfileForm />
            </div>
        </div>
    );
}
