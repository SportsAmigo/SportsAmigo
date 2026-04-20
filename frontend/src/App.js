import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { checkAuthStatus, selectUser, selectCheckingAuth } from './store/slices/authSlice';
import './App.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import ModeratorLogin from './pages/ModeratorLogin';
import Signup from './pages/Signup';
import Shop from './pages/Shop';
import About from './pages/About';
import Contact from './pages/Contact';

// Player Pages
import PlayerDashboard from './pages/player/Dashboard';
import Profile from './pages/player/Profile';
import PlayerEvents from './pages/player/BrowseEvents';
import BrowseTeams from './pages/player/BrowseTeams';
import TeamDetail from './pages/player/TeamDetail';
import Wallet from './pages/player/Wallet';
import MyEvents from './pages/player/MyEvents';
import MyTeams from './pages/player/MyTeams';
import MyMatches from './pages/player/MyMatches';
import PlayerStats from './pages/player/PlayerStats';
import PlayerMatches from './pages/player/PlayerMatches';
import PlayerEventDetail from './pages/player/EventDetail';
import PlayerServices from './pages/player/PlayerServices';

// Manager Pages
import ManagerDashboard from './pages/manager/Dashboard';
import CreateTeam from './pages/manager/CreateTeam';
import EditTeam from './pages/manager/EditTeam';
import ManagerBrowseEvents from './pages/manager/BrowseEvents';
import ManagerMyTeams from './pages/manager/MyTeams';
import ManagerMyEvents from './pages/manager/MyEvents';
import ManagerProfile from './pages/manager/Profile';
import TeamManage from './pages/manager/TeamManage';
import ManagerEventDetails from './pages/manager/EventDetails';
import EventRegister from './pages/manager/EventRegister';
import TeamMatches from './pages/manager/TeamMatches';

// Organizer Pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import EditEvent from './pages/organizer/EditEvent';
import EventDetails from './pages/organizer/EventDetails';
import OrganizerMyEvents from './pages/organizer/MyEvents';
import OrganizerProfile from './pages/organizer/OrganizerProfile';
import EventMatches from './pages/organizer/EventMatches';
import EventLeaderboard from './pages/organizer/EventLeaderboard';
import ScheduleMatches from './pages/organizer/ScheduleMatches';
import OrganizerServices from './pages/organizer/OrganizerServices';
import SubscriptionManagement from './pages/organizer/SubscriptionManagement';
import PaymentHistory from './pages/organizer/PaymentHistory';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPlayers from './pages/admin/AdminPlayers';
import AdminManagers from './pages/admin/AdminManagers';
import AdminOrganizers from './pages/admin/AdminOrganizers';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTeams from './pages/admin/AdminTeams';
import AdminEvents from './pages/admin/AdminEvents';
import AdminMatches from './pages/admin/AdminMatches';
import AdminStats from './pages/admin/AdminStats';
import AdminActivityLogs from './pages/admin/AdminActivityLogs';
import AdminFinancialOverview from './pages/admin/AdminFinancialOverview';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminVASRevenue from './pages/admin/AdminVASRevenue';
import AdminCommissions from './pages/admin/AdminCommissions';
import AdminVerificationHub from './pages/admin/AdminVerificationHub';
import AdminCoordinators from './pages/admin/AdminCoordinators';

// Coordinator Pages
import CoordinatorHome from './pages/coordinator/CoordinatorHome';
import PendingOrganizers from './pages/coordinator/PendingOrganizers';
import PendingEvents from './pages/coordinator/PendingEvents';
import ApprovedOrganizers from './pages/coordinator/ApprovedOrganizers';
import ApprovedEvents from './pages/coordinator/ApprovedEvents';
import RejectedApplications from './pages/coordinator/RejectedApplications';
import ActivityLog from './pages/coordinator/ActivityLog';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useSelector(selectUser);
  const checkingAuth = useSelector(selectCheckingAuth);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600"></div>
          <p className="text-gray-700 text-lg font-medium mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// App Content Component (needs to be separate to use hooks)
const AppContent = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    // Check authentication status on app mount
    if (!user) {
      dispatch(checkAuthStatus());
    }
  }, [dispatch, user]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup/:role" element={<Signup />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/shop" element={<Shop />} />

        {/* Admin & Coordinator Login Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/moderator/login" element={<ModeratorLogin />} />
        <Route path="/coordinator/login" element={<ModeratorLogin />} />

        {/* Player Routes */}
        <Route
          path="/player/dashboard"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <PlayerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player/profile"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player/events"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <PlayerEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <Wallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player/my-events"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <MyEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player/my-teams"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <MyTeams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player/browse-teams"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <BrowseTeams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player/team/:teamId"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <TeamDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player/event/:eventId"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <PlayerEventDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player/my-matches"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <MyMatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player/stats"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <PlayerStats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player/matches"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <PlayerMatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player/services"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <PlayerServices />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/create-team"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <CreateTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/my-teams"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerMyTeams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/team/:id/manage"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <TeamManage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/edit-team/:id"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <EditTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/team/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <EditTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/browse-events"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerBrowseEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/profile"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/my-events"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerMyEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/event/:id/details"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerEventDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/event/:id/register"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <EventRegister />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/team/:teamId/matches"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <TeamMatches />
            </ProtectedRoute>
          }
        />

        {/* Organizer Routes */}
        <Route
          path="/organizer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/create-event"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/event/:id"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <EventDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/edit-event/:id"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <EditEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/my-events"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <OrganizerMyEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/manage-events"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <OrganizerMyEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/profile"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <OrganizerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/event/:eventId/matches"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <EventMatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/event/:eventId/schedule-matches"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <ScheduleMatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/event/:eventId/leaderboard"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <EventLeaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/services"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <OrganizerServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/subscription"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <SubscriptionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/payment-history"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <PaymentHistory />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/players"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPlayers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/managers"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminManagers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/organizers"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminOrganizers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teams"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminTeams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/coordinators"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCoordinators />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/financial"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminFinancialOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminSubscriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vas"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminVASRevenue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/commissions"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCommissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/verification"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminVerificationHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminStats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activity-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminActivityLogs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/matches"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminMatches />
            </ProtectedRoute>
          }
        />
        {/* Coordinator Routes */}
        <Route
          path="/moderator/dashboard"
          element={
            <ProtectedRoute allowedRoles={['moderator', 'coordinator']}>
              <CoordinatorHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/dashboard"
          element={
            <ProtectedRoute allowedRoles={['moderator', 'coordinator']}>
              <CoordinatorHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/pending-organizers"
          element={
            <ProtectedRoute allowedRoles={['moderator', 'coordinator']}>
              <PendingOrganizers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/pending-events"
          element={
            <ProtectedRoute allowedRoles={['moderator', 'coordinator']}>
              <PendingEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/approved-organizers"
          element={
            <ProtectedRoute allowedRoles={['moderator', 'coordinator']}>
              <ApprovedOrganizers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/approved-events"
          element={
            <ProtectedRoute allowedRoles={['moderator', 'coordinator']}>
              <ApprovedEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/rejected"
          element={
            <ProtectedRoute allowedRoles={['moderator', 'coordinator']}>
              <RejectedApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/activity-log"
          element={
            <ProtectedRoute allowedRoles={['moderator', 'coordinator']}>
              <ActivityLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminStats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activity-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminActivityLogs />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
}

export default App;
