import React, { useState, useRef, useEffect } from 'react';
import { GuessItem } from '../types/game';
import { Check, X, Plus, ChevronLeft, ChevronRight, Sliders, Maximize2 } from 'lucide-react';

interface ExcelViewProps {
  myGuesses: GuessItem[];
  allGuesses: GuessItem[];
  currentNickname: string;
  onSubmitWord: (word: string) => void;
  disabled?: boolean;
}

export const ExcelView: React.FC<ExcelViewProps> = ({
  myGuesses,
  allGuesses,
  currentNickname,
  onSubmitWord,
  disabled,
}) => {
  const [activeSheet, setActiveSheet] = useState<'all' | 'mine'>('all');
  const [selectedCell, setSelectedCell] = useState<{ col: string; row: number }>({ col: 'C', row: 2 });
  const [inputFormula, setInputFormula] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayList = activeSheet === 'all' ? allGuesses : myGuesses;

  // Real Excel Column letters: A through K
  const columns = [
    { key: 'A', name: '순번', width: 'w-16' },
    { key: 'B', name: '담당자', width: 'w-28' },
    { key: 'C', name: '분석단어', width: 'w-44' },
    { key: 'D', name: '유사도(%)', width: 'w-28 text-right' },
    { key: 'E', name: '판정결과', width: 'w-28 text-center' },
    { key: 'F', name: '추정순위', width: 'w-24 text-center' },
    { key: 'G', name: '상태비고', width: 'w-32 text-center' },
    { key: 'H', name: '', width: 'w-28' },
    { key: 'I', name: '', width: 'w-28' },
    { key: 'J', name: '', width: 'w-32' },
    { key: 'K', name: '', width: 'w-36' },
  ];

  // Calculate Excel statistics for bottom status bar
  const stats = React.useMemo(() => {
    if (displayList.length === 0) return { avg: 0, count: 0, max: 0 };
    const sum = displayList.reduce((acc, cur) => acc + cur.similarity, 0);
    const max = Math.max(...displayList.map(g => g.similarity));
    return {
      avg: Number((sum / displayList.length).toFixed(1)),
      count: displayList.length,
      max: Number(max.toFixed(1))
    };
  }, [displayList]);

  const handleFormulaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputFormula.trim();
    if (!trimmed || disabled) return;
    onSubmitWord(trimmed);
    setInputFormula('');
  };

  const handleCellClick = (col: string, row: number) => {
    setSelectedCell({ col, row });
    if (col === 'C') {
      inputRef.current?.focus();
    }
  };

  // Generate 32 total rows so the entire screen is filled like a real spreadsheet
  const totalRowsCount = Math.max(displayList.length + 15, 32);
  const rows = Array.from({ length: totalRowsCount }, (_, i) => i + 1);

  return (
    <div className="flex-1 flex flex-col bg-white text-gray-900 select-none overflow-hidden font-excel">
      {/* 1. Excel Formula Bar (fx) */}
      <div className="bg-white border-b border-gray-300 px-2 py-1 flex items-center space-x-1.5 text-xs">
        {/* Name Box */}
        <div className="w-20 bg-white border border-gray-300 px-2 py-1 text-center font-mono text-gray-800 text-xs shadow-inner">
          {selectedCell.col}{selectedCell.row}
        </div>

        {/* Cancel / Enter Buttons */}
        <div className="flex items-center space-x-0.5 text-gray-400">
          <button
            type="button"
            onClick={() => setInputFormula('')}
            className="p-1 hover:text-red-600 hover:bg-gray-100 rounded"
            title="취소 (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleFormulaSubmit}
            className="p-1 hover:text-green-600 hover:bg-gray-100 rounded"
            title="입력 (Enter)"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* fx symbol */}
        <div className="font-serif italic font-bold text-gray-500 text-sm px-1.5 border-r border-gray-300">
          fx
        </div>

        {/* Formula Input */}
        <form onSubmit={handleFormulaSubmit} className="flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputFormula}
            onChange={e => setInputFormula(e.target.value)}
            placeholder="단어를 입력하여 유사도를 분석하십시오 (Enter 제출)"
            disabled={disabled}
            className="w-full px-2 py-1 text-xs outline-none bg-transparent font-sans text-black"
          />
        </form>
      </div>

      {/* 2. Full-Screen Excel Spreadsheet Grid */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse text-xs">
          {/* Column Header Letters: A, B, C, D, E... */}
          <thead className="sticky top-0 z-20 bg-[#f3f2f1]">
            <tr>
              {/* Select All Corner Box */}
              <th className="w-12 h-6 border-r border-b border-gray-300 bg-[#e1dfdd] text-center font-normal text-gray-500 text-[10px]">
                ◢
              </th>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`h-6 border-r border-b border-gray-300 text-center font-normal text-gray-700 text-xs px-2 ${col.width}`}
                >
                  {col.key}
                </th>
              ))}
            </tr>
          </thead>

          {/* Grid Rows: 1, 2, 3, 4 ... 35 */}
          <tbody>
            {rows.map(rowNum => {
              const isHeaderRow = (rowNum === 1);
              const dataIndex = rowNum - 2;
              const item: GuessItem | undefined = !isHeaderRow ? displayList[dataIndex] : undefined;

              return (
                <tr key={rowNum} className="h-6 leading-6">
                  {/* Row Number Header Gutter */}
                  <td className="w-12 border-r border-b border-gray-300 bg-[#f3f2f1] text-center font-normal text-gray-600 text-xs select-none">
                    {rowNum}
                  </td>

                  {/* Row 1: Formal Excel Table Headers */}
                  {isHeaderRow ? (
                    <>
                      <td className="border-r border-b border-gray-300 bg-[#eef2f7] px-2 font-semibold text-gray-700 text-xs text-center">순번</td>
                      <td className="border-r border-b border-gray-300 bg-[#eef2f7] px-2 font-semibold text-gray-700 text-xs">담당자</td>
                      <td className="border-r border-b border-gray-300 bg-[#eef2f7] px-2 font-semibold text-gray-700 text-xs">분석어휘</td>
                      <td className="border-r border-b border-gray-300 bg-[#eef2f7] px-2 font-semibold text-gray-700 text-xs text-right">유사도(%)</td>
                      <td className="border-r border-b border-gray-300 bg-[#eef2f7] px-2 font-semibold text-gray-700 text-xs text-center">판정결과</td>
                      <td className="border-r border-b border-gray-300 bg-[#eef2f7] px-2 font-semibold text-gray-700 text-xs text-center">추정순위</td>
                      <td className="border-r border-b border-gray-300 bg-[#eef2f7] px-2 font-semibold text-gray-700 text-xs text-center">상태비고</td>
                      <td className="border-r border-b border-gray-300 bg-[#eef2f7] px-2"></td>
                      <td className="border-r border-b border-gray-300 bg-[#eef2f7] px-2"></td>
                      <td className="border-r border-b border-gray-300 bg-[#eef2f7] px-2"></td>
                      <td className="border-r border-b border-gray-300 bg-[#eef2f7] px-2"></td>
                    </>
                  ) : item ? (
                    /* Data Rows */
                    <>
                      {/* A: ID */}
                      <td
                        onClick={() => handleCellClick('A', rowNum)}
                        className={`border-r border-b border-gray-300 px-2 font-mono text-center text-gray-500 text-xs ${
                          selectedCell.col === 'A' && selectedCell.row === rowNum ? 'outline outline-2 outline-[#107c41] z-10' : ''
                        }`}
                      >
                        {dataIndex + 1}
                      </td>

                      {/* B: User */}
                      <td
                        onClick={() => handleCellClick('B', rowNum)}
                        className={`border-r border-b border-gray-300 px-2 truncate text-xs ${
                          item.nickname === currentNickname ? 'font-semibold text-emerald-800' : 'text-gray-800'
                        } ${selectedCell.col === 'B' && selectedCell.row === rowNum ? 'outline outline-2 outline-[#107c41] z-10' : ''}`}
                      >
                        {item.nickname} {item.nickname === currentNickname && '(나)'}
                      </td>

                      {/* C: Word */}
                      <td
                        onClick={() => handleCellClick('C', rowNum)}
                        className={`border-r border-b border-gray-300 px-2 font-semibold text-gray-900 text-xs ${
                          selectedCell.col === 'C' && selectedCell.row === rowNum ? 'outline outline-2 outline-[#107c41] z-10' : ''
                        }`}
                      >
                        {item.word}
                      </td>

                      {/* D: Similarity */}
                      <td
                        onClick={() => handleCellClick('D', rowNum)}
                        className={`border-r border-b border-gray-300 px-2 text-right font-mono font-semibold text-xs ${
                          item.isAnswer ? 'text-emerald-700 bg-emerald-50' : 'text-gray-800'
                        } ${selectedCell.col === 'D' && selectedCell.row === rowNum ? 'outline outline-2 outline-[#107c41] z-10' : ''}`}
                      >
                        {item.similarity.toFixed(1)}%
                      </td>

                      {/* E: Verdict */}
                      <td
                        onClick={() => handleCellClick('E', rowNum)}
                        className={`border-r border-b border-gray-300 px-2 text-center text-xs ${
                          selectedCell.col === 'E' && selectedCell.row === rowNum ? 'outline outline-2 outline-[#107c41] z-10' : ''
                        }`}
                      >
                        <span className={`px-1.5 py-0.2 rounded text-[11px] ${
                          item.isAnswer
                            ? 'bg-emerald-100 text-emerald-800 font-bold'
                            : item.similarity >= 70
                            ? 'bg-amber-100 text-amber-800'
                            : item.similarity >= 45
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-500'
                        }`}>
                          {item.isAnswer ? '일치(정답)' : item.similarity >= 70 ? '상위근접' : item.similarity >= 45 ? '일반근접' : '원거리'}
                        </span>
                      </td>

                      {/* F: Rank */}
                      <td
                        onClick={() => handleCellClick('F', rowNum)}
                        className={`border-r border-b border-gray-300 px-2 text-center font-mono text-gray-600 text-xs ${
                          selectedCell.col === 'F' && selectedCell.row === rowNum ? 'outline outline-2 outline-[#107c41] z-10' : ''
                        }`}
                      >
                        {item.rank ? `${item.rank}위` : '-'}
                      </td>

                      {/* G: Status */}
                      <td
                        onClick={() => handleCellClick('G', rowNum)}
                        className={`border-r border-b border-gray-300 px-2 text-center text-xs text-gray-500 ${
                          selectedCell.col === 'G' && selectedCell.row === rowNum ? 'outline outline-2 outline-[#107c41] z-10' : ''
                        }`}
                      >
                        {item.isAnswer ? '해결완료' : '검토중'}
                      </td>

                      {/* Empty trailing cells */}
                      <td className="border-r border-b border-gray-300 px-2"></td>
                      <td className="border-r border-b border-gray-300 px-2"></td>
                      <td className="border-r border-b border-gray-300 px-2"></td>
                      <td className="border-r border-b border-gray-300 px-2"></td>
                    </>
                  ) : (
                    /* Empty Grid Rows (authentic spreadsheet view) */
                    <>
                      {columns.map(col => {
                        const isSelected = selectedCell.col === col.key && selectedCell.row === rowNum;
                        return (
                          <td
                            key={col.key}
                            onClick={() => handleCellClick(col.key, rowNum)}
                            className={`border-r border-b border-gray-300 px-2 h-6 relative ${
                              isSelected ? 'outline outline-2 outline-[#107c41] z-10' : ''
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#107c41] z-20 cursor-crosshair" />
                            )}
                          </td>
                        );
                      })}
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Authentic Excel Bottom Sheet Bar & Status Bar */}
      <div className="border-t border-gray-300 bg-[#f3f2f1] text-xs select-none">
        {/* Sheet Tabs */}
        <div className="flex items-center px-2 py-0.5 border-b border-gray-300 bg-[#f3f2f1]">
          <div className="flex items-center space-x-1 text-gray-500 pr-2 border-r border-gray-300">
            <button className="p-0.5 hover:bg-gray-200 rounded"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <button className="p-0.5 hover:bg-gray-200 rounded"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>

          <div className="flex items-center space-x-1 pl-2">
            <button
              onClick={() => setActiveSheet('all')}
              className={`px-3 py-1 text-xs rounded-t font-sans border-t-2 ${
                activeSheet === 'all'
                  ? 'bg-white font-semibold text-[#107c41] border-[#107c41] shadow-xs'
                  : 'text-gray-700 hover:bg-gray-200 border-transparent'
              }`}
            >
              Sheet1 (모두의_어휘분석)
            </button>
            <button
              onClick={() => setActiveSheet('mine')}
              className={`px-3 py-1 text-xs rounded-t font-sans border-t-2 ${
                activeSheet === 'mine'
                  ? 'bg-white font-semibold text-[#107c41] border-[#107c41] shadow-xs'
                  : 'text-gray-700 hover:bg-gray-200 border-transparent'
              }`}
            >
              Sheet2 (내_작업목록)
            </button>
            <button className="p-1 text-gray-600 hover:bg-gray-200 rounded ml-1" title="새 시트">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-[#107c41] text-white text-[11px] font-sans">
          <div className="flex items-center space-x-3">
            <span>준비</span>
            <span className="opacity-80">|</span>
            <span>선택 영역: {selectedCell.col}{selectedCell.row}</span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>평균: {stats.avg}%</span>
            <span>개수: {stats.count}</span>
            <span>최댓값: {stats.max}%</span>
            <span className="opacity-80">|</span>
            <span className="font-sans">100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
