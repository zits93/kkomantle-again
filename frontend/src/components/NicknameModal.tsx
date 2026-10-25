import React, { useState, useEffect } from 'react';
import { UserCheckResult } from '../types/game';
import { User, ShieldCheck, ArrowRight, X, AlertCircle } from 'lucide-react';

interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname: string;
  serverHost: string;
  onConfirmNickname: (nickname: string) => void;
  canDismiss?: boolean;
}

export const NicknameModal: React.FC<NicknameModalProps> = ({
  isOpen,
  onClose,
  currentNickname,
  serverHost,
  onConfirmNickname,
  canDismiss = false,
}) => {
  const [step, setStep] = useState<'input' | 'confirm_ip'>('input');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<UserCheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setInputValue(currentNickname.startsWith('탐험가_') ? '' : currentNickname);
      setErrorMsg(null);
      setCheckResult(null);
    }
  }, [isOpen, currentNickname]);

  if (!isOpen) return null;

  const handleCheckNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = inputValue.trim();
    if (!cleanNick) {
      setErrorMsg('닉네임을 입력해주세요.');
      return;
    }
    if (cleanNick.length < 2 || cleanNick.length > 12) {
      setErrorMsg('닉네임은 2자 이상 12자 이하로 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const targetHost = serverHost || window.location.host;
      const url = `${protocol}//${targetHost}/api/users/check?nickname=${encodeURIComponent(cleanNick)}`;

      const res = await fetch(url, { headers: { 'ngrok-skip-browser-warning': 'true' } });
      if (!res.ok) throw new Error('서버 응답 오류');

      const data: UserCheckResult = await res.json();
      setCheckResult(data);

      if (data.exists) {
        // Existing user found -> go to IP confirmation step
        setStep('confirm_ip');
      } else {
        // Brand new user -> confirm immediately
        handleFinalConfirm(cleanNick);
      }
    } catch (err) {
      setErrorMsg('서버 연결 실패. 네트워크 상태 확인 후 다시 시도하거나 오프라인으로 계속 진행할 수 있습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalConfirm = async (confirmedNick: string) => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const targetHost = serverHost || window.location.host;
      const url = `${protocol}//${targetHost}/api/users/confirm`;

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ nickname: confirmedNick }),
      }).catch(() => {});
    } catch {}

    localStorage.setItem('kkomantle_nickname_confirmed', 'true');
    onConfirmNickname(confirmedNick);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
        {canDismiss && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Step 1: Input Nickname */}
        {step === 'input' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-zinc-900 dark:text-zinc-100 font-bold text-base">
                <User className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                <span>닉네임 설정</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                게임 기록 및 랭킹에 저장되는 닉네임입니다.
              </p>
            </div>

            <form onSubmit={handleCheckNickname} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => {
                    setInputValue(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="예: 알파카, 지존개발자"
                  autoFocus
                  maxLength={12}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-normal"
                />
                {errorMsg && (
                  <div className="mt-2 space-y-2">
                    <p className="text-[11px] text-rose-500 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errorMsg}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => handleFinalConfirm(inputValue.trim())}
                      className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
                    >
                      오프라인으로 계속 진행하기
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <span>{loading ? '확인 중...' : '확인'}</span>
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Existing User IP Verification */}
        {step === 'confirm_ip' && checkResult && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-zinc-900 dark:text-zinc-100 font-bold text-base">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>기존 사용자 본인 확인</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                <b className="text-zinc-900 dark:text-zinc-100 font-semibold">{checkResult.nickname}</b> 님은 이전에 등록된 닉네임입니다. 동일 사용자인지 IP 주소를 확인해주세요.
              </p>
            </div>

            {/* IP Comparison Info Box */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500 dark:text-zinc-400">이전 등록 IP:</span>
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {checkResult.lastMaskedIp || '기록 없음'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500 dark:text-zinc-400">현재 접속 IP:</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {checkResult.currentClientIp || '현재 기기'}
                </span>
              </div>
              {checkResult.totalWins !== undefined && checkResult.totalWins > 0 && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-zinc-500 dark:text-zinc-400">누적 우승 기록:</span>
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                    {checkResult.totalWins}승
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleFinalConfirm(checkResult.nickname)}
                className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-medium text-xs transition cursor-pointer"
              >
                네, 본인입니다 (기록 이어하기)
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setInputValue('');
                  setErrorMsg('다른 닉네임을 입력해주세요.');
                }}
                className="w-full py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium transition cursor-pointer"
              >
                아닙니다 (다른 닉네임 사용)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
