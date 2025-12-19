import React, { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartTour?: () => void;
}

type TabType = 'getting-started' | 'groups' | 'expenses' | 'invites' | 'privacy';

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onRestartTour }) => {
  const [activeTab, setActiveTab] = useState<TabType>('getting-started');

  if (!isOpen) return null;

  const tabs = [
    { id: 'getting-started' as TabType, label: 'Getting Started', icon: '🧭' },
    { id: 'groups' as TabType, label: 'Groups & People', icon: '🧑‍🤝‍🧑' },
    { id: 'expenses' as TabType, label: 'Expenses', icon: '🧾' },
    { id: 'invites' as TabType, label: 'Invites', icon: '✉️' },
    { id: 'privacy' as TabType, label: 'Privacy', icon: '🛡️' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-stone-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
          <div>
          <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
              🧠 Help & FAQ
            </h2>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Everything you need to know about Split<span className="text-primary">Bi</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-light dark:border-border-dark overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label.split(' ').slice(1).join(' ')}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'getting-started' && (
            <div className="space-y-6">
              <Section title={<>Welcome to Split<span className="text-primary">Bi</span>! 🎉</>}>
                <p>Split<span className="text-primary">Bi</span> helps you track and split shared expenses with roommates, friends, and family. Here's how to get started:</p>
              </Section>

              <Section title="Step 1: Create Your First Group">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Click the <strong>Groups</strong> tab at the bottom</li>
                  <li>Click <strong>"+ Create New Group"</strong></li>
                  <li>Give it a name (e.g., "Roommates", "Weekend Trip")</li>
                  <li>Add members to the group</li>
                </ol>
              </Section>

              <Section title="Step 2: Add People">
                <p className="mb-2">You have two options:</p>
                <div className="bg-teal-light dark:bg-primary-900/20 p-4 rounded-lg mb-2">
                  <strong>Option A: Guest Users (No Login)</strong>
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Go to <strong>People</strong> tab</li>
                    <li>Click "Add Person"</li>
                    <li>Enter their name</li>
                    <li>You manage everything for them</li>
                  </ul>
                </div>
                <div className="bg-teal-light dark:bg-primary-900/20 p-4 rounded-lg">
                  <strong>Option B: Invite Real Users (With Login)</strong>
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Open group → Click <strong>Manage</strong></li>
                    <li>Scroll to "📧 Invite by Email"</li>
                    <li>Enter their email and send invite</li>
                    <li>They can manage their own account</li>
                  </ul>
                </div>
              </Section>

              <Section title="Step 3: Add Expenses ➕">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Click the big <strong>+</strong> button at the bottom center</li>
                  <li>Enter expense details (description, amount, category)</li>
                  <li>Choose who paid</li>
                  <li>Choose how to split (equal, custom amounts, percentages, shares)</li>
                  <li>Save!</li>
                </ol>
              </Section>

              <Section title="Step 4: Settle Up 💼">
                <p>When it's time to settle debts:</p>
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>Go to <strong>Dashboard</strong></li>
                  <li>Click <strong>"Settle Up"</strong> button</li>
                  <li>See simplified debt list (optimized payments)</li>
                  <li>Record payments as they happen</li>
                </ol>
              </Section>

              <Section title={<>How do I install Split<span className="text-primary">Bi</span> as an app?</>}>
                <p className="mb-3">Installing makes Split<span className="text-primary">Bi</span> work like a native app - faster and more convenient!</p>
                
                <div className="space-y-3">
                  <div className="bg-teal-light dark:bg-primary-900/20 p-3 rounded-lg">
                    <strong className="text-primary dark:text-primary-100">🪟 Windows (Chrome/Edge):</strong>
                    <ol className="list-decimal list-inside mt-2 text-sm space-y-1">
                      <li>Look for an install icon (⊕ or 🖥️⤓) in the address bar</li>
                      <li>Click it → Click "Install"</li>
                      <li>Or: Menu (⋮) → "Apps" → "Install Split<span className='text-primary'>Bi</span>"</li>
                    </ol>
                    <p className="text-xs mt-2 text-primary-800 dark:text-primary-200">
                      💡 See "Open In App"? It's already installed - click that!
                    </p>
                  </div>

                  <div className="bg-teal-light dark:bg-primary-900/20 p-3 rounded-lg">
                    <strong className="text-primary dark:text-primary-100">🤖 Android (Chrome):</strong>
                    <ol className="list-decimal list-inside mt-2 text-sm space-y-1">
                      <li>Tap menu (⋮) → "Install app"</li>
                      <li>Or tap banner at bottom: "Install"</li>
                      <li>Icon appears on home screen!</li>
                    </ol>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <strong className="text-purple-900 dark:text-purple-100">🍎 iPhone (Safari only!):</strong>
                    <ol className="list-decimal list-inside mt-2 text-sm space-y-1">
                      <li>Tap Share button (□↑)</li>
                      <li>Scroll → "Add to Home Screen"</li>
                      <li>Tap "Add"</li>
                    </ol>
                    <p className="text-xs mt-2 text-purple-800 dark:text-purple-200">
                      ⚠️ Must use Safari, not Chrome!
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm">
                  <strong>📱 For detailed instructions:</strong> Click "Install App" at the bottom of the page.
                </p>
              </Section>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-6">
              <Section title="What are Groups? 👥">
                <p>Groups help you organize expenses for different situations. Common examples:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li><strong>Roommates</strong> - Track rent, utilities, groceries</li>
                  <li><strong>Trip with Friends</strong> - Hotels, meals, activities</li>
                  <li><strong>Family Expenses</strong> - Shared household costs</li>
                  <li><strong>Events</strong> - Weddings, parties, celebrations</li>
                </ul>
              </Section>

              <Section title="How do I switch between groups?">
                <p>On the Dashboard, click the group name at the top to open a dropdown menu. Select any group to switch instantly!</p>
              </Section>

              <Section title="Guest Users vs Real Users">
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-stone-100 dark:border-gray-600">
                    <strong className="text-primary">Guest Users (No Login)</strong>
                    <ul className="list-disc list-inside mt-2 text-sm">
                      <li>You create them in the People tab</li>
                      <li>They never see Split<span className="text-primary">Bi</span></li>
                      <li>You manage all their expenses</li>
                      <li>Great for: partners, kids, anyone who doesn't want an account</li>
                      <li>Shows "Guest" badge</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-stone-100 dark:border-gray-600">
                    <strong className="text-primary">Real Users (With Login)</strong>
                    <ul className="list-disc list-inside mt-2 text-sm">
                      <li>You invite them by email</li>
                      <li>They create their own Split<span className="text-primary">Bi</span> account</li>
                      <li>They can add expenses themselves</li>
                      <li>They see their own balances</li>
                      <li>Great for: roommates, friends who want to participate</li>
                      <li>Shows "Logged In" status</li>
                    </ul>
                  </div>
                </div>
              </Section>

              <Section title="How do I add someone to a group?">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Open the group (from Dashboard or Groups tab)</li>
                  <li>Click the <strong>Manage</strong> button (gear icon)</li>
                  <li>Choose either:
                    <ul className="list-disc list-inside ml-6 mt-2">
                      <li><strong>Create new member</strong> (guest user - no email)</li>
                      <li><strong>Invite by Email</strong> (real user with account)</li>
                      <li><strong>Add existing member</strong> (from dropdown if you have guest users)</li>
                    </ul>
                  </li>
                </ol>
              </Section>

              <Section title="Can I delete a guest user?">
                <p className="mb-2">Yes! Hover over any guest user in the People tab to see the delete button (🗑️).</p>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm">
                  <p className="font-semibold mb-2">⚠️ You can only delete if:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>They're not in any groups (remove from groups first)</li>
                    <li>Their balance is $0.00 (all debts settled)</li>
                  </ul>
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                    Note: Deleting also removes their expense history if they're settled up.
                  </p>
                </div>
              </Section>

              <Section title="Can I delete a group?">
                <p className="mb-2">Yes, but only if all debts are settled (everyone owes $0.00).</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">⚠️ Tip: Use "Settle Up" to record payments first, then delete the group.</p>
              </Section>

              <Section title="What if I created 'John' as a guest, but then real John signs up?">
                <div className="space-y-2">
                  <p>You'll temporarily have two "John" entries - a guest and the real user.</p>
                  <p className="font-semibold text-primary">Here's what to do:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Remove guest "John" from all groups</li>
                    <li>Invite real John (john@email.com) to those groups</li>
                    <li>Once real John joins, delete the guest "John" from People tab</li>
                  </ol>
                  <p className="text-xs bg-teal-light dark:bg-primary-900/20 p-3 rounded-lg mt-3">
                    💡 <strong>Tip:</strong> If guest John has unsettled balances, record a settlement payment to bring them to $0.00 before deleting. This preserves the expense history while allowing cleanup.
                  </p>
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <Section title="How do I add an expense? 💰">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Click the big <strong>+</strong> button at the bottom center</li>
                  <li>Fill in details:
                    <ul className="list-disc list-inside ml-6 mt-2">
                      <li>Description (e.g., "Dinner at Pizza Place")</li>
                      <li>Amount</li>
                      <li>Category (Food, Transport, etc.)</li>
                      <li>Date (defaults to today)</li>
                    </ul>
                  </li>
                  <li>Choose who paid</li>
                  <li>Choose how to split (see below)</li>
                  <li>Click "Add Expense"</li>
                </ol>
              </Section>

              <Section title="Split Methods">
                <div className="space-y-3">
                  <div className="bg-teal-light dark:bg-primary-900/20 p-3 rounded-lg">
                    <strong>Equal Split</strong>
                    <p className="text-sm mt-1">Everyone pays the same amount. Example: $60 dinner split 3 ways = $20 each.</p>
                  </div>
                  <div className="bg-teal-light dark:bg-primary-900/20 p-3 rounded-lg">
                    <strong>Unequal Split (Custom Amounts)</strong>
                    <p className="text-sm mt-1">Set exact amounts for each person. Example: Alice $30, Bob $20, Carol $10.</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <strong>By Percentage</strong>
                    <p className="text-sm mt-1">Split by percentage. Example: 50% / 30% / 20% of $100 = $50 / $30 / $20.</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                    <strong>By Shares</strong>
                    <p className="text-sm mt-1">Split by shares/ratio. Example: 2:1:1 shares of $100 = $50 / $25 / $25.</p>
                  </div>
                </div>
              </Section>

              <Section title="How do I search for expenses?">
                <p>On the Dashboard, use the search box to find expenses by description. Try searching for "dinner", "uber", "groceries", etc.</p>
              </Section>

              <Section title="How do I filter expenses?">
                <p>Below the search box, you can filter by:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li><strong>Category</strong> - Food, Transport, Housing, etc.</li>
                  <li><strong>Member</strong> - See expenses paid by specific people</li>
                </ul>
              </Section>

              <Section title="Can I edit or delete expenses?">
                <p>Yes! Click on any expense in the list to open details, then:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Click <strong>Edit</strong> to modify</li>
                  <li>Click <strong>Delete</strong> to remove</li>
                </ul>
              </Section>

              <Section title="How do I export expenses?">
                <p>On the Dashboard, click the <strong>Export CSV</strong> button (next to Manage). This downloads all expenses as a spreadsheet.</p>
              </Section>
            </div>
          )}

          {activeTab === 'invites' && (
            <div className="space-y-6">
              <Section title="How do I invite someone? 📧">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Open a group → Click <strong>Manage</strong></li>
                  <li>Scroll to <strong>"📧 Invite by Email"</strong></li>
                  <li>Click <strong>"+ Invite Member"</strong></li>
                  <li>Enter their email address</li>
                  <li>Click "Send Invite"</li>
                </ol>
              </Section>

              <Section title="What happens after I send an invite?">
                <ul className="list-disc list-inside space-y-2">
                  <li>The invite is sent to their email address</li>
                  <li>It appears in the "Pending Invites" list in group management</li>
                  <li>When they sign up with that email, they'll see the invite</li>
                  <li>They can accept or decline</li>
                  <li>If accepted, they're automatically added to the group</li>
                </ul>
              </Section>

              <Section title="How do I accept an invite?">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Sign up or log in with the email that received the invite</li>
                  <li>Go to the <strong>Activity</strong> tab</li>
                  <li>You'll see pending invites at the top</li>
                  <li>Click <strong>Accept</strong> to join the group</li>
                  <li>Or click <strong>Decline</strong> if you don't want to join</li>
                </ol>
              </Section>

              <Section title={<>Can I invite someone who already uses Split<span className="text-primary">Bi</span>?</>}>
                <p className="mb-2">Yes! Just enter their email. They'll get a notification immediately and can accept right away.</p>
                <p className="text-sm text-primary dark:text-primary-400">✨ The system automatically detects existing users - no duplicates are created!</p>
              </Section>

              <Section title={<>What if they don't have a Split<span className="text-primary">Bi</span> account?</>}>
                <p>No problem! The invite will wait for them. When they sign up using the invited email address, they'll see the invite and can accept it.</p>
              </Section>

              <Section title="Do invites expire?">
                <p>Yes, invites expire after 7 days. If someone doesn't respond within a week, you'll need to send a new invite.</p>
              </Section>

              <Section title="Can I cancel an invite?">
                <p className="text-amber-600 dark:text-amber-400">Currently, you can't cancel pending invites. They will expire automatically after 7 days. (Feature coming soon!)</p>
              </Section>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <Section title="Is my data private? 🔐">
                <p className="font-semibold text-primary mb-2">Yes! Split<span className="text-primary">Bi</span> is privacy-first.</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>You can only see your own data and groups you're part of</li>
                  <li>No global user directory - no one can search for you</li>
                  <li>Guest users you create are only visible to you</li>
                  <li>Real users must accept invites - no forced adding</li>
                  <li>Your data is stored securely in Firebase</li>
                </ul>
              </Section>

              <Section title="Who can see my expenses?">
                <p>Only members of the same group can see expenses in that group. If you're not in a group, you can't see its expenses.</p>
              </Section>

              <Section title="Can anyone add me to a group?">
                <p className="mb-2"><strong>No!</strong> Someone can send you an invite, but:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>They need to know your exact email address</li>
                  <li>You receive the invite and can see who sent it</li>
                  <li><strong>You must accept</strong> before being added</li>
                  <li>You can decline invites you don't want</li>
                </ul>
              </Section>

              <Section title="What's the difference between my account and guest users?">
                <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg">
                  <p className="font-semibold mb-2">Your Account (Real User):</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>You control your own data</li>
                    <li>You can create groups</li>
                    <li>You can add expenses</li>
                    <li>Only you can access your account</li>
                    <li>You can accept/decline invites</li>
                  </ul>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mt-3">
                  <p className="font-semibold mb-2">Guest Users:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>No login required</li>
                    <li>Someone else manages their expenses</li>
                    <li>They never see Split<span className="text-primary">Bi</span></li>
                    <li>Only visible to the person who created them</li>
                    <li>No email or password needed</li>
                  </ul>
                </div>
              </Section>

              <Section title="Where is my data stored?">
                <p>Your data is securely stored in Google Firebase, a trusted cloud platform used by millions of apps worldwide.</p>
              </Section>

              <Section title="Can I delete my account?">
                <p className="text-amber-600 dark:text-amber-400">Account deletion is not yet available in the UI. Contact support if you need to delete your account. (Self-service deletion coming soon!)</p>
              </Section>

              <Section title="Do you sell my data?">
                <p className="font-bold text-primary">Absolutely not! Your data is yours. We don't sell, share, or monetize your personal information.</p>
              </Section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <div className="text-center space-y-3">
            {onRestartTour && (
              <button
                onClick={() => {
                  onClose();
                  onRestartTour();
                }}
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
              >
                <span>🎯</span>
                <span>Restart Quick Tour</span>
              </button>
            )}
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Still have questions? Use the <strong>💬 Send Feedback</strong> button to reach out!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for FAQ sections
const Section: React.FC<{ title: React.ReactNode; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-3 flex items-center">
      {title}
    </h3>
    <div className="text-text-secondary-light dark:text-text-secondary-dark space-y-2">
      {children}
    </div>
  </div>
);

export default HelpModal;

