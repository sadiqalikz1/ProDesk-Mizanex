import AppLinks from '@/components/app-links';
import TaskManager from '@/components/task-manager';
import NotePad from '@/components/note-pad';
import QuickView from '@/components/quick-view';
import AiAssistant from '@/components/ai-assistant';
import Header from '@/components/header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto grid gap-6 grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <AppLinks />
            <NotePad />
          </div>
          <div className="lg:col-span-8 space-y-6">
            <TaskManager />
            <QuickView />
          </div>
          <div className="lg:col-span-12">
            <AiAssistant />
          </div>
        </div>
      </main>
    </div>
  );
}
