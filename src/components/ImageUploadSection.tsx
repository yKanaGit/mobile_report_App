import { Upload, X } from 'lucide-react';

interface ImageUploadSectionProps {
  previewUrl: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
}

export function ImageUploadSection({ previewUrl, onImageSelect, onImageRemove }: ImageUploadSectionProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <section className="bg-white p-4 border-b border-gray-200">
      <h2 className="text-base font-semibold text-gray-800 mb-3">画像アップロード</h2>

      {!previewUrl ? (
        <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-1">ここに事件現場の写真をアップロード</p>
          <p className="text-xs text-gray-500">タップして写真を選択</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="relative">
          <img
            src={previewUrl}
            alt="アップロード画像"
            className="w-full rounded-lg border border-gray-300"
          />
          <button
            onClick={onImageRemove}
            className="absolute top-2 right-2 bg-slate-800 text-white p-2 rounded-full shadow-lg hover:bg-slate-700 transition-colors"
            aria-label="画像を削除"
          >
            <X className="w-5 h-5" />
          </button>
          <label className="block mt-3">
            <span className="block w-full text-center py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors">
              別の写真に変更
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </section>
  );
}
