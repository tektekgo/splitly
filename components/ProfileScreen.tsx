import React, { useState } from 'react';
import type { User } from '../types';

interface ProfileScreenProps {
    users: User[];
    onCreateUser: (name: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ users, onCreateUser }) => {
    const [newUserName, setNewUserName] = useState('');

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUserName.trim() === '') return;
        onCreateUser(newUserName.trim());
        setNewUserName('');
    };

    return (
        <main className="bg-content-light dark:bg-content-dark rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
                    User Management
                </h2>
                
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-4">
                     <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">All Users</h3>
                     <ul className="space-y-2">
                        {users.map(user => (
                            <li key={user.id} className="flex items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full mr-4" />
                                <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{user.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-6">
                     <form onSubmit={handleAddUser} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">Add New User</h3>
                         <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                            Simulate a new user signing up for the app. They will then be available to add to any group.
                         </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                placeholder="Enter new user's name..."
                                className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </main>
    );
};

export default ProfileScreen;