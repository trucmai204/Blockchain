import { isMetaMaskConnected, connectWallet, setRoleDataLoader } from './web3Setup.js';
import { showToast } from './utils.js';
import { loadTeacherData, loadClassDetails, createClass } from './teacher.js';
import { loadStudentData, registerForClass, markAttendance, viewAttendance } from './student.js';

export let currentRole = null;

// Screen Management
export const screens = {
    welcome: document.getElementById('welcomeScreen'),
    role: document.getElementById('roleScreen'),
    main: document.getElementById('mainScreen')
};

export const sections = {
    teacher: document.getElementById('teacherSection'),
    student: document.getElementById('studentSection')
};

// Validate required DOM elements
function validateRequiredElements() {
    const requiredElements = {
        ...screens,
        ...sections,
        buttons: {
            getStarted: document.getElementById('getStartedBtn'),
            backToRole: document.getElementById('backToRoleBtn'),
            teacherRole: document.getElementById('teacherRoleBtn'),
            studentRole: document.getElementById('studentRoleBtn'),
            connectWallet: document.getElementById('connectWallet'),
            createClass: document.getElementById('createClass'),
            registerClass: document.getElementById('registerClass'),
            markAttendance: document.getElementById('markAttendance'),
            viewAttendance: document.getElementById('viewAttendance')
        },
        selectors: {
            classListForTeacher: document.getElementById('classListForTeacher')
        }
    };

    const missingElements = [];

    // Check screens
    Object.entries(screens).forEach(([name, element]) => {
        if (!element) missingElements.push(`Screen: ${name}`);
    });

    // Check sections
    Object.entries(sections).forEach(([name, element]) => {
        if (!element) missingElements.push(`Section: ${name}`);
    });

    // Check buttons
    Object.entries(requiredElements.buttons).forEach(([name, element]) => {
        if (!element) missingElements.push(`Button: ${name}`);
    });

    // Check selectors
    Object.entries(requiredElements.selectors).forEach(([name, element]) => {
        if (!element) missingElements.push(`Selector: ${name}`);
    });

    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        showToast('Lỗi khởi tạo: Thiếu các phần tử giao diện cần thiết', 'error');
        return false;
    }

    return true;
}

export function showScreen(screenName) {
    if (!screens[screenName]) {
        console.error(`Screen ${screenName} not found`);
        return;
    }

    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    screens[screenName].classList.add('active');
}

export function initializeEventListeners() {
    console.log('Initializing event listeners...');

    // Validate all required elements exist
    if (!validateRequiredElements()) {
        return;
    }

    // Set up role data loader callback
    setRoleDataLoader(async () => {
        console.log('Role data loader called, current role:', currentRole);
        try {
            if (currentRole === 'teacher') {
                await loadTeacherData();
            } else if (currentRole === 'student') {
                await loadStudentData();
            } else {
                console.log('No role selected');
            }
        } catch (error) {
            console.error('Error in role data loader:', error);
            showToast('Lỗi khi tải dữ liệu vai trò', 'error');
        }
    });

    // Navigation buttons
    const getStartedBtn = document.getElementById('getStartedBtn');
    getStartedBtn.addEventListener('click', () => {
        showScreen('role');
    });

    const backToRoleBtn = document.getElementById('backToRoleBtn');
    backToRoleBtn.addEventListener('click', () => {
        showScreen('role');
        currentRole = null;
        sections.teacher.style.display = 'none';
        sections.student.style.display = 'none';
    });

    // Role selection
    const teacherRoleBtn = document.getElementById('teacherRoleBtn');
    teacherRoleBtn.addEventListener('click', async () => {
        try {
            currentRole = 'teacher';
            showScreen('main');
            sections.teacher.style.display = 'block';
            sections.student.style.display = 'none';

            if (isMetaMaskConnected) {
                await loadTeacherData();
            } else {
                showToast('Vui lòng kết nối MetaMask trước!', 'error');
            }
        } catch (error) {
            console.error('Error selecting teacher role:', error);
            showToast('Lỗi khi chọn vai trò giáo viên', 'error');
        }
    });

    const studentRoleBtn = document.getElementById('studentRoleBtn');
    studentRoleBtn.addEventListener('click', async () => {
        try {
            currentRole = 'student';
            showScreen('main');
            sections.teacher.style.display = 'none';
            sections.student.style.display = 'block';

            if (isMetaMaskConnected) {
                await loadStudentData();
            } else {
                showToast('Vui lòng kết nối MetaMask trước!', 'error');
            }
        } catch (error) {
            console.error('Error selecting student role:', error);
            showToast('Lỗi khi chọn vai trò sinh viên', 'error');
        }
    });

    // Listen for storage changes to keep data in sync across views
    window.addEventListener('storage', async (e) => {
        if (e.key === 'classes' && isMetaMaskConnected) {
            try {
                if (currentRole === 'student') {
                    await loadStudentData();
                } else if (currentRole === 'teacher') {
                    await loadTeacherData();
                    const classListForTeacher = document.getElementById('classListForTeacher');
                    if (classListForTeacher && classListForTeacher.value) {
                        await loadClassDetails(classListForTeacher.value);
                    }
                }
            } catch (error) {
                console.error('Error handling storage event:', error);
                showToast('Lỗi khi cập nhật dữ liệu', 'error');
            }
        }
    });

    // Initialize MetaMask connection button
    const connectWalletBtn = document.getElementById('connectWallet');
    connectWalletBtn.addEventListener('click', async () => {
        console.log('Connect wallet button clicked');
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask không được cài đặt');
            }
            await connectWallet();
        } catch (error) {
            console.error('Error in connect wallet click handler:', error);
            showToast(error.message || 'Lỗi kết nối MetaMask', 'error');
        }
    });

    // Teacher functions
    const createClassBtn = document.getElementById('createClass');
    createClassBtn.addEventListener('click', createClass);

    const classListForTeacher = document.getElementById('classListForTeacher');
    classListForTeacher.addEventListener('change', async (e) => {
        if (e.target.value) {
            try {
                await loadClassDetails(e.target.value);
            } catch (error) {
                console.error('Error loading class details:', error);
                showToast('Lỗi khi tải thông tin lớp học', 'error');
            }
        }
    });

    // Student functions
    const registerClassBtn = document.getElementById('registerClass');
    registerClassBtn.addEventListener('click', registerForClass);

    const markAttendanceBtn = document.getElementById('markAttendance');
    markAttendanceBtn.addEventListener('click', markAttendance);

    const viewAttendanceBtn = document.getElementById('viewAttendance');
    viewAttendanceBtn.addEventListener('click', viewAttendance);

    console.log('Event listeners initialized successfully');
}
