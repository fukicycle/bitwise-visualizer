import React, { useState, useEffect, useMemo, useContext, createContext } from 'react';
import { ArrowRight, Database, Cpu, Layers, Info, Monitor, Binary, HelpCircle, X, BookOpen, Grid, Box, Square } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatHex, bigIntToBytes, parseInput, getByteBorderColor, calculateMinBytes } from './utils';

// --- Tooltip System ---

interface TooltipContextType {
  showTooltip: (text: React.ReactNode, e: React.MouseEvent) => void;
  hideTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextType | null>(null);

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  const [tooltip, setTooltip] = useState<{ text: React.ReactNode; x: number; y: number } | null>(null);

  const showTooltip = (text: React.ReactNode, e: React.MouseEvent) => {
    setTooltip({ text, x: e.clientX, y: e.clientY });
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  return (
    <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      {tooltip && (
        <div 
          className="fixed z-[9999] pointer-events-none bg-gray-800 border border-gray-600 text-white text-xs px-3 py-2 rounded shadow-xl whitespace-pre-wrap max-w-xs"
          style={{ 
            left: tooltip.x, 
            top: tooltip.y,
            transform: 'translate(-100%, -100%) translate(-12px, -12px)' 
          }}
        >
          {tooltip.text}
        </div>
      )}
    </TooltipContext.Provider>
  );
};

const Tooltip = ({ children, text }: { children: React.ReactNode; text: React.ReactNode }) => {
  const ctx = useContext(TooltipContext);
  
  if (!ctx) return <>{children}</>;

  return (
    <div 
      className="w-fit cursor-help inline-block"
      onMouseEnter={(e) => ctx.showTooltip(text, e)}
      onMouseMove={(e) => ctx.showTooltip(text, e)}
      onMouseLeave={ctx.hideTooltip}
    >
      {children}
    </div>
  );
};

// --- Components ---

const HelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-cyan-400" />
            用語集・使い方ガイド
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h3 className="text-lg font-bold text-white mb-2 border-l-4 border-cyan-500 pl-3">基本用語</h3>
            <dl className="space-y-4">
              <div>
                <dt className="font-bold text-cyan-400">ビット (Bit)</dt>
                <dd className="text-sm">コンピュータが扱う情報の最小単位です。「0」か「1」のどちらかの状態を持ちます。</dd>
              </div>
              <div>
                <dt className="font-bold text-cyan-400">バイト (Byte)</dt>
                <dd className="text-sm">8つのビットをまとめた単位です。1バイトで0〜255までの数値を表現できます。</dd>
              </div>
              <div>
                <dt className="font-bold text-cyan-400">ワード (Word)</dt>
                <dd className="text-sm">CPUが一度に処理できるデータの単位です。このツールでは16ビット(2バイト)、32ビット(4バイト)、64ビット(8バイト)を選択できます。</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2 border-l-4 border-purple-500 pl-3">エンディアン (Endianness)</h3>
            <p className="text-sm mb-3">
              複数のバイトにまたがる大きな数値（例：10000など）をメモリに保存する際、「どのバイトから順に並べるか」というルールのことです。
            </p>
            <dl className="space-y-4">
              <div>
                <dt className="font-bold text-purple-400">リトルエンディアン (Little Endian)</dt>
                <dd className="text-sm">
                  <span className="font-bold text-white">「下の桁」</span>から先にメモリに置く方式です。IntelやAMDのCPU（Windows PCなど）で使われています。
                  <br/>例：<code>0x1234</code> → メモリには <code>34 12</code> と保存される。
                </dd>
              </div>
              <div>
                <dt className="font-bold text-purple-400">ビッグエンディアン (Big Endian)</dt>
                <dd className="text-sm">
                  <span className="font-bold text-white">「上の桁」</span>から先にメモリに置く方式です。ネットワーク通信や一部の古いCPUで使われています。
                  <br/>例：<code>0x1234</code> → メモリには <code>12 34</code> と保存される。
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2 border-l-4 border-green-500 pl-3">データの型</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><span className="font-bold text-white">符号付き (Signed)</span>: プラスとマイナスの両方を扱える整数。最上位ビットが1だとマイナスになります。</li>
              <li><span className="font-bold text-white">符号なし (Unsigned)</span>: 0とプラスの値のみを扱う整数。その分、扱えるプラスの最大値が大きくなります。</li>
              <li><span className="font-bold text-white">浮動小数点 (Float)</span>: 小数を扱うための形式。「IEEE 754」という規格でビットの使い方が決まっています。</li>
            </ul>
          </section>
        </div>
        <div className="p-6 border-t border-gray-800 bg-gray-900/50 text-center">
          <button onClick={onClose} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

const BitGrid = ({ byteVal, colorClass }: { byteVal: number, colorClass: string }) => {
  const bits = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => (byteVal >> (7 - i)) & 1);
  }, [byteVal]);

  return (
    <div className="flex gap-px">
      {bits.map((bit, i) => (
        <div
          key={i}
          className={twMerge(
            "flex items-center justify-center font-mono transition-all duration-300",
            "w-2.5 h-4 sm:w-3 sm:h-5 text-[8px] sm:text-[10px]",
            bit === 1 
              ? `bg-opacity-90 text-white font-bold ${colorClass.replace('border-', 'bg-')}` 
              : "bg-gray-800 text-gray-600"
          )}
          title={`ビット ${7-i}`}
        >
          {bit}
        </div>
      ))}
    </div>
  );
};

