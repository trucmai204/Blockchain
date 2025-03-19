import { showToast, formatAddress, formatDate, showLoading, hideLoading } from './utils.js';
import { getClasses, saveClasses, getPendingRegistrations, savePendingRegistrations, updateRegistrationStatus } from './storage.js';
import { isMetaMaskConnected, accounts } from './web3Setup.js';

export async function loadTeacherData() {
    if (!isMetaMaskConnected) return;

    try {
        showLoading();
        const classes = getClasses();
        const teacherSelect = document.getElementById('classListForTeacher');
        if (!teacherSelect) {
            console.error('Teacher class list select not found');
            return;
        }

        teacherSelect.innerHTML = '<option value="" disabled selected>Chọn lớp</option>';

        classes.forEach(classData => {
            if (!classData.teacher || classData.teacher.toLowerCase() === accounts[0].toLowerCase()) {
                const option = new Option(classData.name, classData.id);
                teacherSelect.appendChild(option);
            }
        });

        if (teacherSelect.options.length > 1) {
            teacherSelect.selectedIndex = 1;
            await loadClassDetails(teacherSelect.value);
        }
    } catch (error) {
        console.error('Error loading teacher data:', error);
        showToast('Lỗi khi tải dữ liệu giáo viên!', 'error');
    } finally {
        hideLoading();
    }
}

export async function loadClassDetails(classId) {
    if (!isMetaMaskConnected) return;

    try {
        showLoading();
        const classes = getClasses();
        const classData = classes.find(c => c.id.toString() === classId.toString());

        if (!classData) {
            showToast('Không tìm thấy thông tin lớp học!', 'error');
            return;
        }

        const enrolledStudents = document.getElementById('enrolledStudents');
        if (!enrolledStudents) {
            console.error('Enrolled students container not found');
            return;
        }

        enrolledStudents.innerHTML = ''; // Clear existing content

        // Class actions section
        const classActions = document.createElement('div');
        classActions.className = 'class-actions';

        // Create delete button using the same helper function
        const deleteBtn = createButton('danger', 'trash', 'Xóa Lớp Học', () => deleteClass(classId));
        classActions.appendChild(deleteBtn);
        enrolledStudents.appendChild(classActions);

        // Pending registrations section
        const pendingRegistrations = getPendingRegistrations();
        const pendingRequests = (pendingRegistrations[classId] || []).filter(r => r.status === 'pending');

        if (pendingRequests.length > 0) {
            const pendingSection = createPendingRegistrationsSection(pendingRequests, classId);
            enrolledStudents.appendChild(pendingSection);
        }

        // Enrolled students section
        if (!classData.students || classData.students.length === 0) {
            showEmptyStudentsList(enrolledStudents);
            return;
        }

        showEnrolledStudents(classData, enrolledStudents);

    } catch (error) {
        console.error('Error loading class details:', error);
        showToast('Lỗi khi tải thông tin lớp học!', 'error');
    } finally {
        hideLoading();
    }
}

export async function createClass() {
    if (!isMetaMaskConnected) {
        showToast('Vui lòng kết nối MetaMask trước!', 'error');
        return;
    }

    const nameInput = document.getElementById('className');
    const codeInput = document.getElementById('classCode');

    if (!nameInput || !codeInput) {
        console.error('Class input elements not found');
        return;
    }

    const name = nameInput.value.trim();
    const classCode = codeInput.value.trim();

    if (!name || !classCode) {
        showToast('Vui lòng nhập đầy đủ thông tin lớp học!', 'error');
        return;
    }

    try {
        showLoading();
        const classes = getClasses();

        if (classes.some(c => c.classCode === classCode)) {
            showToast('Mã lớp này đã tồn tại!', 'error');
            return;
        }

        const maxId = classes.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0);
        const newClass = {
            id: maxId + 1,
            classCode: classCode,
            name: name,
            teacher: accounts[0],
            students: [],
            attendance: []
        };

        classes.push(newClass);
        saveClasses(classes);

        showToast(`Tạo lớp học thành công! Mã lớp: ${classCode}`, 'success');
        nameInput.value = '';
        codeInput.value = '';

        await loadTeacherData();

    } catch (error) {
        console.error('Error creating class:', error);
        showToast('Lỗi khi tạo lớp học!', 'error');
    } finally {
        hideLoading();
    }
}

export async function deleteClass(classId) {
    console.log('Deleting class:', classId);

    if (!isMetaMaskConnected) {
        console.error('MetaMask not connected');
        showToast('Vui lòng kết nối MetaMask trước!', 'error');
        return;
    }

    if (!confirm('Bạn có chắc chắn muốn xóa lớp học này không?')) {
        console.log('User cancelled class deletion');
        return;
    }

    try {
        showLoading();
        console.log('Getting classes data...');
        const classes = getClasses();
        const classIndex = classes.findIndex(c => c.id === classId);

        if (classIndex === -1) {
            console.error('Class not found:', classId);
            showToast('Không tìm thấy lớp học!', 'error');
            return;
        }

        // Verify teacher is the owner
        const currentTeacher = accounts[0].toLowerCase();
        const classTeacher = classes[classIndex].teacher?.toLowerCase();
        console.log('Verifying ownership:', { currentTeacher, classTeacher });

        if (classTeacher !== currentTeacher) {
            console.error('Unauthorized delete attempt');
            showToast('Bạn không có quyền xóa lớp học này!', 'error');
            return;
        }

        // Remove the class
        classes.splice(classIndex, 1);
        saveClasses(classes);

        showToast('Xóa lớp học thành công!', 'success');
        await loadTeacherData();

    } catch (error) {
        console.error('Error in deleteClass:', error);
        showToast('Lỗi khi xóa lớp học!', 'error');
    } finally {
        hideLoading();
    }
}

