/**
 * Menggabungkan beberapa string kelas CSS 
 * @param {string[]} inputs - Array dari string kelas CSS yang akan digabungkan
 * @returns {string} - String kelas CSS yang sudah digabungkan
 */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Format angka dengan separator ribuan
 * @param {number} value - Angka yang akan diformat
 * @returns {string} - String angka dengan separator ribuan
 */
export function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Delay eksekusi dengan Promise
 * @param {number} ms - Waktu delay dalam milidetik
 * @returns {Promise} - Promise yang akan resolve setelah delay
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Membuat variasi warna dari warna dasar
 * @param {string} color - Warna dasar dalam format hex
 * @param {number} percent - Persentase perubahan (positif untuk lebih terang, negatif untuk lebih gelap)
 * @returns {string} - Warna baru dalam format hex
 */
export function adjustColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
} 