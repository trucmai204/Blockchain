// Validate class data structure
function validateClassData(classData) {
    return classData &&
        typeof classData === 'object' &&
        Number.isInteger(classData.id) &&
        typeof classData.name === 'string' &&
        typeof classData.classCode === 'string' &&
        Array.isArray(classData.students) &&
        Array.isArray(classData.attendance);
}

// Initialize empty class data
const defaultClasses = [];

// Storage keys
const STORAGE_KEYS = {
    PENDING_REGISTRATIONS: 'pendingRegistrations',
    APPROVED_STUDENTS: 'approvedStudents',
    CLASSES: 'classes'
};

// Clear all storage data
export function clearStorage() {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        console.log('All storage data cleared successfully');
    } catch (error) {
        console.error('Error clearing storage:', error);
        throw error;
    }
}

// Initialize storage with empty data
export function initializeStorage(reset = false) {
    try {
        if (reset) {
            console.log('Resetting all storage data...');
            clearStorage();
        }

        // Always initialize with empty data structures
        localStorage.setItem(STORAGE_KEYS.PENDING_REGISTRATIONS, JSON.stringify({}));
        localStorage.setItem(STORAGE_KEYS.APPROVED_STUDENTS, JSON.stringify({}));
        localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify([]));

        // Verify initialization
        const classes = getClasses();
        const pendingRegs = getPendingRegistrations();

        console.log('Storage initialized with empty data:', {
            classesCount: classes.length,
            pendingRegistrationsCount: Object.keys(pendingRegs).length
        });

        return true;
    } catch (error) {
        console.error('Error initializing storage:', error);
        throw new Error('Failed to initialize storage system');
    }
}

// Class Management Functions
export function getClasses() {
    try {
        const classesData = localStorage.getItem(STORAGE_KEYS.CLASSES);
        if (!classesData) {
            console.warn('No classes data found, returning empty array');
            return [];
        }

        const classes = JSON.parse(classesData);
        if (!Array.isArray(classes)) {
            console.error('Invalid classes data format', classes);
            return [];
        }

        // Filter and validate each class
        const validClasses = classes.filter(classData => {
            const isValid = validateClassData(classData);
            if (!isValid) {
                console.warn('Invalid class data found:', classData);
            }
            return isValid;
        });

        return validClasses;
    } catch (error) {
        console.error('Error getting classes:', error);
        return [];
    }
}

export function saveClasses(classes) {
    try {
        if (!Array.isArray(classes)) {
            throw new Error('Classes must be an array');
        }

        // Validate each class before saving
        const validClasses = classes.filter(classData => {
            const isValid = validateClassData(classData);
            if (!isValid) {
                console.warn('Skipping invalid class data:', classData);
            }
            return isValid;
        });

        localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(validClasses));
        console.log('Classes saved successfully:', validClasses.length);
    } catch (error) {
        console.error('Error saving classes:', error);
        throw error; // Re-throw to handle in UI
    }
}

export function getClassById(classId) {
    try {
        if (!classId) {
            console.warn('No classId provided');
            return null;
        }

        const classes = getClasses();
        const classData = classes.find(c => c.id.toString() === classId.toString());

        if (!classData) {
            console.warn(`Class not found with id: ${classId}`);
            return null;
        }

        if (!validateClassData(classData)) {
            console.error(`Invalid class data found for id: ${classId}`, classData);
            return null;
        }

        return classData;
    } catch (error) {
        console.error('Error getting class by id:', error);
        return null;
    }
}

export function updateClass(updatedClass) {
    try {
        if (!validateClassData(updatedClass)) {
            throw new Error('Invalid class data');
        }

        const classes = getClasses();
        const index = classes.findIndex(c => c.id === updatedClass.id);

        if (index === -1) {
            console.warn(`Class not found for update: ${updatedClass.id}`);
            return false;
        }

        classes[index] = updatedClass;
        saveClasses(classes);
        console.log(`Class ${updatedClass.id} updated successfully`);
        return true;
    } catch (error) {
        console.error('Error updating class:', error);
        return false;
    }
}

