import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';
import { PopupProvider } from './context/PopupContext';

function App() {
    return (
        <AuthProvider>
            <Toaster position="top-right" reverseOrder={false} />
            <PopupProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </PopupProvider>
        </AuthProvider>
    );
}

export default App;
