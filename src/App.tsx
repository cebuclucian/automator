import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { JobProvider } from '@/context/job-context';
import { LanguageProvider } from '@/context/language-context';
import PrivateRoute from '@/components/private-route';
import AdminRoute from '@/components/admin-route';

// Public Pages
import HomePage from '@/pages/home';
import AboutPage from '@/pages/about';
import PricingPage from '@/pages/pricing';
import ContactPage from '@/pages/contact';
import SuccessPage from '@/pages/success';

// Auth Pages
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import ResetPasswordPage from '@/pages/reset-password';

// Dashboard Pages
import DashboardPage from '@/pages/dashboard';
import GeneratePage from '@/pages/generate';
import CoursesPage from '@/pages/courses';
import CourseViewPage from '@/pages/course-view';
import CourseEditPage from '@/pages/course-edit';

// Account Pages
import SettingsPage from '@/pages/settings';
import SubscriptionPage from '@/pages/subscription';
import BillingPage from '@/pages/billing';

// Progress and Materials
import JobProgressPage from '@/pages/job-progress';
import MaterialsPage from '@/pages/materials';
import GenerationProgressPage from '@/pages/generation-progress';
import DownloadCenterPage from '@/pages/download-center';

// Admin Pages
import AdminDashboardPage from '@/pages/admin/dashboard';
import AdminUsersPage from '@/pages/admin/users';
import AdminReportsPage from '@/pages/admin/reports';

// Legal and Error Pages
import LegalPage from '@/pages/legal';
import NotFoundPage from '@/pages/404';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <JobProvider>
            <Router>
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<HomePage />} />
                <Route path="/despre" element={<AboutPage />} />
                <Route path="/preturi" element={<PricingPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/success" element={<SuccessPage />} />
                
                {/* Auth Pages */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                
                {/* Dashboard Pages */}
                <Route path="/dashboard" element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                } />
                
                <Route path="/genereaza-curs" element={
                  <PrivateRoute>
                    <GeneratePage />
                  </PrivateRoute>
                } />
                
                <Route path="/cursuri" element={
                  <PrivateRoute>
                    <CoursesPage />
                  </PrivateRoute>
                } />
                
                <Route path="/curs/:id" element={
                  <PrivateRoute>
                    <CourseViewPage />
                  </PrivateRoute>
                } />
                
                <Route path="/curs/:id/edit" element={
                  <PrivateRoute>
                    <CourseEditPage />
                  </PrivateRoute>
                } />
                
                {/* Account Management */}
                <Route path="/profil" element={
                  <PrivateRoute>
                    <SettingsPage />
                  </PrivateRoute>
                } />
                
                <Route path="/settings" element={
                  <PrivateRoute>
                    <SettingsPage />
                  </PrivateRoute>
                } />
                
                <Route path="/abonament" element={
                  <PrivateRoute>
                    <SubscriptionPage />
                  </PrivateRoute>
                } />
                
                <Route path="/facturare" element={
                  <PrivateRoute>
                    <BillingPage />
                  </PrivateRoute>
                } />
                
                {/* Progress and Materials */}
                <Route path="/jobs/:jobId" element={
                  <PrivateRoute>
                    <JobProgressPage />
                  </PrivateRoute>
                } />
                
                <Route path="/materials/:jobId" element={
                  <PrivateRoute>
                    <MaterialsPage />
                  </PrivateRoute>
                } />
                
                <Route path="/generare/:sessionId" element={
                  <PrivateRoute>
                    <GenerationProgressPage />
                  </PrivateRoute>
                } />
                
                <Route path="/download/:sessionId" element={
                  <PrivateRoute>
                    <DownloadCenterPage />
                  </PrivateRoute>
                } />
                
                {/* Admin Pages */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                } />
                
                <Route path="/admin/utilizatori" element={
                  <AdminRoute>
                    <AdminUsersPage />
                  </AdminRoute>
                } />
                
                <Route path="/admin/rapoarte" element={
                  <AdminRoute>
                    <AdminReportsPage />
                  </AdminRoute>
                } />
                
                {/* Legal Pages */}
                <Route path="/termeni" element={<LegalPage type="terms" />} />
                <Route path="/confidentialitate" element={<LegalPage type="privacy" />} />
                
                {/* 404 Page */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>
            <Toaster />
          </JobProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;