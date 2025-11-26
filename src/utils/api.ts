import { Report } from '../types/report';

export async function callImageAnalysisApi(imageFile: File): Promise<Report> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dummyReport: Report = {
        classification: 'SIMカード（通信機器関連）',
        extractedFields: [
          { label: 'IMEI番号', value: '352468091234567' },
          { label: 'シリアル番号', value: 'SN-4829-JK-9012' },
          { label: '製造元', value: 'Samsung Electronics' },
          { label: '検出言語', value: '英語、韓国語' }
        ],
        translatedSummary: '通信機器のSIMカードと思われる物品。英語と韓国語の記載あり。主な内容は製品仕様と識別番号。不審な改造の痕跡は確認されず。',
        relatedDocuments: ['通信記録照会書', '携帯端末解析報告書', '国際捜査協力依頼書', '電子機器押収調書']
      };
      resolve(dummyReport);
    }, 2000);
  });
}

export async function submitReport(report: Report, memo: string, imageUrl: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('レポート送信:', { report, memo, imageUrl, timestamp: new Date().toISOString() });
      resolve();
    }, 1000);
  });
}
