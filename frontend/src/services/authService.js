import api from './api';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase/firebase';

export const loginWithEmail = async (email, password, role) => {
    return await api.post('/auth/login', { email, password, role });
};

export const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL
    };
};