// Registration data validation
function validateRegistration(registration) {
    return registration &&
        typeof registration === 'object' &&
        typeof registration.studentAddress === 'string' &&
        typeof registration.className === 'string' &&
        typeof registration.timestamp === 'number' &&
        ['pending', 'approved', 'rejected'].includes(registration.status);
}

// Registration Management Functions
export function getPendingRegistrations() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PENDING_REGISTRATIONS);
        if (!data) {
            console.warn('No pending registrations found');
            return {};
        }

        const registrations = JSON.parse(data);
        if (typeof registrations !== 'object' || registrations === null) {
            console.error('Invalid registrations data format');
            return {};
        }

        // Validate registrations
        const validRegistrations = {};
        Object.entries(registrations).forEach(([classId, regs]) => {
            if (!Array.isArray(regs)) {
                console.warn(`Invalid registrations array for class ${classId}`);
                return;
            }

            validRegistrations[classId] = regs.filter(reg => {
                const isValid = validateRegistration(reg);
                if (!isValid) {
                    console.warn(`Invalid registration found in class ${classId}:`, reg);
                }
                return isValid;
            });
        });

        return validRegistrations;
    } catch (error) {
        console.error('Error getting pending registrations:', error);
        return {};
    }
}

export function savePendingRegistrations(registrations) {
    try {
        if (typeof registrations !== 'object' || registrations === null) {
            throw new Error('Invalid registrations format');
        }

        // Validate before saving
        Object.entries(registrations).forEach(([classId, regs]) => {
            if (!Array.isArray(regs)) {
                throw new Error(`Invalid registrations array for class ${classId}`);
            }
            regs.forEach(reg => {
                if (!validateRegistration(reg)) {
                    throw new Error(`Invalid registration data in class ${classId}`);
                }
            });
        });

        localStorage.setItem(STORAGE_KEYS.PENDING_REGISTRATIONS, JSON.stringify(registrations));
        console.log('Registrations saved successfully');
    } catch (error) {
        console.error('Error saving registrations:', error);
        throw error;
    }
}

export function addPendingRegistration(classId, studentAddress, className) {
    try {
        if (!classId || !studentAddress || !className) {
            throw new Error('Missing required registration data');
        }

        // Verify class exists
        const classData = getClassById(classId);
        if (!classData) {
            throw new Error(`Class not found with id: ${classId}`);
        }

        const registrations = getPendingRegistrations();
        if (!registrations[classId]) {
            registrations[classId] = [];
        }

        // Check for existing pending registration
        const existingReg = registrations[classId].find(
            r => r.studentAddress.toLowerCase() === studentAddress.toLowerCase() &&
                r.status === 'pending'
        );

        if (existingReg) {
            throw new Error('Student already has a pending registration for this class');
        }

        const newReg = {
            studentAddress,
            className,
            timestamp: Date.now(),
            status: 'pending'
        };

        if (!validateRegistration(newReg)) {
            throw new Error('Invalid registration data format');
        }

        registrations[classId].push(newReg);
        savePendingRegistrations(registrations);
        console.log(`Registration added for class ${classId} by student ${studentAddress}`);
        return true;
    } catch (error) {
        console.error('Error adding registration:', error);
        throw error;
    }
}

export function updateRegistrationStatus(classId, studentAddress, status) {
    try {
        if (!classId || !studentAddress || !['pending', 'approved', 'rejected'].includes(status)) {
            throw new Error('Invalid registration update data');
        }

        const registrations = getPendingRegistrations();
        const classRegistrations = registrations[classId] || [];
        const registrationIndex = classRegistrations.findIndex(
            r => r.studentAddress.toLowerCase() === studentAddress.toLowerCase()
        );

        if (registrationIndex === -1) {
            throw new Error(`Registration not found for student ${studentAddress} in class ${classId}`);
        }

        classRegistrations[registrationIndex].status = status;
        registrations[classId] = classRegistrations;
        savePendingRegistrations(registrations);
        console.log(`Registration status updated to ${status} for student ${studentAddress} in class ${classId}`);
        return true;
    } catch (error) {
        console.error('Error updating registration status:', error);
        throw error;
    }
}

