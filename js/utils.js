// Utility Functions
export function formatAddress(address) {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
}

// Helper to normalize timestamp to milliseconds
function normalizeTimestamp(timestamp) {
    if (!timestamp) return null;
    // Convert seconds to milliseconds if needed
    return timestamp < 1e12 ? timestamp * 1000 : timestamp;
}

export function formatDate(timestamp) {
    try {
        if (!timestamp) {
            console.warn('Invalid timestamp provided to formatDate');
            return 'Không xác định';
        }

        const normalizedTimestamp = normalizeTimestamp(timestamp);
        if (!normalizedTimestamp) {
            console.error('Could not normalize timestamp:', timestamp);
            return 'Không xác định';
        }

        const date = new Date(normalizedTimestamp);
        if (isNaN(date.getTime())) {
            console.error('Invalid date from timestamp:', timestamp);
            return 'Không xác định';
        }

        console.log('Formatting date:', {
            original: timestamp,
            normalized: normalizedTimestamp,
            result: date
        });

        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Ho_Chi_Minh'
        }).format(date);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Lỗi định dạng';
    }
}

export function showToast(message, type = 'success') {
    console.log('Showing toast:', { message, type });

    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    if (!toast || !toastMessage) {
        console.error('Toast elements not found in DOM');
        return;
    }

    toast.className = 'toast';
    toast.classList.add(type);
    toastMessage.textContent = message;

    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

export function showLoading() {
    console.log('Showing loading overlay');
    const overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        console.error('Loading overlay not found in DOM');
        return;
    }
    overlay.classList.add('active');
}

export function hideLoading() {
    console.log('Hiding loading overlay');
    const overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        console.error('Loading overlay not found in DOM');
        return;
    }
    overlay.classList.remove('active');
}