const ByteCard = ({ 
  index, 
  value, 
  totalBytes, 
  isLittleEndian, 
  addressOffset,
}: { 
  index: number; 
  value: number; 
  totalBytes: number; 
  isLittleEndian: boolean;
  addressOffset: number;
}) => {
  const borderColor = getByteBorderColor(index, totalBytes, isLittleEndian);
  const significance = isLittleEndian ? index : (totalBytes - 1 - index);
  
  // Determine label based on significance
  let label = "";
  let labelFull = "";
  if (significance === 0) {
    label = "LSB";
    labelFull = "Least Significant Byte (最下位バイト)";
  }
  else if (significance === totalBytes - 1) {
    label = "MSB";
    labelFull = "Most Significant Byte (最上位バイト)";
  }

  return (
    <div className={twMerge(
      "relative flex flex-col items-center bg-gray-900 rounded-lg border-2 transition-all duration-500", 
      borderColor,
      "p-1.5 sm:p-2 min-w-[90px] sm:min-w-[100px]"
    )}>
      {/* Address Label */}
      <div className="absolute -top-4 left-1.5 bg-gray-950 px-1 text-[9px] sm:text-[10px] text-gray-400 font-mono border border-gray-800 rounded whitespace-nowrap z-10">
        Addr: +{addressOffset}
      </div>
      
      {/* Significance Label */}
      {label && (
        <Tooltip text={labelFull}>
          <div className="absolute -bottom-3 right-1.5 bg-gray-950 px-1 text-[9px] font-bold text-white uppercase tracking-wider border border-gray-700 rounded cursor-help z-10">
            {label}
          </div>
        </Tooltip>
      )}

      <div className="mb-1 text-[10px] sm:text-xs text-gray-400 font-mono">Byte {index}</div>
      
      <div className="text-xl sm:text-2xl font-mono font-bold text-white mb-1">
        0x{formatHex(value)}
      </div>
      <BitGrid byteVal={value} colorClass={borderColor} />
      <div className="mt-1 text-[9px] sm:text-[10px] text-gray-500 font-mono">
        {value.toString().padStart(3, '0')}
      </div>
    </div>
  );
};

