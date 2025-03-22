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
        exposeGlobalFunctions(); // Expose functions for inter-module communication
        updateRegistrationStatusUI();
        updateClassList();
        updateRegistrationClassList();
    } catch (error) {
        console.error('Error loading student data:', error);
        showToast('Lỗi khi tải dữ liệu sinh viên!', 'error');
    } finally {
        hideLoading();
    }
}

// Export functions for inter-module communication
function exposeGlobalFunctions() {
    window.updateRegistrationClassList = updateRegistrationClassList;
    window.updateClassList = updateClassList;
    window.updateRegistrationStatusUI = updateRegistrationStatusUI;
}

// Function to populate registration class dropdown
export function updateRegistrationClassList() {
    // Function implementation remains the same
    const classSelect = document.getElementById('classCodeInput');
    if (!classSelect) {
        console.error('Class registration select not found');
        return;
    }

    // Get and filter valid classes
    const classes = getClasses();
    const currentUserAddress = accounts[0].toLowerCase();

    // Clear existing options except the first placeholder
    while (classSelect.options.length > 1) {
        classSelect.remove(1);
    }

    // Filter valid classes and sort by ID
    const validClasses = classes
        .filter(classData => classData && classData.id && classData.classCode)
        .sort((a, b) => a.id - b.id);

    // Add classes that the student hasn't enrolled in or requested yet
    validClasses.forEach(classData => {
        // Check if student is already enrolled
        const isEnrolled = classData.students?.some(s =>
            s.address?.toLowerCase() === currentUserAddress
        );

        // Check if student has a pending request
        const pendingRegistrations = getPendingRegistrations();
        const hasPendingRequest = pendingRegistrations[classData.id]?.some(r =>
            r.studentAddress.toLowerCase() === currentUserAddress &&
            r.status === 'pending'
        );

        // Only add classes where student is not enrolled and has no pending request
        if (!isEnrolled && !hasPendingRequest) {
            const option = new Option(
                `${classData.name} (${classData.classCode})`,
                classData.classCode
            );
            classSelect.appendChild(option);
        }
    });
}

export async function registerForClass() {
    if (!isMetaMaskConnected) {
        showToast('Vui lòng kết nối MetaMask trước!', 'error');
        return;
    }

    const classSelect = document.getElementById('classCodeInput');
    if (!classSelect) {
        console.error('Class select not found');
        return;
    }

    const selectedClassCode = classSelect.value;
    if (!selectedClassCode) {
        showToast('Vui lòng chọn lớp học!', 'error');
        return;
    }

    try {
        showLoading();
        const classes = getClasses();

        // Find selected class
        const classData = classes.find(c => c.classCode === selectedClassCode);
        if (!classData) {
            showToast('Lỗi: Không tìm thấy thông tin lớp học đã chọn!', 'error');
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

        // Reset dropdown and update available classes
        classSelect.selectedIndex = 0;
        updateRegistrationClassList();

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

        try {
            // Add attendance record and get result
            await addAttendanceRecord(classId, accounts[0], Date.now());
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
            console.error('Error in attendance operation:', error);
            if (error.message.includes('last 24 hours')) {
                showToast('Bạn đã điểm danh trong 24 giờ qua!', 'error');
            } else if (error.message.includes('not enrolled')) {
                showToast('Bạn chưa được chấp nhận vào lớp này!', 'error');
            } else {
                showToast('Lỗi khi điểm danh: ' + error.message, 'error');
            }
            return;
        }

    } catch (error) {
        console.error('Error in attendance process:', error);
        showToast('Lỗi hệ thống khi điểm danh!', 'error');
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
        const classes = getClasses().filter(c => c && c.id && c.classCode); // Get only valid classes

        let attendanceHTML = '';
        let hasAttendance = false;
        let allRecords = [];

        // Collect all valid attendance records
        for (const classData of classes) {
            try {
                const records = classData.attendance?.filter(a =>
                    a &&
                    typeof a.studentAddress === 'string' &&
                    a.studentAddress.toLowerCase() === accounts[0].toLowerCase() &&
                    typeof a.timestamp === 'number' &&
                    typeof a.isPresent === 'boolean'
                ) || [];

                records.forEach(record => {
                    allRecords.push({
                        ...record,
                        className: classData.name
                    });
                });
            } catch (error) {
                console.warn(`Error processing attendance for class ${classData.id}:`, error);
                continue;
            }
        }

        // Sort records by timestamp (newest first) and generate HTML
        if (allRecords.length > 0) {
            hasAttendance = true;
            allRecords
                .sort((a, b) => b.timestamp - a.timestamp)
                .forEach(record => {
                    attendanceHTML += `
                        <li>
                            <div class="attendance-record animate__animated animate__fadeInDown">
                                <span><i class="fas fa-check-circle"></i> ${record.className}</span>
                                <span>${formatDate(Math.floor(record.timestamp / 1000))}</span>
                            </div>
                        </li>
                    `;
                });
        }

        history.innerHTML = hasAttendance ? attendanceHTML : `
            <div class="list-empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>Chưa có lịch sử điểm danh</p>
            </div>
        `;

        console.log(`Loaded ${allRecords.length} attendance records`);
    } catch (error) {
        console.error('Error viewing attendance:', error);
        showToast('Lỗi khi xem lịch sử điểm danh!', 'error');
    } finally {
        hideLoading();
    }
}

// Helper functions
function updateRegistrationStatusUI() {
    try {
        const registrationStatus = document.getElementById('registrationStatus');
        if (!registrationStatus) {
            console.error('Registration status container not found');
            return;
        }

        const pendingRegistrations = getPendingRegistrations();
        const validClasses = getClasses().filter(c => c && c.id && c.classCode);
        let hasPendingRequests = false;
        let pendingHTML = '<div class="pending-registrations">';
        let validRequestCount = 0;
        let invalidRequestCount = 0;

        Object.entries(pendingRegistrations).forEach(([classId, requests]) => {
            // Validate class exists and is valid
            const classData = validClasses.find(c => c.id.toString() === classId);
            if (!classData) {
                console.warn(`Skipping invalid class ID: ${classId}`);
                invalidRequestCount++;
                return;
            }

            if (!Array.isArray(requests)) {
                console.warn(`Invalid request format for class ${classId}`);
                invalidRequestCount++;
                return;
            }

            // Find valid pending request for current user
            const pendingRequest = requests.find(r =>
                r &&
                typeof r.studentAddress === 'string' &&
                r.studentAddress.toLowerCase() === accounts[0].toLowerCase() &&
                r.status === 'pending' &&
                typeof r.timestamp === 'number'
            );

            if (pendingRequest) {
                hasPendingRequests = true;
                validRequestCount++;

                pendingHTML += `
                    <div class="pending-request">
                        <i class="fas fa-hourglass-half"></i>
                        <div class="request-info">
                            <strong>${classData.name}</strong>
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

        console.log(`Registration status updated - Valid requests: ${validRequestCount}, Invalid: ${invalidRequestCount}`);
    } catch (error) {
        console.error('Error updating registration status:', error);
        // Show empty state in case of error
        registrationStatus.innerHTML = `
            <div class="list-empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Có lỗi khi tải trạng thái đăng ký</p>
            </div>
        `;
    }
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
    const classes = getClasses();
    const studentClasses = classes
        .filter(c =>
            c && c.id && c.classCode && // Ensure valid class data
            c.students?.some(s => s.address?.toLowerCase() === accounts[0].toLowerCase())
        )
        .sort((a, b) => a.id - b.id); // Sort by ID for consistency

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