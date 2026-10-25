import React, { useState } from 'react';
import { Wifi, WifiOff, Copy, Check, RotateCcw, X, ExternalLink, Smartphone, ShieldCheck, Zap } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';
import { CLOUDFLARE_TUNNEL_HOST, NGROK_TUNNEL_HOST } from '../hooks/useGameSocket';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  currentServer: string;
  onSaveServer: (newServer: string) => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  currentServer,
  onSaveServer,
}) => {
  const [inputServer, setInputServer] = useState(currentServer);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyInviteLink = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const inviteUrl = `${origin}${pathname}?server=${encodeURIComponent(currentServer || inputServer.trim())}`;
    
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputServer.trim()) {
      onSaveServer(inputServer.trim());
      onClose();
    }
  };

  const modalRef = useModalA11y<HTMLDivElement>({ isOpen, onClose });

  const handleSelectHost = (host: string) => {
    setInputServer(host);
    onSaveServer(host);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md select-none">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="server-settings-title"
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.3)] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-500" />
            )}
            <h2 id="server-settings-title" className="font-bold text-sm tracking-tight">멀티플레이 서버 연결</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition text-zinc-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Badge */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <div>
                <div className="font-semibold text-xs">
                  {isConnected ? '실시간 서버 연결됨 (단어 공유 중)' : '로컬 오프라인 모드'}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {isConnected
                    ? `연결 주소: ${currentServer}`
                    : '서버와 연결되지 않아 단어가 이 기기에만 저장됩니다.'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Mobile Sync Share Box */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-2.5">
            <div className="flex items-center space-x-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
              <Smartphone className="w-4 h-4 text-indigo-500" />
              <span>모바일과 실시간 단어 공유하기</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              아래 초대 링크를 복사하여 모바일 브라우저(사파리/크롬)로 접속하면, 별도 설정 없이 즉시 동일한 게임 서버에 자동 연결되어 모든 단어가 실시간으로 동기화됩니다!
            </p>
            <button
              onClick={handleCopyInviteLink}
              className={`w-full py-2 px-3 rounded-lg font-medium flex items-center justify-center space-x-1.5 transition ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '초대 링크가 복사되었습니다!' : '모바일 초대 링크 복사'}</span>
            </button>
          </div>

          {/* Server Config Form */}
          <form onSubmit={handleSave} className="space-y-2">
            <label htmlFor="server-host-input" className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
              서버 호스트 주소 (도메인 또는 IP:포트)
            </label>
            <div className="flex space-x-1.5">
              <input
                id="server-host-input"
                type="text"
                value={inputServer}
                onChange={e => setInputServer(e.target.value)}
                placeholder="예: your-tunnel.ngrok-free.app 또는 192.168.0.5:8000"
                className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-zinc-500 font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 transition"
              >
                적용
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5 pt-2">
              <span className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">빠른 서버 전환:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectHost(CLOUDFLARE_TUNNEL_HOST)}
                  className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                    currentServer.includes('trycloudflare')
                      ? 'border-indigo-500/80 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center space-x-1 font-semibold text-[11px]">
                    <Zap className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>클라우드플레어</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1">사내망/보안망 권장</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectHost(NGROK_TUNNEL_HOST)}
                  className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                    currentServer.includes('ngrok')
                      ? 'border-indigo-500/80 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center space-x-1 font-semibold text-[11px]">
                    <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>ngrok 터널</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1">외부망/모바일</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectHost('localhost:8000')}
                  className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                    currentServer.includes('localhost')
                      ? 'border-indigo-500/80 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center space-x-1 font-semibold text-[11px]">
                    <RotateCcw className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>로컬 PC</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1">localhost:8000</span>
                </button>
              </div>
            </div>

            {/* Corporate Intranet Guide Box */}
            <div className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mb-1">🏢 사내망 접속 안내</span>
              사내 보안망(Knox, Zscaler, 프록시)에서 WebSocket이나 ngrok을 차단할 경우 브라우저 콘솔에 CORS 에러가 발생할 수 있습니다. 상단의 <strong className="text-zinc-800 dark:text-zinc-200">클라우드플레어</strong>를 선택하시면 사내망에서도 HTTP 자동 전환으로 정상 플레이 가능합니다.
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
