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

        // Filter and sort valid classes
        const validClasses = classes.filter(classData =>
            classData && classData.id &&
            (!classData.teacher || classData.teacher.toLowerCase() === accounts[0].toLowerCase())
        ).sort((a, b) => a.id - b.id);

        validClasses.forEach(classData => {
            const option = new Option(
                `${classData.name} (${classData.classCode})`,
                classData.id
            );
            teacherSelect.appendChild(option);
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
        const classData = classes.find(c =>
            c && c.id && c.id.toString() === classId.toString() && c.classCode
        );

        if (!classData) {
            showToast('Không tìm thấy thông tin lớp học!', 'error');
            // Reset the teacher's class list to ensure consistency
            await loadTeacherData();
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

        // Update student registration dropdown if it exists
        const studentRegDropdown = document.getElementById('classCodeInput');
        if (studentRegDropdown) {
            const updateRegistrationClassList = window.updateRegistrationClassList;
            if (typeof updateRegistrationClassList === 'function') {
                updateRegistrationClassList();
            }
        }

    } catch (error) {
        console.error('Error creating class:', error);
        showToast('Lỗi khi tạo lớp học!', 'error');
    } finally {
        hideLoading();
    }
}

export async function deleteClass(classId) {
    console.log('Initiating class deletion for ID:', classId);

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

        // Step 1: Validate class and ownership
        const classes = getClasses();
        console.log('Looking for class to delete:', {
            searchId: classId,
            type: typeof classId,
            availableClasses: classes.map(c => ({ id: c.id, type: typeof c.id }))
        });

        // Ensure we compare IDs of the same type
        const parsedClassId = parseInt(classId, 10);
        const classToDelete = classes.find(c =>
            c && c.id && parseInt(c.id, 10) === parsedClassId && c.classCode
        );

        if (!classToDelete) {
            console.error('Class not found or invalid:', {
                searchId: classId,
                parsedId: parsedClassId,
                availableIds: classes.map(c => c.id)
            });
            showToast('Không tìm thấy lớp học!', 'error');
            return;
        }

        console.log('Found class to delete:', {
            id: classToDelete.id,
            name: classToDelete.name,
            code: classToDelete.classCode
        });

        const currentTeacher = accounts[0].toLowerCase();
        const classTeacher = classToDelete.teacher?.toLowerCase();

        if (classTeacher !== currentTeacher) {
            console.error('Unauthorized delete attempt');
            showToast('Bạn không có quyền xóa lớp học này!', 'error');
            return;
        }

        // Step 2: Remove class data with retry mechanism
        let deleteSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries && !deleteSuccess) {
            try {
                // Remove from classes
                const parsedId = parseInt(classId, 10);
                const updatedClasses = classes.filter(c => parseInt(c.id, 10) !== parsedId);

                console.log('Removing class:', {
                    originalCount: classes.length,
                    updatedCount: updatedClasses.length,
                    removedId: parsedId
                });

                await saveClasses(updatedClasses);

                // Remove pending registrations
                const pendingRegistrations = getPendingRegistrations();
                if (pendingRegistrations[classId]) {
                    delete pendingRegistrations[classId];
                    await savePendingRegistrations(pendingRegistrations);
                    console.log('Removed pending registrations for class:', classId);
                }

                // Verify deletion
                const verifyClasses = getClasses();
                const classStillExists = verifyClasses.some(c => parseInt(c.id, 10) === parsedId);

                console.log('Verification check:', {
                    classId: parsedId,
                    exists: classStillExists,
                    totalClasses: verifyClasses.length
                });

                if (!classStillExists) {
                    deleteSuccess = true;
                    console.log('Class deletion verified successfully');
                } else {
                    throw new Error(`Class ${parsedId} still exists after deletion attempt`);
                }
            } catch (error) {
                console.error(`Delete attempt ${retryCount + 1} failed:`, error);
                retryCount++;
                if (retryCount === maxRetries) {
                    throw new Error('Failed to delete class after multiple attempts');
                }
                await new Promise(resolve => setTimeout(resolve, 100)); // Small delay before retry
            }
        }

        showToast('Xóa lớp học thành công!', 'success');

        // Step 3: Update views with verification
        console.log('Starting view updates after deletion');

        const updateAndVerifyViews = async () => {
            const verifyViewUpdates = async () => {
                // Verify teacher view update
                const teacherSelect = document.getElementById('classListForTeacher');
                if (teacherSelect) {
                    const hasClass = Array.from(teacherSelect.options).some(opt =>
                        parseInt(opt.value, 10) === parseInt(classId, 10)
                    );
                    if (hasClass) {
                        console.error('Class still visible in teacher view');
                        return false;
                    }
                }

                // Verify student view updates
                const classSelect = document.getElementById('classCodeInput');
                if (classSelect) {
                    const hasClass = Array.from(classSelect.options).some(opt =>
                        opt.value === classToDelete.classCode
                    );
                    if (hasClass) {
                        console.error('Class still visible in student registration');
                        return false;
                    }
                }
                return true;
            };

            let retryCount = 0;
            while (retryCount < maxRetries) {
                try {
                    // Update teacher view
                    await loadTeacherData();
                    console.log('Teacher view updated');

                    // Update student views
                    const updateFunctions = [
                        window.updateRegistrationClassList,
                        window.updateClassList,
                        window.updateRegistrationStatusUI
                    ].filter(fn => typeof fn === 'function');

                    if (updateFunctions.length > 0) {
                        await Promise.all(updateFunctions.map(fn => fn()));
                        console.log('Student views updated');
                    }

                    // Add small delay for DOM updates
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Verify updates
                    const isVerified = await verifyViewUpdates();
                    if (isVerified) {
                        console.log('View updates verified successfully');
                        return true;
                    }
                    throw new Error('View verification failed');

                } catch (error) {
                    console.error(`View update attempt ${retryCount + 1} failed:`, error);
                    retryCount++;
                    if (retryCount === maxRetries) {
                        throw new Error('Failed to update views completely');
                    }
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            return false;
        };

        const viewsUpdated = await updateAndVerifyViews();
        if (!viewsUpdated) {
            console.error('Could not verify view updates after deletion');
        }
        console.log('Class deletion and view updates completed successfully');

    } catch (error) {
        console.error('Error in deleteClass operation:', error);

        // Determine specific error message
        let errorMessage = 'Lỗi khi xóa lớp học';
        if (error.message.includes('Class still exists')) {
            errorMessage = 'Không thể xóa hoàn toàn lớp học, vui lòng thử lại';
        } else if (error.message.includes('failed to update views')) {
            errorMessage = 'Đã xóa lớp học nhưng chưa cập nhật được giao diện, vui lòng tải lại trang';
        } else if (error.message.includes('verification failed')) {
            errorMessage = 'Không thể xác nhận việc xóa lớp học, vui lòng kiểm tra lại';
        }

        showToast(errorMessage, 'error');

        // Attempt to recover system state
        try {
            console.log('Attempting to recover system state...');

            // Verify current data state
            const currentClasses = getClasses();
            const classExists = currentClasses.some(c =>
                parseInt(c.id, 10) === parseInt(classId, 10)
            );

            console.log('Recovery check:', {
                classId,
                stillExists: classExists,
                totalClasses: currentClasses.length
            });

            // Update all views to ensure consistency
            await loadTeacherData();

            const updateFunctions = [
                window.updateRegistrationClassList,
                window.updateClassList,
                window.updateRegistrationStatusUI
            ].filter(fn => typeof fn === 'function');

            await Promise.all(updateFunctions.map(fn => fn().catch(e =>
                console.error('Error in view update during recovery:', e)
            )));

            console.log('System state recovery completed');

            if (classExists) {
                showToast('Vui lòng thử lại thao tác xóa lớp', 'warning');
            }
        } catch (recoveryError) {
            console.error('Error during system state recovery:', recoveryError);
            showToast('Vui lòng tải lại trang để đồng bộ dữ liệu', 'error');
        }
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

        // Update registration status and save changes
        updateRegistrationStatus(classId, studentAddress, 'approved');
        saveClasses(classes);

        showToast('Đã chấp nhận sinh viên vào lớp!', 'success');

        // Update all views
        await loadClassDetails(classId);

        // Update student views if the functions are available
        if (typeof window.updateClassList === 'function') {
            window.updateClassList();
            console.log('Updated student class list');
        }

        if (typeof window.updateRegistrationClassList === 'function') {
            window.updateRegistrationClassList();
            console.log('Updated student registration list');
        }

        if (typeof window.updateRegistrationStatusUI === 'function') {
            window.updateRegistrationStatusUI();
            console.log('Updated student registration status');
        }

        console.log(`Student ${studentAddress} approved for class ${classId}`);

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
        console.log(`Rejecting student ${studentAddress} for class ${classId}`);

        // Update status
        updateRegistrationStatus(classId, studentAddress, 'rejected');
        showToast('Đã từ chối yêu cầu đăng ký!', 'success');

        // Update all views
        await loadClassDetails(classId);

        // Update student views
        if (typeof window.updateClassList === 'function') {
            window.updateClassList();
            console.log('Updated student class list');
        }

        if (typeof window.updateRegistrationClassList === 'function') {
            window.updateRegistrationClassList();
            console.log('Updated student registration list');
        }

        if (typeof window.updateRegistrationStatusUI === 'function') {
            window.updateRegistrationStatusUI();
            console.log('Updated student registration status');
        }

        console.log('Registration rejection completed successfully');
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
    try {
        console.log('Rendering enrolled students for class:', classData.name);

        // Create section container
        const enrolledSection = document.createElement('div');
        enrolledSection.className = 'enrolled-section';

        // Add header with class info
        const header = document.createElement('h4');
        header.innerHTML = `
            <i class="fas fa-users"></i>
            Sinh viên trong lớp - ${classData.name} (${classData.classCode})
        `;
        enrolledSection.appendChild(header);

        // Create attendance list container
        const attendanceList = document.createElement('div');
        attendanceList.className = 'attendance-list';

        // Track statistics
        let totalStudents = 0;
        let totalAttendances = 0;
        let studentsWithAttendance = 0;

        // Process each student
        classData.students.forEach(studentData => {
            try {
                if (!studentData || !studentData.address) {
                    console.warn('Invalid student data found:', studentData);
                    return;
                }

                totalStudents++;
                const studentAddress = studentData.address.toLowerCase();

                // Get valid attendance records
                const validAttendance = (classData.attendance || [])
                    .filter(a =>
                        a &&
                        typeof a.studentAddress === 'string' &&
                        a.studentAddress.toLowerCase() === studentAddress &&
                        typeof a.timestamp === 'number' &&
                        a.isPresent === true
                    )
                    .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending

                totalAttendances += validAttendance.length;
                if (validAttendance.length > 0) studentsWithAttendance++;

                // Create student item
                const attendanceItem = document.createElement('div');
                attendanceItem.className = 'attendance-item';

                // Format attendance information
                const lastAttendance = validAttendance[0];
                const attendanceInfo = lastAttendance ? `
                    <div class="attendance-details">
                        <div class="attendance-count">
                            <i class="fas fa-calendar-check"></i>
                            Số lần điểm danh: <strong>${validAttendance.length}</strong>
                        </div>
                        <div class="last-attendance">
                            <div class="attendance-time">
                                <i class="fas fa-calendar"></i>
                                Thời gian điểm danh: ${formatDate(lastAttendance.timestamp)}
                            </div>
                            ${lastAttendance.recordedAt ? `
                                <div class="recorded-time">
                                    <i class="fas fa-clock"></i>
                                    Ghi nhận lúc: ${formatDate(lastAttendance.recordedAt)}
                                </div>
                                ${lastAttendance.timestamp !== lastAttendance.recordedAt ? `
                                    <div class="time-difference text-warning">
                                        <i class="fas fa-info-circle"></i>
                                        Ghi nhận muộn ${Math.round((lastAttendance.recordedAt - lastAttendance.timestamp) / 1000)} giây
                                    </div>
                                ` : ''}
                            ` : ''}
                        </div>
                    </div>
                ` : '<div class="no-attendance">Chưa điểm danh lần nào</div>';

                attendanceItem.innerHTML = `
                    <div class="student-info">
                        <i class="fas fa-user-graduate"></i>
                        <span class="address">Địa chỉ ví: ${formatAddress(studentAddress)}</span>
                        <span class="join-date">Tham gia: ${formatDate(studentData.joinedAt)}</span>
                        <span class="status ${studentData.status}">${studentData.status || 'approved'}</span>
                    </div>
                    ${attendanceInfo}
                `;
                attendanceList.appendChild(attendanceItem);

            } catch (error) {
                console.error('Error processing student:', error);
            }
        });

        // Add statistics section
        const statsSection = document.createElement('div');
        statsSection.className = 'class-stats';
        statsSection.innerHTML = `
            <div class="stat-item">
                <i class="fas fa-users"></i>
                Tổng số sinh viên: ${totalStudents}
            </div>
            <div class="stat-item">
                <i class="fas fa-check-circle"></i>
                Số sinh viên đã điểm danh: ${studentsWithAttendance}
            </div>
            <div class="stat-item">
                <i class="fas fa-calendar-check"></i>
                Tổng số lần điểm danh: ${totalAttendances}
            </div>
        `;

        // Assemble and append sections
        enrolledSection.appendChild(statsSection);
        enrolledSection.appendChild(attendanceList);
        enrolledStudents.appendChild(enrolledSection);

        console.log(`Rendered ${totalStudents} students with ${totalAttendances} total attendances`);
    } catch (error) {
        console.error('Error showing enrolled students:', error);
        enrolledStudents.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Có lỗi khi hiển thị danh sách sinh viên</p>
            </div>
        `;
    }
}