// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract AttendanceSystem {
    address public owner;

    struct Attendance {
        bool isPresent;
        uint256 timestamp;
    }

    struct Class {
        string name;
        address teacher;
        mapping(address => bool) students; // Mapping để kiểm tra sinh viên có trong lớp không
        mapping(address => mapping(uint256 => Attendance)) attendanceRecords;
        mapping(address => uint256) attendanceCount;
    }

    mapping(uint256 => Class) public classes;
    uint256 public classCount = 0;

    event ClassCreated(uint256 classId, string name, address teacher);
    event StudentAdded(uint256 classId, address student);
    event AttendanceMarked(uint256 classId, address indexed user, bool isPresent, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyTeacher(uint256 classId) {
        require(classId > 0 && classId <= classCount, "Invalid class ID");
        require(msg.sender == classes[classId].teacher, "Only teacher can modify this class");
        _;
    }

    function createClass(string memory _name) public {
        classCount++;
        classes[classCount].name = _name;
        classes[classCount].teacher = msg.sender;
        emit ClassCreated(classCount, _name, msg.sender);
    }

    function addStudent(uint256 _classId, address _student) public onlyTeacher(_classId) {
        classes[_classId].students[_student] = true;
        emit StudentAdded(_classId, _student);
    }

    function markAttendance(uint256 _classId, bool _isPresent) public {
        require(_classId > 0 && _classId <= classCount, "Invalid class ID");
        require(classes[_classId].students[msg.sender], "You are not registered in this class");
        require(classes[_classId].attendanceCount[msg.sender] < 100, "Too many attendance records");

        classes[_classId].attendanceRecords[msg.sender][classes[_classId].attendanceCount[msg.sender]] = Attendance(_isPresent, block.timestamp);
        classes[_classId].attendanceCount[msg.sender]++;

        emit AttendanceMarked(_classId, msg.sender, _isPresent, block.timestamp);
    }

    function getAttendanceCount(uint256 _classId, address _student) public view returns (uint256) {
        return classes[_classId].attendanceCount[_student];
    }

    function getAttendanceRecord(uint256 _classId, address _student, uint256 index) public view returns (bool, uint256) {
        require(index < classes[_classId].attendanceCount[_student], "Index out of bounds");
        Attendance storage record = classes[_classId].attendanceRecords[_student][index];
        return (record.isPresent, record.timestamp);
    }
    
    function isStudentInClass(uint256 _classId, address _student) public view returns (bool) {
        return classes[_classId].students[_student];
    }

    function getTotalClasses() public view returns (uint256) {
        return classCount;
    }
}
