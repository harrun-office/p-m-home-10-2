import { getSession } from '../../store/sessionStore.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { User, Mail, Building, Users, Save } from 'lucide-react';

export function EmployeeProfilePage() {
  const session = getSession();

  if (!session) return null;

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
                value={session.name?.split(' ')[0] || ''}
                placeholder="Enter first name"
                leftIcon={User}
                disabled
              />
              <Input
                label="Last Name"
                value={session.name?.split(' ').slice(1).join(' ') || ''}
                placeholder="Enter last name"
                leftIcon={User}
                disabled
              />
            </div>

            <Input
              label="Email Address"
              value={session.email || ''}
              placeholder="Enter email address"
              leftIcon={Mail}
              disabled
            />

            <Input
              label="Role"
              value="Employee"
              leftIcon={Users}
              disabled
            />

            <Input
              label="Department"
              value={session.department || 'Development'}
              leftIcon={Building}
              disabled
            />

            <div className="pt-4">
              <Button variant="primary" className="w-full" disabled>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <p className="text-xs text-[var(--fg-muted)] mt-2 text-center">
                Profile editing is disabled in demo mode
              </p>
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