// Attendance record validation
function validateAttendanceRecord(record) {
    const isValid = record &&
        typeof record === 'object' &&
        typeof record.studentAddress === 'string' &&
        typeof record.timestamp === 'number' &&
        typeof record.recordedAt === 'number' &&
        typeof record.isPresent === 'boolean' &&
        record.timestamp > 0 &&
        record.recordedAt > 0;

    if (!isValid) {
        console.warn('Invalid attendance record format:', record);
    } else {
        // Verify timestamps are reasonable
        const now = Date.now();
        const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
        if (record.timestamp > now || record.timestamp < oneYearAgo) {
            console.warn('Suspicious timestamp in attendance record:', {
                record,
                timestamp: new Date(record.timestamp).toLocaleString('vi-VN')
            });
        }
    }

    return isValid;
}

// Attendance Management Functions
export function addAttendanceRecord(classId, studentAddress, timestamp) {
    try {
        if (!classId || !studentAddress || !timestamp) {
            throw new Error('Missing required attendance data');
        }

        const classes = getClasses();
        const classIndex = classes.findIndex(c => c.id.toString() === classId.toString());

        if (classIndex === -1) {
            throw new Error(`Class not found with id: ${classId}`);
        }

        // Check if student is enrolled in the class
        const isEnrolled = classes[classIndex].students?.some(
            s => s.address.toLowerCase() === studentAddress.toLowerCase()
        );

        if (!isEnrolled) {
            throw new Error('Student is not enrolled in this class');
        }

        // Initialize attendance array if needed
        if (!classes[classIndex].attendance) {
            classes[classIndex].attendance = [];
        }

        // Check for duplicate attendance within last 24 hours
        const last24Hours = timestamp - (24 * 60 * 60 * 1000);
        const recentAttendance = classes[classIndex].attendance.some(a =>
            a.studentAddress.toLowerCase() === studentAddress.toLowerCase() &&
            a.timestamp > last24Hours
        );

        if (recentAttendance) {
            throw new Error('Student has already marked attendance in the last 24 hours');
        }

        // Normalize timestamp to milliseconds for consistency
        const normalizedTimestamp = timestamp < 1e12 ? timestamp * 1000 : timestamp;
        console.log('Processing attendance with timestamp:', {
            original: timestamp,
            normalized: normalizedTimestamp,
            date: new Date(normalizedTimestamp).toLocaleString('vi-VN')
        });

        const newAttendance = {
            studentAddress,
            timestamp: normalizedTimestamp,
            isPresent: true,
            recordedAt: Date.now() // Add actual recording time
        };

        if (!validateAttendanceRecord(newAttendance)) {
            throw new Error('Invalid attendance record format');
        }

        classes[classIndex].attendance.push(newAttendance);
        saveClasses(classes);
        console.log(`Attendance marked for student ${studentAddress} in class ${classId}`);
        return true;
    } catch (error) {
        console.error('Error adding attendance record:', error);
        throw error;
    }
}

export function getAttendanceRecords(classId, studentAddress) {
    try {
        if (!classId || !studentAddress) {
            throw new Error('Missing required parameters');
        }

        const classData = getClassById(classId);
        if (!classData) {
            throw new Error(`Class not found with id: ${classId}`);
        }

        if (!classData.attendance) {
            console.log(`No attendance records found for class ${classId}`);
            return [];
        }

        const records = classData.attendance.filter(a =>
            a.studentAddress.toLowerCase() === studentAddress.toLowerCase()
        );

        // Validate each record
        const validRecords = records.filter(record => {
            const isValid = validateAttendanceRecord(record);
            if (!isValid) {
                console.warn('Invalid attendance record found:', record);
            }
            return isValid;
        });

        // Sort by timestamp descending (most recent first)
        validRecords.sort((a, b) => b.timestamp - a.timestamp);
        return validRecords;
    } catch (error) {
        console.error('Error getting attendance records:', error);
        return [];
    }
}