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
      <div className="flex items-center space-x-3 px-3 py-1.5 overflow-x-auto text-[11px] text-gray-700 bg-white select-none">
        {/* Font Group */}
        <div className="flex items-center space-x-1 border-r border-gray-300 pr-3">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <div className="border border-gray-300 rounded px-1.5 py-0.5 bg-white text-xs text-gray-700 w-20 truncate">
                맑은 고딕
              </div>
              <div className="border border-gray-300 rounded px-1.5 py-0.5 bg-white text-xs text-gray-700 w-10 text-center">
                11
              </div>
            </div>
            <div className="flex items-center space-x-0.5">
              <button type="button" className="p-1 hover:bg-gray-200 rounded font-bold cursor-default" title="굵게"><Bold className="w-3 h-3" /></button>
              <button type="button" className="p-1 hover:bg-gray-200 rounded italic cursor-default" title="기울임꼴"><Italic className="w-3 h-3" /></button>
              <button type="button" className="p-1 hover:bg-gray-200 rounded underline cursor-default" title="밑줄"><Underline className="w-3 h-3" /></button>
              <button type="button" className="p-1 hover:bg-gray-200 rounded cursor-default" title="테두리"><Table className="w-3 h-3 text-gray-500" /></button>
              <button type="button" className="p-1 hover:bg-gray-200 rounded text-amber-500 cursor-default" title="채우기 색"><Palette className="w-3 h-3" /></button>
              <button type="button" className="p-1 hover:bg-gray-200 rounded text-red-600 font-bold cursor-default" title="글꼴 색"><Type className="w-3 h-3" /></button>
            </div>
          </div>
        </div>

        {/* Alignment Group */}
        <div className="flex items-center space-x-1 border-r border-gray-300 pr-3">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <button type="button" className="p-1 hover:bg-gray-200 rounded cursor-default" title="왼쪽 맞춤"><AlignLeft className="w-3 h-3" /></button>
              <button type="button" className="p-1 hover:bg-gray-200 rounded cursor-default" title="가운데 맞춤"><AlignCenter className="w-3 h-3" /></button>
              <button type="button" className="p-1 hover:bg-gray-200 rounded cursor-default" title="오른쪽 맞춤"><AlignRight className="w-3 h-3" /></button>
            </div>
            <button type="button" className="flex items-center space-x-1 text-[10px] px-1.5 py-0.5 hover:bg-gray-200 rounded border border-gray-200 cursor-default">
              <SplitSquareVertical className="w-3 h-3" />
              <span>병합하고 가운데 맞춤</span>
            </button>
          </div>
        </div>

        {/* Number Group */}
        <div className="flex items-center space-x-2 border-r border-gray-300 pr-3">
          <div className="flex flex-col space-y-1">
            <div className="border border-gray-300 rounded px-1.5 py-0.5 bg-white text-xs text-gray-700 w-16 text-center">
              백분율
            </div>
            <div className="flex items-center space-x-1">
              <button type="button" className="px-1.5 py-0.5 hover:bg-gray-200 rounded font-mono font-bold text-xs cursor-default">%</button>
              <button type="button" className="px-1.5 py-0.5 hover:bg-gray-200 rounded font-mono font-bold text-xs cursor-default">,</button>
              <button type="button" className="px-1 py-0.5 hover:bg-gray-200 rounded font-mono text-[10px] cursor-default">.0</button>
              <button type="button" className="px-1 py-0.5 hover:bg-gray-200 rounded font-mono text-[10px] cursor-default">.00</button>
            </div>
          </div>
        </div>

        {/* Styles Group */}
        <div className="flex items-center space-x-1">
          <button type="button" className="px-2 py-1 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded text-xs flex items-center space-x-1 cursor-default">
            <span>조건부 서식</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
