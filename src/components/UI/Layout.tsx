import React from 'react';
import { Sidebar } from '@/components/UI/Sidebar';
import { Controls } from '@/components/UI/Controls';
import TimeDisplay from '@/components/UI/TimeDisplay';
import EventLog from '@/components/Event/EventLog';
import { useEventStore } from '@/store/eventStore';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * 布局组件
 * 负责组织整个应用的界面结构
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const events = useEventStore(state => state.events);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 左侧边栏 */}
      <Sidebar className="w-64 h-full" />

      {/* 主要内容区域 */}
      <main className="flex-1 flex flex-col">
        {/* 顶部控制栏 */}
        <div className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <TimeDisplay />
          <Controls />
        </div>

        {/* 内容区域 */}
        <div className="flex-1 p-6 flex">
          {/* 游戏主画面 */}
          <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
            {children}
          </div>

          {/* 右侧事件日志 */}
          <div className="w-96 ml-6">
            <EventLog events={events} maxDisplayCount={20} />
          </div>
        </div>
      </main>

      {/* 事件通知会以绝对定位的方式显示在右上角 */}
    </div>
  );
};

export default Layout; 