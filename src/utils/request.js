const axios = require("axios");

/**
 * Hàm sleep dừng thực thi trong khoảng thời gian ms
 * @param {number} ms - Số mili-giây cần chờ
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Thực hiện HTTP request bằng axios với cơ chế tự động thử lại (retry) khi gặp lỗi mạng/rate limit
 * @param {string} url - URL đích
 * @param {object} options - Cấu hình request cho axios
 * @param {number} maxAttempts - Số lần thử lại tối đa (mặc định: 3)
 * @returns {Promise<any>} Response của axios
 */
async function fetchWithRetry(url, options = {}, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      // Đặt timeout mặc định là 15 giây nếu không có cấu hình cụ thể
      const timeout = options.timeout || 15_000;
      const response = await axios({
        url,
        timeout,
        ...options,
      });
      return response;
    } catch (error) {
      const status = error.response?.status;
      const headers = error.response?.headers || {};
      const retryAfterSeconds = Number(headers["retry-after"]);
      
      // Xác định xem có nên thử lại không:
      // - Lỗi 429: Rate limit
      // - Lỗi >= 500: Server lỗi tạm thời
      // - Không có status: Lỗi mạng (timeout, mất kết nối)
      const shouldRetry = status === 429 || status >= 500 || !status;

      if (!shouldRetry || attempt === maxAttempts) {
        throw error;
      }

      // Xác định thời gian chờ trước khi thử lại
      let delayMs;
      if (status === 429 && Number.isFinite(retryAfterSeconds)) {
        // Tôn trọng header retry-after của Discord/Steam nếu có
        delayMs = retryAfterSeconds * 1000;
      } else {
        // Áp dụng exponential backoff: 1s, 2s, 3s...
        delayMs = 1000 * attempt;
      }

      console.warn(`[Network] Lỗi khi gọi ${url} (Trạng thái: ${status || "Lỗi mạng"}). Thử lại ${attempt}/${maxAttempts} sau ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }
}

module.exports = {
  fetchWithRetry,
  sleep,
};
