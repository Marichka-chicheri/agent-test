import React, { useState } from 'react';
import { Settings, Save, Wrench, Database, Sparkles, ChevronRight } from 'lucide-react';

const CreateAgent = () => {
  const [config, setConfig] = useState({
    name: '',
    description: '',
    instructions: '',
    model: 'gpt-4-o',
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Header */}
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Sparkles className="text-white" size={20} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Налаштування Агента</h1>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
            <Save size={18} /> Зберегти
          </button>
        </header>

        <div className="p-8 space-y-8">
          {/* Секція: Основне */}
          <section className="space-y-5">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs uppercase tracking-widest">
              <Settings size={14} /> Основні параметри
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold">Назва агента</label>
              <input
                type="text"
                placeholder="Наприклад: Менеджер підтримки"
                className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white"
                value={config.name}
                onChange={(e) => setConfig({...config, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold">Інструкції (System Prompt)</label>
              <textarea
                rows="8"
                placeholder="Опишіть роль агента: 'Ти професійний асистент...'"
                className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition bg-slate-50 focus:bg-white"
                value={config.instructions}
                onChange={(e) => setConfig({...config, instructions: e.target.value})}
              />
            </div>
          </section>

          {/* Секція: Модель */}
          <section className="space-y-5 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs uppercase tracking-widest">
              Модель та Інструменти
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Оберіть модель</label>
                <select className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none">
                  <option>GPT-4o</option>
                  <option>Claude 3.5 Sonnet</option>
                  <option>Llama 3.1</option>
                </select>
              </div>
            </div>

            {/* Buttons for Tools */}
            <div className="grid grid-cols-1 gap-3">
              <button className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:bg-orange-200">
                    <Wrench size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">Додати інструменти (Tools)</div>
                    <div className="text-xs text-slate-500">Пошук, калькулятор, API</div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>

              <button className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600 group-hover:bg-green-200">
                    <Database size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">База знань (Knowledge)</div>
                    <div className="text-xs text-slate-500">Завантажити PDF або TXT</div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            </div>
          </section>
        </div>

        <footer className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">Студія створення агентів v1.0 • Хакатон 2026</p>
        </footer>
      </div>
    </div>
  );
};

export default CreateAgent;