export async function approveRegistration(classId, studentAddress) {
    console.log('Approving registration:', { classId, studentAddress });
    if (!isMetaMaskConnected) {
        console.error('MetaMask not connected');
        showToast('Vui lòng kết nối MetaMask trước!', 'error');
        return;
    }

    try {
        showLoading();
        const classes = getClasses();
        const classData = classes.find(c => c.id.toString() === classId.toString());

        if (!classData) {
            console.error('Class not found:', classId);
            showToast('Không tìm thấy lớp học!', 'error');
            return;
        }

        if (classData.teacher?.toLowerCase() !== accounts[0].toLowerCase()) {
            console.error('Not authorized - Current teacher:', accounts[0], 'Class teacher:', classData.teacher);
            showToast('Bạn không có quyền phê duyệt cho lớp này!', 'error');
            return;
        }

        // Add student to class
        if (!classData.students) classData.students = [];
        classData.students.push({
            address: studentAddress,
            joinedAt: Date.now(),
            status: 'approved'
        });

        // Update registration status
        updateRegistrationStatus(classId, studentAddress, 'approved');
        saveClasses(classes);

        showToast('Đã chấp nhận sinh viên vào lớp!', 'success');
        await loadClassDetails(classId);

    } catch (error) {
        console.error('Error in approveRegistration:', error);
        showToast('Lỗi khi phê duyệt đăng ký!', 'error');
    } finally {
        hideLoading();
    }
}

export async function rejectRegistration(classId, studentAddress) {
    console.log('Rejecting registration:', { classId, studentAddress });
    if (!isMetaMaskConnected) {
        console.error('MetaMask not connected');
        showToast('Vui lòng kết nối MetaMask trước!', 'error');
        return;
    }

    try {
        showLoading();
        updateRegistrationStatus(classId, studentAddress, 'rejected');
        showToast('Đã từ chối yêu cầu đăng ký!', 'success');
        await loadClassDetails(classId);
    } catch (error) {
        console.error('Error in rejectRegistration:', error);
        showToast('Lỗi khi từ chối đăng ký!', 'error');
    } finally {
        hideLoading();
    }
}

// Helper functions
function createButton(type, icon, text, handler) {
    console.log('Creating button:', { type, icon, text });
    const button = document.createElement('button');
    button.className = `btn btn-${type}`;
    button.innerHTML = `<i class="fas fa-${icon}"></i> ${text}`;
    button.onclick = handler;
    return button;
}

function createPendingRegistrationsSection(pendingRequests, classId) {
    const pendingSection = document.createElement('div');
    pendingSection.className = 'pending-section';

    // Add header
    const header = document.createElement('h4');
    header.innerHTML = `<i class="fas fa-user-clock"></i> Yêu cầu đăng ký chờ duyệt (${pendingRequests.length})`;
    pendingSection.appendChild(header);

    // Create pending list
    const pendingList = document.createElement('div');
    pendingList.className = 'pending-list';

    // Add each request
    pendingRequests.forEach(request => {
        const item = document.createElement('div');
        item.className = 'pending-item';

        // Student info
        const info = document.createElement('div');
        info.className = 'student-info';
        info.innerHTML = `
            <i class="fas fa-user"></i>
            <span>${formatAddress(request.studentAddress)}</span>
            <small>Yêu cầu lúc: ${new Date(request.timestamp).toLocaleString('vi-VN')}</small>
        `;

        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'actions';

        // Approve button
        const approveBtn = createButton('success', 'check', 'Chấp nhận', () => approveRegistration(classId, request.studentAddress));

        // Reject button
        const rejectBtn = createButton('danger', 'times', 'Từ chối', () => rejectRegistration(classId, request.studentAddress));

        // Add buttons to actions
        actions.appendChild(approveBtn);
        actions.appendChild(rejectBtn);

        // Combine all elements
        item.appendChild(info);
        item.appendChild(actions);
        pendingList.appendChild(item);
    });

    pendingSection.appendChild(pendingList);
    return pendingSection;
}

function showEmptyStudentsList(enrolledStudents) {
    const enrolledSection = document.createElement('div');
    enrolledSection.className = 'enrolled-section';
    enrolledSection.innerHTML = `
        <h4><i class="fas fa-users"></i> Sinh viên trong lớp</h4>
        <div class="list-empty-state">
            <i class="fas fa-users-slash"></i>
            <p>Chưa có sinh viên trong lớp</p>
        </div>
    `;
    enrolledStudents.appendChild(enrolledSection);
}

function showEnrolledStudents(classData, enrolledStudents) {
    const attendanceList = document.createElement('div');
    attendanceList.className = 'attendance-list';

    classData.students.forEach(studentData => {
        const attendance = classData.attendance?.filter(a => a.studentAddress === studentData.address) || [];
        if (attendance.length > 0) {
            const lastAttendance = attendance[attendance.length - 1];
            const attendanceItem = document.createElement('div');
            attendanceItem.className = 'attendance-item';
            attendanceItem.innerHTML = `
                <div class="student-info">
                    <i class="fas fa-user-graduate"></i>
                    <span>Địa chỉ ví: ${formatAddress(studentData.address)}</span>
                </div>
                <div class="attendance-details">
                    <div><i class="fas fa-calendar-check"></i> Số lần điểm danh: ${attendance.length}</div>
                    <div><i class="fas fa-clock"></i> Lần cuối: ${formatDate(lastAttendance.timestamp)}</div>
                </div>
            `;
            attendanceList.appendChild(attendanceItem);
        }
    });

    enrolledStudents.appendChild(attendanceList);
}