import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './PublicLayout';
import LandingPage from '../pages/Home';
import ServicesPage from '../pages/ServicesPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/Register';
import DoctorLoginPage from '../pages/DoctorLoginPage';
import AdminLoginPage from '../pages/AdminLoginPage';
import VerifyOTP from '../pages/VerifyOTP';
import CompleteProfile from '../pages/CompleteProfile';

import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import TermsOfServicePage from '../pages/TermsOfServicePage';

import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import AdminDashboard from '../components/Admin/AdminDashboard';
import ManageDoctors from '../components/Admin/ManageDoctors';
import ManagePatients from '../components/Admin/ManagePatients';
import AdminAppointments from '../components/Admin/AdminAppointments';
import AdminReports from '../components/Admin/AdminReports';
import AdminSettings from '../components/Admin/AdminSettings';
import AdminProfile from '../components/Admin/AdminProfile';
import DoctorDashboard from '../components/Doctor/DoctorDashboard';
import MyPatients from '../components/Doctor/MyPatients';
import DoctorAppointments from '../components/Doctor/DoctorAppointments';
import DoctorPrescriptions from '../components/Doctor/DoctorPrescriptions';
import DoctorProfile from '../components/Doctor/DoctorProfile';
import PatientDashboard from '../components/Patient/PatientDashboard';
import BookAppointment from '../components/Patient/BookAppointment';
import UPIPaymentPage from '../components/Patient/UPIPaymentPage';
import PatientAppointments from '../components/Patient/PatientAppointments';
import MedicalHistory from '../components/Patient/MedicalHistory';
import PatientPrescriptions from '../components/Patient/PatientPrescriptions';
import PatientProfile from '../components/Patient/PatientProfile';
import PatientPayments from '../components/Patient/PatientPayments';
import DoctorEarnings from '../components/Doctor/DoctorEarnings';
import AdminPaymentManagement from '../components/Admin/AdminPaymentManagement';
import AddDoctor from '../components/Admin/AddDoctor';
import AppointmentSuccess from '../components/Patient/AppointmentSuccess';
import DoctorConsultation from '../components/Doctor/DoctorConsultation';
import DoctorDetail from '../components/Admin/DoctorDetail';
import PatientDetail from '../components/Admin/PatientDetail';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
    return (
        <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/doctor-login" element={<DoctorLoginPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />

            {/* Public Pages with Navbar/Footer */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            </Route>

            {/* Protected Dashboard Routes */}
            <Route element={<DashboardLayout />}>
                {/* Admin Routes */}
                <Route path="/admin-dashboard" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/doctors" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <ManageDoctors />
                    </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/add-doctor" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AddDoctor />
                    </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/patients" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <ManagePatients />
                    </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/doctors/:id" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <DoctorDetail />
                    </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/patients/:id" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <PatientDetail />
                    </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/appointments" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminAppointments />
                    </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/payments" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminPaymentManagement />
                    </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/reports" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminReports />
                    </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/settings" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminSettings />
                    </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/profile" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminProfile />
                    </ProtectedRoute>
                } />

                {/* Doctor Routes */}
                <Route path="/doctor-dashboard" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <DoctorDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/doctor-dashboard/patients" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <MyPatients />
                    </ProtectedRoute>
                } />
                <Route path="/doctor-dashboard/appointments" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <DoctorAppointments />
                    </ProtectedRoute>
                } />
                <Route path="/doctor-dashboard/prescriptions" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <DoctorPrescriptions />
                    </ProtectedRoute>
                } />
                <Route path="/doctor-dashboard/profile" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <DoctorProfile />
                    </ProtectedRoute>
                } />
                <Route path="/doctor-dashboard/earnings" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <DoctorEarnings />
                    </ProtectedRoute>
                } />
                <Route path="/doctor-dashboard/consult/:appointmentId" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <DoctorConsultation />
                    </ProtectedRoute>
                } />

                {/* Patient Routes */}
                <Route path="/patient-dashboard" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <PatientDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/patient-dashboard/book-appointment" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <BookAppointment />
                    </ProtectedRoute>
                } />
                <Route path="/patient-dashboard/appointments" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <PatientAppointments />
                    </ProtectedRoute>
                } />
                <Route path="/patient-dashboard/history" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <MedicalHistory />
                    </ProtectedRoute>
                } />
                <Route path="/patient-dashboard/prescriptions" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <PatientPrescriptions />
                    </ProtectedRoute>
                } />
                <Route path="/patient-dashboard/profile" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <PatientProfile />
                    </ProtectedRoute>
                } />
                <Route path="/patient-dashboard/payment/:appointmentId" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <UPIPaymentPage />
                    </ProtectedRoute>
                } />
                <Route path="/patient-dashboard/payments" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <PatientPayments />
                    </ProtectedRoute>
                } />
                <Route path="/patient-dashboard/appointment-success" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <AppointmentSuccess />
                    </ProtectedRoute>
                } />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes >
    );
}
