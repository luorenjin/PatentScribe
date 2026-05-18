import React from 'react';
import { motion } from 'motion/react';
import { WorkbenchRecord } from '../types/patent';
import { FileText, Trash2, ExternalLink, Calendar, Search, Tag, Archive } from 'lucide-react';

interface WorkbenchProps {
  records: WorkbenchRecord[];
  onLoad: (record: WorkbenchRecord) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  onOpenSettings: () => void;
  hasActiveSession?: boolean;
}

export function Workbench({ records, onLoad, onDelete, onBack, onOpenSettings, hasActiveSession }: WorkbenchProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredRecords = records.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Archive className="text-indigo-600" size={28} />
              工作台
            </h2>
            <p className="text-gray-500 mt-1">存储、管理及快速检索已优化的专利交底书</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            {hasActiveSession ? '返回会话' : '返回首页'}
          </button>
        </div>

        {/* Stats & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">总计记录</div>
            <div className="text-2xl font-bold text-indigo-600">{records.length}</div>
          </div>
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="通过标题搜索已存记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Records List */}
        <div className="space-y-4">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white group border border-gray-100 rounded-xl p-5 flex items-center gap-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileText size={24} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                    {record.title || "未命名技术方案"}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                      <Calendar size={12} />
                      {new Date(record.timestamp).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-indigo-400 font-bold uppercase tracking-wider">
                      <Tag size={12} />
                      已优化
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onLoad(record)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    <ExternalLink size={14} />
                    打开
                  </button>
                  <div className="relative flex items-center">
                    <button
                      onClick={(e) => {
                        const target = e.currentTarget.nextElementSibling;
                        if (target) target.classList.toggle('hidden');
                      }}
                      className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="hidden absolute right-0 top-full mt-2 bg-white shadow-xl border border-gray-100 rounded-lg p-2 z-10 flex gap-2 w-max">
                      <button
                        onClick={() => onDelete(record.id)}
                        className="px-3 py-1 bg-rose-600 text-white text-[10px] font-bold rounded hover:bg-rose-700 transition-colors"
                      >
                        确认删除
                      </button>
                      <button
                        onClick={(e) => (e.currentTarget.parentElement as HTMLElement).classList.add('hidden')}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded hover:bg-gray-200 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Archive className="text-gray-300" size={32} />
              </div>
              <h3 className="text-gray-400 font-medium">暂无工作记录</h3>
              <p className="text-gray-300 text-sm mt-1">优化的专利交底书将会出现在这里</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
