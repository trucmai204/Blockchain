import { contractABI, contractAddress } from './config.js';
import { formatAddress, showToast, showLoading, hideLoading } from './utils.js';
// Instead of importing currentRole, we'll get it through a callback
let loadRoleData = null;

export function setRoleDataLoader(callback) {
    loadRoleData = callback;
    console.log('Role data loader set:', typeof loadRoleData);
}

export let web3;
export let contract;
export let accounts;
export let isMetaMaskConnected = false;

export async function checkMetaMaskConnection() {
    console.log('Checking MetaMask connection...', {
        hasEthereum: !!window.ethereum,
        networkVersion: window.ethereum?.networkVersion,
        selectedAddress: window.ethereum?.selectedAddress
    });

    updateMetaMaskStatus('Checking connection...');

    if (!window.ethereum) {
        console.error('MetaMask không được cài đặt');
        updateMetaMaskStatus('MetaMask not installed');
        document.getElementById('metaMaskStatus').style.display = 'block';
        return;
    }

    // Log network info
    try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Current chain ID:', chainId);
        updateMetaMaskStatus(`Connected to network: ${chainId}`);
    } catch (err) {
        console.error('Error getting chain ID:', err);
    }

    web3 = new Web3(window.ethereum);
    console.log('Web3 initialized with provider:', web3.currentProvider);
    try {
        accounts = await web3.eth.getAccounts();
        console.log('Current accounts:', accounts);

        if (accounts.length > 0) {
            console.log('MetaMask account found, initializing contract...');
            isMetaMaskConnected = true;

            try {
                contract = new web3.eth.Contract(contractABI, contractAddress);
                console.log('Contract initialized successfully:', contract);
                console.log('Contract address:', contractAddress);
                console.log('Contract ABI:', contractABI);
                updateWalletUI(accounts[0]);
            } catch (contractError) {
                console.error('Contract initialization error:', contractError);
                showToast('Lỗi khởi tạo hợp đồng: ' + (contractError.message || 'Không xác định'), 'error');
            }
        } else {
            console.log('No accounts found - user needs to connect');
            showToast('Không tìm thấy tài khoản MetaMask. Vui lòng kết nối!', 'error');
        }
    } catch (error) {
        console.error('Chi tiết lỗi kết nối MetaMask:', {
            error,
            code: error.code,
            message: error.message,
            stack: error.stack
        });
    }
}

export async function connectWallet() {
    console.log('ConnectWallet function called');
    console.log('window.ethereum status:', {
        exists: !!window.ethereum,
        isConnected: window.ethereum?.isConnected?.(),
        selectedAddress: window.ethereum?.selectedAddress,
        chainId: window.ethereum?.chainId
    });

    if (!window.ethereum) {
        console.log('MetaMask not found');
        showToast('Vui lòng cài đặt tiện ích MetaMask trên trình duyệt!', 'error');
        return;
    }

    try {
        showLoading();
        console.log('Requesting MetaMask accounts...');

        // First try to request accounts directly
        try {
            accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
        } catch (error) {
            if (error.code === 4001) {
                // User rejected request - try one more time with permissions request
                console.log('First attempt rejected, trying with permissions request...');
                await window.ethereum.request({
                    method: 'wallet_requestPermissions',
                    params: [{ eth_accounts: {} }]
                });
                accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
            } else {
                throw error;
            }
        }
        console.log('MetaMask accounts:', accounts);
        isMetaMaskConnected = true;

        web3 = new Web3(window.ethereum);
        console.log('Web3 instance created');

        contract = new web3.eth.Contract(contractABI, contractAddress);
        console.log('Contract instance created');

        updateWalletUI(accounts[0]);
        showToast('Kết nối MetaMask thành công!', 'success');

        // Load role-specific data using callback
        if (loadRoleData) {
            console.log('Loading role-specific data...');
            await loadRoleData();
        } else {
            console.log('No role data loader available');
        }
    } catch (error) {
        console.error('Error connecting to MetaMask:', error);

        // Log detailed error information
        console.error('MetaMask connection error:', {
            error,
            code: error.code,
            message: error.message,
            stack: error.stack
        });

        let errorMessage = 'Lỗi kết nối MetaMask!';
        if (error.code) {
            switch (error.code) {
                case 4001:
                    errorMessage = 'Bạn đã từ chối kết nối với MetaMask';
                    break;
                case -32002:
                    errorMessage = 'Đã có yêu cầu kết nối MetaMask đang chờ xử lý. Vui lòng kiểm tra MetaMask!';
                    break;
                case -32603:
                    errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối!';
                    break;
                default:
                    errorMessage = `Lỗi kết nối: ${error.message || 'Không xác định'} (Code: ${error.code})`;
            }
        }

        showToast(errorMessage, 'error');
        updateMetaMaskStatus(`Error: ${errorMessage}`);
    } finally {
        hideLoading();
    }
}
function updateMetaMaskStatus(status) {
    console.log('MetaMask status:', status);
    const statusElement = document.getElementById('metaMaskStatusText');
    if (statusElement) {
        statusElement.textContent = status;
        document.getElementById('metaMaskStatus').style.display = 'block';
    }
}

function updateWalletUI(address) {
    console.log('Updating wallet UI with address:', address);
    const walletAddressElement = document.getElementById('walletAddress');

    if (!walletAddressElement) {
        console.error('Wallet address element not found');
        return;
    }

    walletAddressElement.innerHTML = `
        <i class="fas fa-check-circle"></i> Đã kết nối: ${formatAddress(address)}
    `;
    walletAddressElement.classList.remove('not-connected');
    walletAddressElement.classList.add('connected');

    // Update status
    updateMetaMaskStatus('Connected to MetaMask');
}

// Initialize MetaMask event handlers
function initializeMetaMaskEvents() {
    console.log('Initializing MetaMask events...');

    if (!window.ethereum) {
        console.warn('MetaMask event initialization skipped - ethereum not available');
        return;
    }

    // Remove any existing listeners to prevent duplicates
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
    window.ethereum.removeListener('connect', handleConnect);
    window.ethereum.removeListener('disconnect', handleDisconnect);

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('connect', handleConnect);
    window.ethereum.on('disconnect', handleDisconnect);

    console.log('MetaMask event handlers initialized');
}

// Event handler functions
async function handleAccountsChanged(newAccounts) {
    console.log('accountsChanged event:', newAccounts);
    if (newAccounts.length === 0) {
        isMetaMaskConnected = false;
        document.getElementById('walletAddress').innerHTML = '<i class="fas fa-circle"></i> Chưa kết nối';
        document.getElementById('walletAddress').classList.remove('connected');
        document.getElementById('walletAddress').classList.add('not-connected');
        showToast('Đã ngắt kết nối MetaMask!', 'error');
    } else {
        accounts = newAccounts;
        isMetaMaskConnected = true;
        if (loadRoleData) {
            console.log('Account changed, reloading role data...');
            await loadRoleData();
        } else {
            console.log('Account changed but no role data loader available');
        }
    }
}

function handleChainChanged() {
    window.location.reload();
}

function handleConnect(connectInfo) {
    console.log('MetaMask connected:', connectInfo);
}

function handleDisconnect(error) {
    console.log('MetaMask disconnected:', error);
}

// Initialize events when the module loads
initializeMetaMaskEvents();
