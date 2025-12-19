import React from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface OnboardingTourProps {
  run: boolean;
  onFinish: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onFinish }) => {
  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            🧭 Welcome to Split<span className="text-primary">Bi</span>
          </h2>
          <p className="text-gray-700 mb-4">
            Let's take a quick tour to show you how easy it is to split expenses with friends and family.
          </p>
          <p className="text-sm text-gray-600">
            This will only take 30 seconds! ⏱️
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="groups-tab"]',
      content: (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            🗂️ Step 1: Create Groups
          </h3>
          <p className="text-gray-700">
            Start by creating a group for roommates, trips, or any shared expenses. 
            Tap here to create your first group!
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '[data-tour="profile-tab"]',
      content: (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            👤 Step 2: Add People
          </h3>
          <p className="text-gray-700 mb-3">
            Add people in two ways:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-3">
            <li>• <strong>Guest users</strong> - No login needed, you manage everything</li>
            <li>• <strong>Email invites</strong> - They get their own account</li>
          </ul>
          <p className="text-gray-700">
            Tap here to add your first person! You'll need people to split expenses with.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '[data-tour="add-expense-button"]',
      content: (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            ➕ Step 3: Add Expenses
          </h3>
          <p className="text-gray-700">
            Click this big + button anytime to add an expense. 
            Choose how to split it - equally, by percentage, or custom amounts!
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '[data-tour="dashboard-tab"]',
      content: (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            📈 Step 4: View Balances
          </h3>
          <p className="text-gray-700">
            Your Dashboard shows who owes what in real-time. 
            Split<span className="text-primary">Bi</span> automatically calculates and simplifies all debts!
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            ✅ You're All Set
          </h2>
          <p className="text-gray-700 mb-4">
            Ready to start splitting expenses? Create your first group to get started!
          </p>
          <p className="text-sm text-gray-600 mb-3">
            💡 Tip: Click <strong>"❓ Help & FAQ"</strong> at the bottom anytime for detailed guides.
          </p>
          <p className="text-xs text-gray-500">
            Happy splitting! 🎉
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#14B8A6',
          textColor: '#333',
          backgroundColor: '#fff',
          arrowColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        buttonNext: {
          backgroundColor: '#14B8A6',
          fontSize: 14,
          fontWeight: 600,
          padding: '10px 20px',
          borderRadius: '8px',
        },
        buttonBack: {
          color: '#666',
          fontSize: 14,
          marginRight: 10,
        },
        buttonSkip: {
          color: '#999',
          fontSize: 13,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
          fontSize: '15px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipContent: {
          padding: '10px 0',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
};

export default OnboardingTour;

