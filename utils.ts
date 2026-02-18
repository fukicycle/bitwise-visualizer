export const formatHex = (val: number, padding: number = 2) => {
  return val.toString(16).toUpperCase().padStart(padding, '0');
};

export const formatBin = (val: number, padding: number = 8) => {
  return val.toString(2).padStart(padding, '0');
};

// Convert a BigInt to a byte array
export const bigIntToBytes = (value: bigint, length: number, isLittleEndian: boolean): number[] => {
  const bytes: number[] = [];
  let temp = value;
  
  for (let i = 0; i < length; i++) {
    bytes.push(Number(temp & 0xFFn));
    temp >>= 8n;
  }

  // The loop extracts LSB first. 
  // If we want Little Endian (LSB at index 0), we keep it as is.
  // If we want Big Endian (MSB at index 0), we reverse it.
  if (!isLittleEndian) {
    return bytes.reverse();
  }
  return bytes;
};

// Parse input string to BigInt safely
export const parseInput = (input: string, type: 'hex' | 'dec'): bigint => {
  try {
    if (!input) return 0n;
    const cleanInput = input.replace(/\s/g, '').replace(/_/g, '');
    if (type === 'hex') {
      // Handle 0x prefix if present, or add it
      const hexStr = cleanInput.startsWith('0x') ? cleanInput : `0x${cleanInput}`;
      return BigInt(hexStr);
    } else {
      return BigInt(cleanInput);
    }
  } catch (e) {
    return 0n;
  }
};

export const calculateMinBytes = (value: bigint): number => {
  if (value === 0n) return 1;
  const absVal = value < 0n ? -value : value;
  // Approximate bytes needed by hex length
  // 1 hex char = 4 bits. 2 hex chars = 1 byte.
  const hex = absVal.toString(16);
  return Math.ceil(hex.length / 2);
};

export const getByteColor = (index: number, total: number, isLittleEndian: boolean) => {
  // Generate a consistent color based on significance
  // Index 0 in the array is the first byte in memory.
  // For Little Endian, Index 0 is LSB.
  // For Big Endian, Index 0 is MSB.
  
  // We want to color code based on "Significance" so the color follows the byte value, not the position.
  // Significance Index (0 = LSB, 7 = MSB)
  const significanceIndex = isLittleEndian ? index : (total - 1 - index);

  const colors = [
    'bg-red-500',    // LSB
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',   // MSB (for 64bit)
  ];
  
  return colors[significanceIndex % colors.length];
};

export const getByteBorderColor = (index: number, total: number, isLittleEndian: boolean) => {
    const significanceIndex = isLittleEndian ? index : (total - 1 - index);
    const colors = [
        'border-red-500',
        'border-orange-500',
        'border-amber-500',
        'border-yellow-500',
        'border-lime-500',
        'border-green-500',
        'border-emerald-500',
        'border-teal-500',
    ];
    return colors[significanceIndex % colors.length];
}