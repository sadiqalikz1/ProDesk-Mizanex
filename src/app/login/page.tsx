
import LoginForm from '@/components/login-form';
import { BriefcaseBusiness, FileArchive, LayoutGrid, Settings, Users } from 'lucide-react';

const features = [
    {
      name: 'Task Manager',
      description: 'Organize your daily duties.',
      icon: BriefcaseBusiness,
    },
    {
      name: 'Physical File Tracker',
      description: 'Manage and locate physical documents.',
      icon: FileArchive,
    },
    {
      name: 'Storage Management',
      description: 'Visualize and build storage layouts.',
      icon: LayoutGrid,
    },
    {
      name: 'Team Workspace',
      description: 'Collaborate with your team.',
      icon: Users,
    },
    {
      name: 'Settings',
      description: 'Customize your application.',
      icon: Settings,
    },
];

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 animated-gradient z-0" />
      <div className="absolute -top-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -bottom-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-purple-500/20 blur-3xl" />
      
      <main className="z-10 w-full max-w-4xl lg:max-w-5xl">
        <div className="flex rounded-2xl bg-white/30 shadow-2xl backdrop-blur-lg overflow-hidden">
          {/* Left Side */}
          <div className="hidden w-1/2 flex-col justify-between bg-primary/80 p-8 text-white lg:flex">
            <div>
                 <div className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-8 w-8 text-white" />
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                    ProDesk
                    </h1>
                </div>
                <p className="mt-4 text-primary-foreground/80">
                    A streamlined office productivity dashboard to manage common tasks and documents.
                </p>
                <div className="mt-10 space-y-8">
                {features.map((feature) => (
                    <div key={feature.name} className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                        <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold">{feature.name}</h3>
                        <p className="mt-1 text-sm text-primary-foreground/80">{feature.description}</p>
                    </div>
                    </div>
                ))}
                </div>
            </div>
            <p className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} ProDesk Inc.</p>
          </div>

          {/* Right Side - Form */}
          <div className="w-full lg:w-1/2 p-6 sm:p-8 flex items-center justify-center">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}
