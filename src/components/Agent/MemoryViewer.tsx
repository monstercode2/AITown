import React from 'react';
import { Memory, ImportanceLevel } from '@/types/memory';

interface MemoryViewerProps {
  memories: Memory[];
  onClose: () => void;
}

export const MemoryViewer: React.FC<MemoryViewerProps> = ({ memories, onClose }) => {
  // 按时间戳排序记忆
  const sortedMemories = [...memories].sort((a, b) => b.timestamp - a.timestamp);

  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // 获取记忆重要性的颜色
  const getImportanceColor = (importance: ImportanceLevel) => {
    switch (importance) {
      case ImportanceLevel.CRITICAL:
        return 'bg-red-100 border-red-500';
      case ImportanceLevel.HIGH:
        return 'bg-orange-100 border-orange-500';
      case ImportanceLevel.MEDIUM:
        return 'bg-yellow-100 border-yellow-500';
      case ImportanceLevel.LOW:
        return 'bg-blue-100 border-blue-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">记忆列表</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            关闭
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="space-y-4">
            {sortedMemories.map((memory) => (
              <div
                key={memory.id}
                className={`p-4 border-l-4 rounded ${getImportanceColor(memory.importance)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-500">
                    {formatTimestamp(memory.timestamp)}
                  </span>
                  <span className="text-sm font-medium px-2 py-1 rounded bg-gray-200">
                    重要性: {memory.importance}
                  </span>
                </div>
                <p className="text-gray-800">{memory.content}</p>
                {memory.emotion && (
                  <p className="text-sm text-gray-600 mt-2">
                    情感: {memory.emotion}
                  </p>
                )}
                {memory.tags && memory.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {memory.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 