const WordCard = ({
  bytes,
  addressOffset,
  isLittleEndian,
  wordWidth
}: {
  bytes: number[];
  addressOffset: number;
  isLittleEndian: boolean;
  wordWidth: number;
}) => {
  // Reconstruct the value from bytes
  const value = useMemo(() => {
    let val = 0n;
    if (isLittleEndian) {
      for (let i = bytes.length - 1; i >= 0; i--) {
        val = (val << 8n) | BigInt(bytes[i]);
      }
    } else {
      for (let i = 0; i < bytes.length; i++) {
        val = (val << 8n) | BigInt(bytes[i]);
      }
    }
    return val;
  }, [bytes, isLittleEndian]);

  // For display, we want to show bits in logical order (MSB -> LSB)
  // If Little Endian: Memory is [LSB, ..., MSB]. 
  // If Big Endian: Memory is [MSB, ..., LSB].
  // The `value` computed above is the logical value.
  // We can just iterate bits of `value`.

  const hexWidth = wordWidth * 2;
  const hexString = value.toString(16).toUpperCase().padStart(hexWidth, '0');

  return (
    <div className="relative flex flex-col p-4 bg-gray-900 rounded-lg border-2 border-cyan-500/50 w-full">
      <div className="absolute -top-3 left-3 bg-gray-950 px-2 text-xs text-gray-400 font-mono border border-gray-800 rounded">
        Addr: +{addressOffset} 〜 +{addressOffset + wordWidth - 1}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 font-mono mb-1">Word Value (Hex)</div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider">
            0x{hexString}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 font-mono mb-1">Decimal</div>
          <div className="text-lg font-mono text-cyan-400">
            {value.toString()}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-500 font-mono">Binary Representation (MSB → LSB)</div>
        <div className="flex flex-wrap gap-1">
          {/* Render bits from MSB to LSB */}
          {Array.from({ length: wordWidth }).map((_, byteIndex) => {
            // Logical byte index (0 = MSB byte)
            const logicalByteIndex = byteIndex;
            const shift = BigInt((wordWidth - 1 - logicalByteIndex) * 8);
            const byteVal = Number((value >> shift) & 0xFFn);
            
            return (
              <div key={byteIndex} className="flex gap-px p-1 bg-gray-950 rounded border border-gray-800">
                {Array.from({ length: 8 }).map((_, bitIndex) => {
                  const bit = (byteVal >> (7 - bitIndex)) & 1;
                  return (
                    <div
                      key={bitIndex}
                      className={twMerge(
                        "w-3 h-5 sm:w-4 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-mono",
                        bit === 1 ? "bg-cyan-600 text-white font-bold" : "bg-gray-800 text-gray-600"
                      )}
                    >
                      {bit}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MainContent = () => {
  const [inputStr, setInputStr] = useState<string>("305419896"); // Example value
  const [inputType, setInputType] = useState<'hex' | 'dec'>('dec');
  const [byteWidth, setByteWidth] = useState<2 | 4 | 8>(4); // 16, 32, or 64-bit
  const [isLittleEndian, setIsLittleEndian] = useState<boolean>(true); // Default to LE (x86 standard)
  const [viewUnit, setViewUnit] = useState<'byte' | 'word'>('byte');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Derived State
  const rawValue = useMemo(() => parseInput(inputStr, inputType), [inputStr, inputType]);
  
  // Calculate dynamic byte length based on input value
  const dynamicByteLength = useMemo(() => {
    const minBytes = calculateMinBytes(rawValue);
    // Ensure we have at least byteWidth, and always a multiple of byteWidth
    return Math.max(byteWidth, Math.ceil(minBytes / byteWidth) * byteWidth);
  }, [rawValue, byteWidth]);

  // The bytes as they would appear in memory based on selected endianness
  const memoryBytes = useMemo(() => {
    return bigIntToBytes(rawValue, dynamicByteLength, isLittleEndian);
  }, [rawValue, dynamicByteLength, isLittleEndian]);

  // Interpretations (Always based on the first 8 bytes max for standard types)
  const interpretations = useMemo(() => {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    
    // We only fill the buffer with the first 8 bytes of our memory representation
    // to simulate "casting" the pointer at address 0.
    const bytesToRead = Math.min(memoryBytes.length, 8);
    for(let i=0; i<bytesToRead; i++) {
        view.setUint8(i, memoryBytes[i]);
    }
    
    const le = isLittleEndian;

    // Helper to safely get values even if buffer is small (return null or 0)
    const safeGet = (getter: () => any, minBytes: number) => {
      if (bytesToRead < minBytes) return null;
      return getter();
    };

    return {
      int8: safeGet(() => view.getInt8(0), 1),
      uint8: safeGet(() => view.getUint8(0), 1),
      int16: safeGet(() => view.getInt16(0, le), 2),
      uint16: safeGet(() => view.getUint16(0, le), 2),
      int32: safeGet(() => view.getInt32(0, le), 4),
      uint32: safeGet(() => view.getUint32(0, le), 4),
      float32: safeGet(() => view.getFloat32(0, le), 4),
      int64: safeGet(() => view.getBigInt64(0, le), 8),
      uint64: safeGet(() => view.getBigUint64(0, le), 8),
      float64: safeGet(() => view.getFloat64(0, le), 8),
    };
  }, [memoryBytes, isLittleEndian]);

  // Chunk bytes for Word View
  const wordChunks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < memoryBytes.length; i += byteWidth) {
      chunks.push(memoryBytes.slice(i, i + byteWidth));
    }
    return chunks;
  }, [memoryBytes, byteWidth]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-4 sm:p-8 font-sans">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
              <Binary className="text-cyan-400" />
              ビット可視化ツール
            </h1>
            <p className="text-gray-400 mt-2 max-w-xl text-sm sm:text-base">
              数値がメモリ内でどのように保存されるかを可視化します。<br className="hidden sm:block"/>
              ビット、バイト、エンディアンの関係を学びましょう。
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
             <button 
               onClick={() => setIsHelpOpen(true)}
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-cyan-400 transition-colors text-sm font-bold border border-gray-700"
             >
               <HelpCircle size={18} />
               用語集・使い方
             </button>
          </div>
        </header>

        {/* Controls Row: Input & Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Monitor size={18} /> 入力値
              </h2>
              <Tooltip text="変換したい数値をここに入力してください。">
                <Info size={14} className="text-gray-500 hover:text-cyan-400 transition-colors" />
              </Tooltip>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2 bg-gray-950 p-1 rounded-lg border border-gray-800">
                <button
                  onClick={() => setInputType('dec')}
                  className={clsx("flex-1 py-2 text-sm font-medium rounded-md transition-all", inputType === 'dec' ? "bg-gray-800 text-white shadow" : "text-gray-500 hover:text-gray-300")}
                >
                  10進数 (Decimal)
                </button>
                <button
                  onClick={() => setInputType('hex')}
                  className={clsx("flex-1 py-2 text-sm font-medium rounded-md transition-all", inputType === 'hex' ? "bg-gray-800 text-white shadow" : "text-gray-500 hover:text-gray-300")}
                >
                  16進数 (Hex)
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={inputStr}
                  onChange={(e) => setInputStr(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 text-white px-4 py-3 rounded-lg font-mono text-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  placeholder={inputType === 'hex' ? "0x1234..." : "12345..."}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-mono">
                  {inputType === 'hex' ? 'HEX' : 'DEC'}
                </div>
              </div>

              <div className="p-3 bg-gray-950 rounded border border-gray-800">
                <div className="text-xs text-gray-500 uppercase mb-1 flex justify-between">
                  <span>生のバイナリ値</span>
                  <span className="text-[10px] text-gray-600">※入力値の2進数表現</span>
                </div>
                <div className="font-mono text-xs text-cyan-400 break-all leading-relaxed">
                  {rawValue.toString(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Endianness Control */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Cpu size={18} /> アーキテクチャ
              </h2>
              <Tooltip text="CPUの種類によって、メモリへのデータの並べ方（エンディアン）が異なります。">
                <Info size={14} className="text-gray-500 hover:text-cyan-400 transition-colors" />
              </Tooltip>
            </div>
            
            <div className="flex flex-col gap-3">
              <label className={clsx("flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all", isLittleEndian ? "bg-cyan-900/20 border-cyan-500/50" : "bg-gray-950 border-gray-800 hover:border-gray-700")}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="endian" 
                    checked={isLittleEndian} 
                    onChange={() => setIsLittleEndian(true)}
                    className="text-cyan-500 focus:ring-cyan-500 bg-gray-900 border-gray-700"
                  />
                  <div>
                    <div className="font-medium text-white text-sm">リトルエンディアン (Little Endian)</div>
                    <div className="text-xs text-gray-400 mt-0.5">最下位バイトが先頭 (Intel/AMD x86など)</div>
                  </div>
                </div>
              </label>

              <label className={clsx("flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all", !isLittleEndian ? "bg-cyan-900/20 border-cyan-500/50" : "bg-gray-950 border-gray-800 hover:border-gray-700")}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="endian" 
                    checked={!isLittleEndian} 
                    onChange={() => setIsLittleEndian(false)}
                    className="text-cyan-500 focus:ring-cyan-500 bg-gray-900 border-gray-700"
                  />
                  <div>
                    <div className="font-medium text-white text-sm">ビッグエンディアン (Big Endian)</div>
                    <div className="text-xs text-gray-400 mt-0.5">最上位バイトが先頭 (ネットワーク/Motorolaなど)</div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Visualization Area - Full Width */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 shrink-0">
                <Database size={18} /> メモリ配置イメージ
              </h2>
              
              <div className="flex flex-wrap items-center gap-4">
                {/* View Unit Toggle */}
                <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800">
                  <button
                    onClick={() => setViewUnit('byte')}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all",
                      viewUnit === 'byte' ? "bg-gray-800 text-white shadow" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    <Box size={14} /> バイト単位
                  </button>
                  <button
                    onClick={() => setViewUnit('word')}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all",
                      viewUnit === 'word' ? "bg-gray-800 text-white shadow" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    <Square size={14} /> ワード単位
                  </button>
                </div>

                {/* Word Width Selector */}
                <div className="flex items-center gap-2 bg-gray-950 p-1.5 rounded-lg border border-gray-800">
                  <div className="text-xs font-medium text-gray-400 px-2">ワード幅:</div>
                  <button 
                      onClick={() => setByteWidth(2)}
                      className={clsx("px-3 py-1.5 rounded text-xs font-bold transition-colors", byteWidth === 2 ? "bg-cyan-600 text-white" : "hover:bg-gray-800 text-gray-400")}
                  >
                    16-bit
                  </button>
                  <button 
                      onClick={() => setByteWidth(4)}
                      className={clsx("px-3 py-1.5 rounded text-xs font-bold transition-colors", byteWidth === 4 ? "bg-cyan-600 text-white" : "hover:bg-gray-800 text-gray-400")}
                  >
                    32-bit
                  </button>
                  <button 
                      onClick={() => setByteWidth(8)}
                      className={clsx("px-3 py-1.5 rounded text-xs font-bold transition-colors", byteWidth === 8 ? "bg-cyan-600 text-white" : "hover:bg-gray-800 text-gray-400")}
                  >
                    64-bit
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-950 px-3 py-1 rounded-full border border-gray-800 w-fit">
              <Tooltip text="Least Significant Byte: 最も位の低いバイト（値への影響が小さい）">
                <span className="flex items-center gap-1 cursor-help"><span className="w-2 h-2 rounded-full bg-red-500"></span> LSB (最下位)</span>
              </Tooltip>
              <ArrowRight size={12} />
              <Tooltip text="Most Significant Byte: 最も位の高いバイト（値への影響が大きい）">
                <span className="flex items-center gap-1 cursor-help"><span className="w-2 h-2 rounded-full bg-teal-500"></span> MSB (最上位)</span>
              </Tooltip>
            </div>
          </div>

          {/* Dynamic Grid Layout */}
          <div className="relative overflow-x-auto pt-8 pb-8 px-2">
            {viewUnit === 'byte' ? (
              <div 
                className="grid gap-2 sm:gap-4 min-w-max"
                style={{
                  gridTemplateColumns: `repeat(${byteWidth}, min-content)`
                }}
              >
                {memoryBytes.map((byte, idx) => (
                  <ByteCard 
                    key={idx} 
                    index={idx} 
                    value={byte} 
                    totalBytes={dynamicByteLength} 
                    isLittleEndian={isLittleEndian}
                    addressOffset={idx}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4 min-w-max">
                {wordChunks.map((chunk, idx) => (
                  <WordCard
                    key={idx}
                    bytes={chunk}
                    addressOffset={idx * byteWidth}
                    isLittleEndian={isLittleEndian}
                    wordWidth={byteWidth}
                  />
                ))}
              </div>
            )}
            
            {/* Visual Guide for Endianness */}
            <div className="mt-8 border-t border-gray-800 pt-4">
              <div className="flex items-start gap-2 text-sm text-gray-400 mb-2 bg-gray-950/50 p-3 rounded border border-gray-800/50">
                <Info size={16} className="mt-0.5 text-cyan-500 shrink-0" />
                <span>
                  {isLittleEndian 
                    ? "リトルエンディアンでは、最も位の低いバイト(赤色/LSB)が、最も小さいメモリアドレス(左側)に保存されます。人間が読む数字の並びとは逆に見えることがあります。" 
                    : "ビッグエンディアンでは、最も位の高いバイト(青緑色/MSB)が、最も小さいメモリアドレス(左側)に保存されます。人間が読む数字の並びと同じ順序でメモリに入ります。"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Interpretation Table - Full Width */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers size={18} /> データの解釈 (先頭8バイト)
            </h2>
            <Tooltip text="メモリ内の同じビット列でも、それを「どう解釈するか（型）」によって値が変わります。">
              <Info size={14} className="text-gray-500 hover:text-cyan-400 transition-colors" />
            </Tooltip>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase text-gray-500">
                  <th className="py-3 px-4 font-medium">型 (Type)</th>
                  <th className="py-3 px-4 font-medium">サイズ</th>
                  <th className="py-3 px-4 font-medium">値 (10進数)</th>
                  <th className="py-3 px-4 font-medium">範囲・備考</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono">
                <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                  <td className="py-3 px-4 text-cyan-400 font-bold">
                    <Tooltip text="8ビットの符号付き整数。-128から127まで扱えます。">Int8</Tooltip>
                  </td>
                  <td className="py-3 px-4 text-gray-400">1 Byte</td>
                  <td className="py-3 px-4 text-white">{interpretations.int8 ?? '-'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">-128 〜 127</td>
                </tr>
                <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                  <td className="py-3 px-4 text-cyan-400 font-bold">
                    <Tooltip text="8ビットの符号なし整数。0から255まで扱えます。">Uint8</Tooltip>
                  </td>
                  <td className="py-3 px-4 text-gray-400">1 Byte</td>
                  <td className="py-3 px-4 text-white">{interpretations.uint8 ?? '-'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">0 〜 255</td>
                </tr>
                <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                  <td className="py-3 px-4 text-purple-400 font-bold">
                    <Tooltip text="16ビットの符号付き整数。">Int16</Tooltip>
                  </td>
                  <td className="py-3 px-4 text-gray-400">2 Bytes</td>
                  <td className="py-3 px-4 text-white">{interpretations.int16 ?? '-'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">±32,767</td>
                </tr>
                <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                  <td className="py-3 px-4 text-purple-400 font-bold">
                    <Tooltip text="16ビットの符号なし整数。">Uint16</Tooltip>
                  </td>
                  <td className="py-3 px-4 text-gray-400">2 Bytes</td>
                  <td className="py-3 px-4 text-white">{interpretations.uint16 ?? '-'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">0 〜 65,535</td>
                </tr>
                <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                  <td className="py-3 px-4 text-green-400 font-bold">
                    <Tooltip text="32ビットの符号付き整数。一般的な「整数(int)」はこれです。">Int32</Tooltip>
                  </td>
                  <td className="py-3 px-4 text-gray-400">4 Bytes</td>
                  <td className="py-3 px-4 text-white">{interpretations.int32 ?? '-'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">±約21億</td>
                </tr>
                <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                  <td className="py-3 px-4 text-green-400 font-bold">
                    <Tooltip text="32ビットの符号なし整数。">Uint32</Tooltip>
                  </td>
                  <td className="py-3 px-4 text-gray-400">4 Bytes</td>
                  <td className="py-3 px-4 text-white">{interpretations.uint32 ?? '-'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">0 〜 約42億</td>
                </tr>
                <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                  <td className="py-3 px-4 text-yellow-400 font-bold">
                    <Tooltip text="32ビット浮動小数点数。小数を扱います。">Float32</Tooltip>
                  </td>
                  <td className="py-3 px-4 text-gray-400">4 Bytes</td>
                  <td className="py-3 px-4 text-white">{interpretations.float32?.toExponential(4) ?? '-'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">IEEE 754 単精度</td>
                </tr>
                {byteWidth === 8 && (
                  <>
                    <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                      <td className="py-3 px-4 text-pink-400 font-bold">
                        <Tooltip text="64ビットの符号付き整数。非常に大きな数を扱えます。">Int64</Tooltip>
                      </td>
                      <td className="py-3 px-4 text-gray-400">8 Bytes</td>
                      <td className="py-3 px-4 text-white">{interpretations.int64?.toString() ?? '-'}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">BigInt</td>
                    </tr>
                    <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                      <td className="py-3 px-4 text-pink-400 font-bold">
                        <Tooltip text="64ビットの符号なし整数。">Uint64</Tooltip>
                      </td>
                      <td className="py-3 px-4 text-gray-400">8 Bytes</td>
                      <td className="py-3 px-4 text-white">{interpretations.uint64?.toString() ?? '-'}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">BigInt</td>
                    </tr>
                    <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                      <td className="py-3 px-4 text-yellow-400 font-bold">
                        <Tooltip text="64ビット浮動小数点数。より高精度な小数を扱います。">Float64</Tooltip>
                      </td>
                      <td className="py-3 px-4 text-gray-400">8 Bytes</td>
                      <td className="py-3 px-4 text-white">{interpretations.float64?.toExponential(4) ?? '-'}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">IEEE 754 倍精度</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <TooltipProvider>
      <MainContent />
    </TooltipProvider>
  );
}