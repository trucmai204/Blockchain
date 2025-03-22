import { initializeStorage } from './storage.js';
import { checkMetaMaskConnection, connectWallet } from './web3Setup.js';
import { initializeEventListeners } from './uiManager.js';
import { showToast, showLoading, hideLoading } from './utils.js';
import { approveRegistration, rejectRegistration, deleteClass } from './teacher.js';

// Debug logs
console.log('App.js loaded');

// Will initialize these later when DOM is ready
let isInitialized = false;

window.addEventListener('load', () => {
    console.log('Window loaded');
    // Add global error handler
    window.onerror = function (msg, url, line, col, error) {
        console.error('Global error:', { msg, url, line, col, error });
        showToast(`Lỗi: ${msg}`, 'error');
        hideLoading(); // Make sure loading overlay is hidden on error
        return false;
    };
});

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

async function initializeApp() {
    if (isInitialized) {
        console.log('App already initialized');
        return;
    }

    console.log('Starting application initialization...');
    try {
        console.log('Setting up global functions...');
        // Make functions globally available first
        window.connectWallet = connectWallet;
        window.deleteClass = deleteClass;
        window.approveRegistration = approveRegistration;
        window.rejectRegistration = rejectRegistration;

        // Debug check global functions
        console.log('Checking global functions availability:', {
            connectWallet: typeof window.connectWallet,
            deleteClass: typeof window.deleteClass,
            approveRegistration: typeof window.approveRegistration,
            rejectRegistration: typeof window.rejectRegistration
        });

        // Initialize storage
        console.log('Initializing storage...');
        initializeStorage();

        // Check MetaMask initial state
        console.log('Checking initial MetaMask state...');
        if (window.ethereum) {
            console.log('MetaMask detected:', window.ethereum);
        } else {
            console.warn('MetaMask not detected');
        }
        await checkMetaMaskConnection();

        // Initialize UI and event listeners
        console.log('Setting up UI and event listeners...');
        initializeEventListeners();

        isInitialized = true;
        console.log('Application initialization completed successfully');

    } catch (error) {
        console.error('Error during initialization:', error);
        console.error('Stack trace:', error.stack);
        showToast('Lỗi khởi tạo ứng dụng: ' + error.message, 'error');
    }
}