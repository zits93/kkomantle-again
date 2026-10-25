import React from 'react';
import {
  Save, Undo, Redo, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Table,
  Percent, ChevronDown, SplitSquareVertical, Palette, Type
} from 'lucide-react';

export const ExcelRibbon: React.FC = () => {
  return (
    <div className="bg-[#f3f2f1] border-b border-[#d2d0ce] text-gray-800 text-xs select-none font-excel">
      {/* 1. Quick Access Bar & Top Tabs */}
      <div className="flex items-center justify-between border-b border-gray-300 bg-[#f3f2f1] px-2 pt-1 text-xs">
        <div className="flex items-center space-x-1">
          {/* Quick Access Icons */}
          <div className="flex items-center space-x-1 pr-2 border-r border-gray-300 text-gray-600">
            <button className="p-1 hover:bg-gray-200 rounded" title="저장 (Ctrl+S)"><Save className="w-3.5 h-3.5" /></button>
            <button className="p-1 hover:bg-gray-200 rounded" title="실행 취소 (Ctrl+Z)"><Undo className="w-3.5 h-3.5" /></button>
            <button className="p-1 hover:bg-gray-200 rounded" title="다시 실행 (Ctrl+Y)"><Redo className="w-3.5 h-3.5" /></button>
          </div>

          {/* Ribbon Tabs */}
          <span className="px-3 py-1 font-bold text-white bg-excel-header rounded-t text-xs">파일</span>
          <span className="px-3 py-1 font-semibold text-excel-header border-b-2 border-excel-header bg-white">홈</span>
          <span className="px-3 py-1 text-gray-600 hover:bg-gray-200 cursor-pointer">삽입</span>
          <span className="px-3 py-1 text-gray-600 hover:bg-gray-200 cursor-pointer">페이지 레이아웃</span>
          <span className="px-3 py-1 text-gray-600 hover:bg-gray-200 cursor-pointer">수식</span>
          <span className="px-3 py-1 text-gray-600 hover:bg-gray-200 cursor-pointer">데이터</span>
          <span className="px-3 py-1 text-gray-600 hover:bg-gray-200 cursor-pointer">검토</span>
          <span className="px-3 py-1 text-gray-600 hover:bg-gray-200 cursor-pointer">보기</span>
        </div>

        <div className="text-[11px] text-gray-500 pr-2">
          <span>통합 문서 자동 저장됨</span>
        </div>
      </div>

      {/* 2. Ribbon Action Toolbar */}
      <div className="flex items-center space-x-3 px-3 py-1.5 overflow-x-auto text-[11px] text-gray-700 bg-white">
        {/* Font Group */}
        <div className="flex items-center space-x-1 border-r border-gray-300 pr-3">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
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
            </div>
            <div className="flex items-center space-x-0.5">
              <button className="p-1 hover:bg-gray-200 rounded font-bold"><Bold className="w-3 h-3" /></button>
              <button className="p-1 hover:bg-gray-200 rounded italic"><Italic className="w-3 h-3" /></button>
              <button className="p-1 hover:bg-gray-200 rounded underline"><Underline className="w-3 h-3" /></button>
              <button className="p-1 hover:bg-gray-200 rounded"><Table className="w-3 h-3 text-gray-500" /></button>
              <button className="p-1 hover:bg-gray-200 rounded text-amber-500"><Palette className="w-3 h-3" /></button>
              <button className="p-1 hover:bg-gray-200 rounded text-red-600 font-bold"><Type className="w-3 h-3" /></button>
            </div>
          </div>
        </div>

        {/* Alignment Group */}
        <div className="flex items-center space-x-1 border-r border-gray-300 pr-3">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <button className="p-1 hover:bg-gray-200 rounded"><AlignLeft className="w-3 h-3" /></button>
              <button className="p-1 hover:bg-gray-200 rounded"><AlignCenter className="w-3 h-3" /></button>
              <button className="p-1 hover:bg-gray-200 rounded"><AlignRight className="w-3 h-3" /></button>
            </div>
            <button className="flex items-center space-x-1 text-[10px] px-1.5 py-0.5 hover:bg-gray-200 rounded border border-gray-200">
              <SplitSquareVertical className="w-3 h-3" />
              <span>병합하고 가운데 맞춤</span>
            </button>
          </div>
        </div>

        {/* Number Group */}
        <div className="flex items-center space-x-2 border-r border-gray-300 pr-3">
          <div className="flex flex-col space-y-1">
            <select className="border border-gray-300 rounded px-1.5 py-0.5 bg-white text-xs" defaultValue="백분율">
              <option>일반</option>
              <option>숫자</option>
              <option>통화</option>
              <option>백분율</option>
            </select>
            <div className="flex items-center space-x-1">
              <button className="px-1.5 py-0.5 hover:bg-gray-200 rounded font-mono font-bold text-xs">%</button>
              <button className="px-1.5 py-0.5 hover:bg-gray-200 rounded font-mono font-bold text-xs">,</button>
              <button className="px-1 py-0.5 hover:bg-gray-200 rounded font-mono text-[10px]">.0</button>
              <button className="px-1 py-0.5 hover:bg-gray-200 rounded font-mono text-[10px]">.00</button>
            </div>
          </div>
        </div>

        {/* Styles Group */}
        <div className="flex items-center space-x-1">
          <button className="px-2 py-1 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded text-xs flex items-center space-x-1">
            <span>조건부 서식</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
