import HomeSidebar from "@/components/layout/sidebar";
import { NotificationList } from "@/components/notify/notification-list";

export default function NotifyPage() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#170C06] lg:gap-4 lg:p-4">
      <HomeSidebar />
      <main className="flex-1 flex flex-col text-white p-4 pb-24 lg:p-0 lg:pb-0">
        <div className="flex-1 bg-[#1B0F08] rounded-lg p-4 sm:p-6 flex flex-col">
          <NotificationList />
        </div>
      </main>
    </div>
  );
}
