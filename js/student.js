import { showToast, formatAddress, formatDate, showLoading, hideLoading } from './utils.js';
import { getClasses, saveClasses, getPendingRegistrations, savePendingRegistrations, addPendingRegistration, addAttendanceRecord } from './storage.js';
import { isMetaMaskConnected, accounts } from './web3Setup.js';

export async function loadStudentData() {
    if (!isMetaMaskConnected) {
        showToast('Vui lòng kết nối MetaMask trước!', 'error');
        return;
    }

    try {
        showLoading();
        updateRegistrationStatusUI();
        updateClassList();
    } catch (error) {
        console.error('Error loading student data:', error);
        showToast('Lỗi khi tải dữ liệu sinh viên!', 'error');
    } finally {
        hideLoading();
    }
}

export async function registerForClass() {
    if (!isMetaMaskConnected) {
        showToast('Vui lòng kết nối MetaMask trước!', 'error');
        return;
    }

    const classCodeInput = document.getElementById('classCodeInput');
    if (!classCodeInput) {
        console.error('Class code input not found');
        return;
    }

    const classCode = classCodeInput.value.trim();
    if (!classCode) {
        showToast('Vui lòng nhập mã lớp!', 'error');
        return;
    }

    try {
        showLoading();
        const classes = getClasses();

        // Find class by class code or ID
        const classData = classes.find(c =>
            c.classCode === classCode || c.id.toString() === classCode
        );

        if (!classData) {
            showToast('Không tìm thấy lớp học! Vui lòng kiểm tra lại mã lớp.', 'error');
            return;
        }

        // Check if student is already in the class
        const isEnrolled = classData.students?.some(s =>
            s.address?.toLowerCase() === accounts[0].toLowerCase()
        );
        if (isEnrolled) {
            showToast('Bạn đã đăng ký vào lớp này!', 'error');
            return;
        }

        // Check for existing pending request
        const pendingRegistrations = getPendingRegistrations();
        const hasPendingRequest = pendingRegistrations[classData.id]?.some(r =>
            r.studentAddress.toLowerCase() === accounts[0].toLowerCase() &&
            r.status === 'pending'
        );

        if (hasPendingRequest) {
            showToast('Bạn đã có yêu cầu đăng ký đang chờ duyệt!', 'error');
            return;
        }

        // Add registration request
        addPendingRegistration(classData.id, accounts[0], classData.name);
        updateRegistrationStatusWithClass(classData);
        showToast('Đã gửi yêu cầu đăng ký! Vui lòng chờ giảng viên phê duyệt.', 'success');
        classCodeInput.value = '';

    } catch (error) {
        console.error('Error registering for class:', error);
        showToast('Lỗi khi đăng ký lớp!', 'error');
    } finally {
        hideLoading();
    }
}

export async function markAttendance() {
    if (!isMetaMaskConnected) {
        showToast('Vui lòng kết nối MetaMask trước!', 'error');
        return;
    }

    const classList = document.getElementById('classList');
    if (!classList) {
        console.error('Class list select not found');
        return;
    }

    const classId = classList.value;
    if (!classId) {
        showToast('Vui lòng chọn lớp học!', 'error');
        return;
    }

    try {
        showLoading();

        // Add attendance record
        addAttendanceRecord(classId, accounts[0], Date.now());
        showToast('Điểm danh thành công!', 'success');

        // Update attendance history UI
        const attendanceHistory = document.getElementById('attendanceHistory');
        if (!attendanceHistory) {
            console.error('Attendance history container not found');
            return;
        }

        // Get class name from select option
        const selectedOption = classList.querySelector(`option[value="${classId}"]`);
        if (!selectedOption) {
            console.error('Selected class option not found');
            return;
        }

        const historyItem = document.createElement('li');
        historyItem.innerHTML = `
            <div class="attendance-record animate__animated animate__fadeInDown">
                <span><i class="fas fa-check-circle"></i> ${selectedOption.textContent}</span>
                <span>${new Date().toLocaleString('vi-VN')}</span>
            </div>
        `;
        attendanceHistory.prepend(historyItem);

    } catch (error) {
        console.error('Error marking attendance:', error);
        showToast('Lỗi khi điểm danh!', 'error');
    } finally {
        hideLoading();
    }
}

