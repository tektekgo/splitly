import React, { useState, useMemo } from 'react';
import type { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import InfoTooltip from './InfoTooltip';

interface ProfileScreenProps {
    users: User[];
    onCreateUser: (name: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ users, onCreateUser }) => {
    const { logout, currentUser } = useAuth();
    const [newUserName, setNewUserName] = useState('');

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUserName.trim() === '') return;
        onCreateUser(newUserName.trim());
        setNewUserName('');
    };

    // Separate logged-in user from simulated users
    const { loggedInUser, simulatedUsers } = useMemo(() => {
        const loggedIn = users.find(u => u.id === currentUser?.id);
        const simulated = users.filter(u => u.id !== currentUser?.id);
        return { loggedInUser: loggedIn, simulatedUsers: simulated };
    }, [users, currentUser]);

    return (
        <main className="bg-content-light dark:bg-content-dark rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                        Profile & People
                    </h2>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        Manage your account and add people to split expenses with
                    </p>
                </div>

                {/* Logged-in User Section */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-4 border-2 border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                            Your Account
                            <span className="px-2 py-0.5 bg-primary text-white text-xs font-semibold rounded-full">
                                Logged In
                            </span>
                        </h3>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                    {loggedInUser && (
                        <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <img src={loggedInUser.avatarUrl} alt={loggedInUser.name} className="w-12 h-12 rounded-full mr-4 ring-2 ring-primary" />
                            <div>
                                <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">{loggedInUser.name}</p>
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Authenticated with Google</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Explanation Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                        <span className="text-2xl">💡</span>
                        <div>
                            <p className="font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                                Why add people?
                            </p>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                Add roommates, friends, or family members who <strong>don't have a Splitly account</strong>. 
                                You can then include them in your groups and track expenses together. They won't need to log in - 
                                you'll manage everything on your side!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Simulated Users Section */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                                People You've Added
                            </h3>
                            <InfoTooltip text="These are people you've created to track shared expenses. They don't have their own login - you manage everything for them." />
                        </div>
                        <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark text-xs font-semibold rounded-full">
                            {simulatedUsers.length} {simulatedUsers.length === 1 ? 'person' : 'people'}
                        </span>
                    </div>
                    
                    {simulatedUsers.length > 0 ? (
                        <ul className="space-y-2">
                            {simulatedUsers.map(user => (
                                <li key={user.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center">
                                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full mr-4" />
                                        <div>
                                            <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{user.name}</p>
                                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">No login required</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                        Guest
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                No people added yet. Add someone below to get started!
                            </p>
                        </div>
                    )}
                </div>

                {/* Add New User Form */}
                <form onSubmit={handleAddUser} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 flex items-center">
                        <span className="text-2xl mr-2">➕</span>
                        Add New Person
                    </h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                        Add someone who doesn't have a Splitly account. Great for roommates, friends, or family!
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="Enter their name (e.g., 'John', 'Sarah')"
                            className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        />
                        <button
                            type="submit"
                            disabled={!newUserName.trim()}
                            className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            Add Person
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default ProfileScreen;