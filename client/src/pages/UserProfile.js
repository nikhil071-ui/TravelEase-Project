import { useState, useEffect } from 'react'; // 'React' import removed to fix runtime error
import { useNavigate } from 'react-router-dom';
import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  signOut,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../firebase';
import {
  User,
  Mail,
  KeyRound,
  ShieldAlert,
  Trash2,
  LogOut,
  Home,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';
import ReauthModal from '../components/ReauthModal'; // 1. Import the new modal component

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // States
  const [displayName, setDisplayName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI feedback
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isUploading, setIsUploading] = useState(false);
  
  // 2. State for the two-step delete process
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
  const [reauthLoading, setReauthLoading] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || '');
        setPhotoPreview(currentUser.photoURL);
        setLoading(false);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (displayName === user.displayName && !photoFile) {
      setProfileMessage({ type: 'info', text: 'No changes to save.' });
      return;
    }
    setIsUploading(true);
    setProfileMessage({ type: '', text: '' });
    try {
      let photoURL = user.photoURL;
      if (photoFile) {
        const storageRef = ref(
          storage,
          `profile-pictures/${user.uid}/${photoFile.name}`
        );
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }
      await updateProfile(auth.currentUser, {
        displayName: displayName,
        photoURL: photoURL,
      });
      setUser({ ...auth.currentUser });
      setProfileMessage({
        type: 'success',
        text: 'Profile updated successfully!',
      });
    } catch (error) {
      console.error('Error updating profile: ', error);
      setProfileMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsUploading(false);
      setPhotoFile(null);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({
        type: 'error',
        text: 'Password must be at least 8 characters.',
      });
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordMessage({
        type: 'error',
        text: 'Password must include a number & uppercase letter.',
      });
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      setPasswordMessage({ type: 'success', text: 'Password updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password update error:', error.code);
      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        setPasswordMessage({
          type: 'error',
          text: 'Incorrect current password.',
        });
      } else {
        setPasswordMessage({ type: 'error', text: 'Error. Try again.' });
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // --- 3. UPDATED DELETE FLOW (Replaces old confirmDeleteAccount) ---
  const handleDeleteAccount = () => {
      // Step 1: Open the initial "Are you sure?" modal
      setIsDeleteModalOpen(true);
  };
  
  const proceedToDelete = () => {
      // Step 2: Close the first modal and open the re-authentication modal
      setIsDeleteModalOpen(false);
      setIsReauthModalOpen(true);
  };

  const confirmDeleteWithPassword = async (password) => {
    setReauthLoading(true);
    try {
      // Step 3: Re-authenticate with the password from the modal
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Step 4: If successful, delete the user's account
      await deleteUser(auth.currentUser);
      
      setIsReauthModalOpen(false);
      navigate('/signup'); // Redirect after successful deletion

    } catch (error) {
       if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            alert('Incorrect password. Account deletion canceled.');
       } else {
            alert('An error occurred during deletion. Please try again.');
       }
       // We keep the modal open on error so the user can try again
    } finally {
        setReauthLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-100 to-indigo-100">
        <motion.p
          className="text-lg font-semibold text-indigo-700"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Loading Profile...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 font-sans">
      <header className="bg-white/80 backdrop-blur-md shadow sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <motion.h1
            whileHover={{ scale: 1.05 }}
            className="text-2xl font-extrabold text-indigo-600 cursor-pointer"
            onClick={() => navigate('/')}
          >
            TravelEase
          </motion.h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="font-semibold text-gray-700 hover:text-indigo-600 flex items-center gap-2 transition-colors"
            >
              <Home size={20} /> Home
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-extrabold text-gray-800">
              Account Settings
            </h2>
            <p className="text-lg text-gray-500 mt-2">
              Manage your account and security settings securely.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white p-8 rounded-2xl shadow-lg lg:col-span-2"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <User /> Profile Information
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    <img
                      src={
                        photoPreview ||
                        `https://ui-avatars.com/api/?name=${
                          displayName || user.email
                        }&background=random&size=128&color=fff`
                      }
                      alt="Profile"
                      className="w-28 h-28 rounded-full object-cover border-4 border-slate-200"
                    />
                    <label className="absolute inset-0 bg-black/40 rounded-full flex justify-center items-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                      <span className="text-white text-sm">Change</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handlePhotoChange}
                        accept="image/*"
                      />
                    </label>
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email Address
                  </label>
                  <p className="w-full p-3 bg-slate-100 rounded-lg text-gray-700 flex items-center gap-2">
                    <Mail size={16} /> {user.email}
                  </p>
                </div>
                <div className="flex justify-end items-center">
                  {profileMessage.text && (
                    <p
                      className={`text-sm mr-4 ${
                        profileMessage.type === 'success'
                          ? 'text-green-600'
                          : 'text-red-500'
                      }`}
                    >
                      {profileMessage.text}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition disabled:bg-indigo-300"
                  >
                    {isUploading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Security Card */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white p-8 rounded-2xl shadow-lg"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <KeyRound /> Security
              </h3>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Current Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg transition"
                >
                  Update Password
                </button>
                {passwordMessage.text && (
                  <p
                    className={`text-center text-sm mt-2 ${
                      passwordMessage.type === 'success'
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}
                  >
                    {passwordMessage.text}
                  </p>
                )}
              </form>
            </motion.div>
          </div>

          {/* Danger Zone */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-white p-8 rounded-2xl shadow-lg mt-10 border-t-4 border-red-500"
          >
            <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-3">
              <ShieldAlert /> Danger Zone
            </h3>
            <div className="md:flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-gray-800">Delete Account</h4>
                <p className="text-gray-600 text-sm">
                  This action is permanent and cannot be undone.
                </p>
              </div>
              <button
                onClick={handleDeleteAccount} // This now starts the modal flow
                className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-lg flex items-center gap-2 transition"
              >
                <Trash2 size={16} /> Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* 4. Add both modals to the render output */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={proceedToDelete}
        title="Are You Absolutely Sure?"
        variant="danger"
        confirmText="Yes, Delete My Account"
      >
        <p>
          This action is irreversible. All your personal data will be permanently
          deleted.
        </p>
      </ConfirmModal>

      <ReauthModal
        isOpen={isReauthModalOpen}
        onClose={() => setIsReauthModalOpen(false)}
        onConfirm={confirmDeleteWithPassword}
        title="Confirm Account Deletion"
        loading={reauthLoading}
      />
    </div>
  );
};

export default UserProfile;

