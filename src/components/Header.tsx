import { Camera } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-slate-800 text-white px-4 py-6 shadow-md">
      <div className="flex items-center gap-3 mb-2">
        <Camera className="w-7 h-7" />
        <h1 className="text-xl font-bold">スマート証拠記録</h1>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">
        撮影写真をAIで解析し、証拠情報を自動で抽出・翻訳・整理する証拠管理アプリです。撮影するだけでレポートまで作成できます。
      </p>
    </header>
  );
}