export async function viewAttendance() {
    if (!isMetaMaskConnected) {
        showToast('Vui lòng kết nối MetaMask trước!', 'error');
        return;
    }

    const history = document.getElementById('attendanceHistory');
    if (!history) {
        console.error('Attendance history container not found');
        return;
    }

    try {
        showLoading();
        const classes = getClasses();

        let attendanceHTML = '';
        let hasAttendance = false;

        // Get all attendance records for the current student
        for (const classData of classes) {
            const studentAttendance = classData.attendance?.filter(a =>
                a.studentAddress?.toLowerCase() === accounts[0].toLowerCase()
            ) || [];

            for (const record of studentAttendance) {
                hasAttendance = true;
                attendanceHTML = `
                    <li>
                        <div class="attendance-record animate__animated animate__fadeInDown">
                            <span><i class="fas fa-check-circle"></i> ${classData.name}</span>
                            <span>${formatDate(Math.floor(record.timestamp / 1000))}</span>
                        </div>
                    </li>
                ` + attendanceHTML;
            }
        }

        history.innerHTML = hasAttendance ? attendanceHTML : `
            <div class="list-empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>Chưa có lịch sử điểm danh</p>
            </div>
        `;
    } catch (error) {
        console.error('Error viewing attendance:', error);
        showToast('Lỗi khi xem lịch sử điểm danh!', 'error');
    } finally {
        hideLoading();
    }
}

// Helper functions
function updateRegistrationStatusUI() {
    const registrationStatus = document.getElementById('registrationStatus');
    if (!registrationStatus) {
        console.error('Registration status container not found');
        return;
    }

    const pendingRegistrations = getPendingRegistrations();
    let hasPendingRequests = false;
    let pendingHTML = '<div class="pending-registrations">';

    Object.entries(pendingRegistrations).forEach(([classId, requests]) => {
        const pendingRequest = requests.find(r =>
            r.studentAddress.toLowerCase() === accounts[0].toLowerCase() &&
            r.status === 'pending'
        );

        if (pendingRequest) {
            hasPendingRequests = true;
            const className = getClasses().find(c => c.id.toString() === classId)?.name;
            pendingHTML += `
                <div class="pending-request">
                    <i class="fas fa-hourglass-half"></i>
                    <div class="request-info">
                        <strong>${className}</strong>
                        <small>Đã gửi: ${new Date(pendingRequest.timestamp).toLocaleString('vi-VN')}</small>
                    </div>
                    <span class="status pending">Đang chờ duyệt</span>
                </div>
            `;
        }
    });
    pendingHTML += '</div>';

    registrationStatus.innerHTML = hasPendingRequests ? pendingHTML : `
        <div class="list-empty-state">
            <i class="fas fa-inbox"></i>
            <p>Không có đăng ký nào đang chờ duyệt</p>
        </div>
    `;
}

function updateClassList() {
    const myClasses = document.getElementById('myClasses');
    if (!myClasses) {
        console.error('My classes container not found');
        return;
    }

    const noClassesMessage = myClasses.querySelector('.no-classes-message');
    const classAttendanceSection = myClasses.querySelector('.class-attendance-section');
    const classList = document.getElementById('classList');

    if (!noClassesMessage || !classAttendanceSection || !classList) {
        console.error('Required class list elements not found');
        return;
    }

    // Get enrolled classes
    const studentClasses = getClasses().filter(c =>
        c.students?.some(s => s.address?.toLowerCase() === accounts[0].toLowerCase())
    );

    // Update classes UI
    if (studentClasses.length === 0) {
        noClassesMessage.style.display = 'block';
        classAttendanceSection.style.display = 'none';
    } else {
        noClassesMessage.style.display = 'none';
        classAttendanceSection.style.display = 'block';

        classList.innerHTML = '<option value="" disabled selected>Chọn lớp</option>';
        studentClasses.forEach(classData => {
            const option = new Option(classData.name, classData.id);
            classList.appendChild(option);
        });
    }
}

function updateRegistrationStatusWithClass(classData) {
    const registrationStatus = document.getElementById('registrationStatus');
    if (!registrationStatus) {
        console.error('Registration status container not found');
        return;
    }

    registrationStatus.innerHTML = `
        <div class="pending-registrations">
            <div class="pending-request">
                <i class="fas fa-hourglass-half"></i>
                <div class="request-info">
                    <strong>${classData.name}</strong>
                    <small>Đã gửi: ${new Date().toLocaleString('vi-VN')}</small>
                </div>
                <span class="status pending">Đang chờ duyệt</span>
            </div>
        </div>
    `;
}