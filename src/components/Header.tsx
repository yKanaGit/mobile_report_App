import { Camera } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-slate-800 text-white px-4 py-6 shadow-md">
      <div className="flex items-center gap-3 mb-2">
        <Camera className="w-7 h-7" />
        <h1 className="text-xl font-bold">現場画像AI・翻訳レポート</h1>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">
        現場写真をアップロードしてAIが簡易レポートを自動生成します
      </p>
    </header>
  );
}
