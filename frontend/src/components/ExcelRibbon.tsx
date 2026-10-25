import React from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Table } from 'lucide-react';

export const ExcelRibbon: React.FC = () => {
  return (
    <div className="bg-excel-ribbon border-b border-excel-ribbonBorder text-gray-800 text-xs select-none">
      {/* Excel Ribbon Top Tabs */}
      <div className="flex space-x-1 px-2 pt-1 border-b border-gray-300 bg-gray-100 text-xs">
        <span className="px-3 py-1 font-semibold text-excel-header border-b-2 border-excel-header bg-white">홈</span>
        <span className="px-3 py-1 text-gray-600 hover:bg-gray-200 cursor-pointer">삽입</span>
        <span className="px-3 py-1 text-gray-600 hover:bg-gray-200 cursor-pointer">페이지 레이아웃</span>
        <span className="px-3 py-1 text-gray-600 hover:bg-gray-200 cursor-pointer">수식</span>
        <span className="px-3 py-1 text-gray-600 hover:bg-gray-200 cursor-pointer">데이터</span>
        <span className="px-3 py-1 text-gray-600 hover:bg-gray-200 cursor-pointer">검토</span>
        <span className="px-3 py-1 text-gray-600 hover:bg-gray-200 cursor-pointer">보기</span>
      </div>

      {/* Excel Ribbon Action Tools */}
      <div className="flex items-center space-x-4 px-4 py-1.5 overflow-x-auto text-[11px] text-gray-700">
        <div className="flex items-center space-x-1 border-r border-gray-300 pr-3">
          <select className="border border-gray-300 rounded px-1.5 py-0.5 bg-white text-xs" defaultValue="맑은 고딕">
            <option>맑은 고딕</option>
            <option>Calibri</option>
            <option>Aptos</option>
          </select>
          <select className="border border-gray-300 rounded px-1.5 py-0.5 bg-white text-xs" defaultValue="11">
            <option>9</option>
            <option>10</option>
            <option>11</option>
            <option>12</option>
          </select>
          <button className="p-1 hover:bg-gray-300 rounded"><Bold className="w-3.5 h-3.5" /></button>
          <button className="p-1 hover:bg-gray-300 rounded"><Italic className="w-3.5 h-3.5" /></button>
          <button className="p-1 hover:bg-gray-300 rounded"><Underline className="w-3.5 h-3.5" /></button>
        </div>

        <div className="flex items-center space-x-1 border-r border-gray-300 pr-3">
          <button className="p-1 hover:bg-gray-300 rounded"><AlignLeft className="w-3.5 h-3.5" /></button>
          <button className="p-1 hover:bg-gray-300 rounded"><AlignCenter className="w-3.5 h-3.5" /></button>
          <button className="p-1 hover:bg-gray-300 rounded"><AlignRight className="w-3.5 h-3.5" /></button>
          <button className="p-1 hover:bg-gray-300 rounded"><Table className="w-3.5 h-3.5" /></button>
        </div>

        <div className="text-[11px] text-gray-500 font-sans">
          <span>문서 자동 저장됨 (클라우드 동기화 중)</span>
        </div>
      </div>
    </div>
  );
};
