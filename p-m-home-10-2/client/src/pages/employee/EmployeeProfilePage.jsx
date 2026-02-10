import { useState } from 'react';
import { getSession, setSession } from '../../store/sessionStore.js';
import { useDataStore } from '../../store/dataStore.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { User, Mail, Building, Users, Save } from 'lucide-react';

export function EmployeeProfilePage() {
  const storedSession = getSession();
  const { state, updateUser } = useDataStore();
  const [session, setSessionState] = useState(storedSession);
  const [firstName, setFirstName] = useState(storedSession?.name?.split(' ')[0] ?? '');
  const [lastName, setLastName] = useState(storedSession?.name?.split(' ').slice(1).join(' ') ?? '');
  const [email, setEmail] = useState(storedSession?.email ?? '');
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!session) return null;

  const currentUser = state.users?.find((u) => u.id === session.userId) || null;

  const handleSave = async () => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirst && !trimmedLast) {
      setErrorMessage('Please enter at least a first or last name.');
      setSaveMessage('');
      return;
    }

    const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      setSaveMessage('');
      return;
    }

    const updatedName = `${trimmedFirst} ${trimmedLast}`.trim() || session.name;

    if (currentUser) {
      await updateUser(currentUser.id, {
        name: updatedName,
        email: trimmedEmail,
      });
    }

    const updatedSession = {
      ...session,
      name: updatedName,
      email: trimmedEmail,
    };

    setSession(updatedSession);
    setSessionState(updatedSession);
    setErrorMessage('');
    setSaveMessage('Profile updated successfully.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary)] to-[var(--purple)] rounded-full flex items-center justify-center text-[var(--primary-fg)] font-bold text-lg">
              {session.name?.charAt(0)?.toUpperCase() ?? 'E'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--fg)]">Profile Information</h3>
              <p className="text-sm text-[var(--fg-muted)]">Update your personal information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={firstName}
                placeholder="Enter first name"
                leftIcon={User}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Last Name"
                value={lastName}
                placeholder="Enter last name"
                leftIcon={User}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <Input
              label="Email Address"
              value={email}
              placeholder="Enter email address"
              leftIcon={Mail}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Role"
              value="Employee"
              leftIcon={Users}
              disabled
            />

            <Input
              label="Department"
              value={currentUser?.department || session.department || 'Development'}
              leftIcon={Building}
              disabled
            />

            <div className="pt-4">
              <Button variant="primary" className="w-full" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              {errorMessage && (
                <p className="text-xs text-[var(--danger)] mt-2 text-center">
                  {errorMessage}
                </p>
              )}
              {saveMessage && (
                <p className="text-xs text-[var(--fg-muted)] mt-2 text-center">
                  {saveMessage}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Account Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--success)] to-[var(--teal)] rounded-full flex items-center justify-center text-[var(--success-fg)]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--fg)]">Account Settings</h3>
              <p className="text-sm text-[var(--fg-muted)]">Manage your account preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-[var(--info-light)] rounded-lg border border-[var(--info-muted)]">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-[var(--info)] mt-0.5" />
                <div>
                  <h4 className="font-medium text-[var(--info-muted-fg)]">Employee Access</h4>
                  <p className="text-sm text-[var(--info-muted-fg)] mt-1">
                    You have access to your assigned projects, tasks, and team collaboration features.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[var(--success-light)] rounded-lg border border-[var(--success-muted)]">
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-[var(--success)] mt-0.5" />
                <div>
                  <h4 className="font-medium text-[var(--success-muted-fg)]">Department</h4>
                  <p className="text-sm text-[var(--success-muted-fg)] mt-1">
                    {session.department || 'Development'} - Project Management Enterprise
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[var(--purple-light)] rounded-lg border border-[var(--purple-muted)]">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-[var(--purple-fg)] mt-0.5" />
                <div>
                  <h4 className="font-medium text-[var(--purple-fg)]">Team Member</h4>
                  <p className="text-sm text-[var(--purple-fg)] mt-1">
                    Active member of the project management team with full access to assigned work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}