// Utility Functions
export function formatAddress(address) {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
}

export function formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
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