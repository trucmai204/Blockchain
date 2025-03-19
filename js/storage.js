// Default class data
const defaultClasses = [
    {
        id: 1,
        name: 'Blockchain',
        teacher: null,
        students: [],
        attendance: []
    },
    {
        id: 2,
        name: 'Smart Contract',
        teacher: null,
        students: [],
        attendance: []
    },
    {
        id: 3,
        name: 'Web3',
        teacher: null,
        students: [],
        attendance: []
    }
];

// Storage keys
const STORAGE_KEYS = {
    PENDING_REGISTRATIONS: 'pendingRegistrations',
    APPROVED_STUDENTS: 'approvedStudents',
    CLASSES: 'classes'
};

export function initializeStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.PENDING_REGISTRATIONS)) {
        localStorage.setItem(STORAGE_KEYS.PENDING_REGISTRATIONS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPROVED_STUDENTS)) {
        localStorage.setItem(STORAGE_KEYS.APPROVED_STUDENTS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
        localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(defaultClasses));
    }
}

// Class Management Functions
export function getClasses() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]');
}

export function saveClasses(classes) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
}

export function getClassById(classId) {
    const classes = getClasses();
    return classes.find(c => c.id.toString() === classId.toString());
}

export function updateClass(updatedClass) {
    const classes = getClasses();
    const index = classes.findIndex(c => c.id === updatedClass.id);
    if (index !== -1) {
        classes[index] = updatedClass;
        saveClasses(classes);
    }
}

// Registration Management Functions
export function getPendingRegistrations() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_REGISTRATIONS) || '{}');
}

export function savePendingRegistrations(registrations) {
    localStorage.setItem(STORAGE_KEYS.PENDING_REGISTRATIONS, JSON.stringify(registrations));
}

export function addPendingRegistration(classId, studentAddress, className) {
    const registrations = getPendingRegistrations();
    if (!registrations[classId]) {
        registrations[classId] = [];
    }

    registrations[classId].push({
        studentAddress,
        className,
        timestamp: Date.now(),
        status: 'pending'
    });

    savePendingRegistrations(registrations);
}

export function updateRegistrationStatus(classId, studentAddress, status) {
    const registrations = getPendingRegistrations();
    const classRegistrations = registrations[classId] || [];
    const registrationIndex = classRegistrations.findIndex(
        r => r.studentAddress.toLowerCase() === studentAddress.toLowerCase()
    );

    if (registrationIndex !== -1) {
        classRegistrations[registrationIndex].status = status;
        registrations[classId] = classRegistrations;
        savePendingRegistrations(registrations);
    }
}

// Attendance Management Functions
export function addAttendanceRecord(classId, studentAddress, timestamp) {
    const classes = getClasses();
    const classIndex = classes.findIndex(c => c.id.toString() === classId.toString());

    if (classIndex !== -1) {
        if (!classes[classIndex].attendance) {
            classes[classIndex].attendance = [];
        }

        classes[classIndex].attendance.push({
            studentAddress,
            timestamp,
            isPresent: true
        });

        saveClasses(classes);
    }
}

export function getAttendanceRecords(classId, studentAddress) {
    const classData = getClassById(classId);
    if (!classData || !classData.attendance) return [];

    return classData.attendance.filter(a =>
        a.studentAddress.toLowerCase() === studentAddress.toLowerCase()
    );
}