const contractABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "classId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "isPresent",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "AttendanceMarked",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "classId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "teacher",
          "type": "address"
        }
      ],
      "name": "ClassCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "classId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "student",
          "type": "address"
        }
      ],
      "name": "StudentAdded",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "classCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "classes",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "teacher",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        }
      ],
      "name": "createClass",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_classId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_student",
          "type": "address"
        }
      ],
      "name": "addStudent",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_classId",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "_isPresent",
          "type": "bool"
        }
      ],
      "name": "markAttendance",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_classId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_student",
          "type": "address"
        }
      ],
      "name": "getAttendanceCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_classId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_student",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "getAttendanceRecord",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_classId",
          "type": "uint256"
        }
      ],
      "name": "getStudents",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "getTotalClasses",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    }
  ];
  const contractAddress = "0xbB6dfDc18B6CfA61DD75028aDb2687FF566BC2B5";

  let web3;
  let contract;
  let accounts;
  
  // Khi tài liệu HTML đã tải xong
  document.addEventListener("DOMContentLoaded", () => {
      document.getElementById("connectWallet")?.addEventListener("click", connectWallet);
      document.getElementById("createClass")?.addEventListener("click", createClass);
      document.getElementById("addStudent")?.addEventListener("click", addStudent);
      document.getElementById("markAttendance")?.addEventListener("click", markAttendance);
      document.getElementById("viewAttendance")?.addEventListener("click", viewAttendance);
  });
  
  async function connectWallet() {
      if (window.ethereum) {
          try {
              console.log("🔗 Kết nối MetaMask...");
              web3 = new Web3(window.ethereum);
              await window.ethereum.request({ method: "eth_requestAccounts" });
              accounts = await web3.eth.getAccounts();
              console.log("✅ Đã kết nối với tài khoản:", accounts[0]);
  
              document.getElementById("walletAddress").innerText = `🟢 Đã kết nối: ${accounts[0]}`;
              contract = new web3.eth.Contract(contractABI, contractAddress);
              console.log("📜 Hợp đồng đã tải:", contract);
  
              await loadClasses();
          } catch (error) {
              console.error("❌ Lỗi khi kết nối MetaMask:", error);
          }
      } else {
          alert("⚠️ Bạn cần cài MetaMask để sử dụng!");
      }
  }
  
  async function createClass() {
      const name = document.getElementById("className")?.value.trim();
      if (!name) return alert("⚠️ Vui lòng nhập tên lớp!");
      
      try {
          await contract.methods.createClass(name).send({ from: accounts[0] });
          alert("✅ Lớp học đã được tạo!");
          await loadClasses();
      } catch (error) {
          console.error("❌ Lỗi khi tạo lớp:", error);
      }
  }
  
  async function loadClasses() {
      const classList = document.getElementById("classList");
      const classListForAddingStudent = document.getElementById("classListForAddingStudent");
      
      if (!classList || !classListForAddingStudent) {
          console.error("❌ Không tìm thấy phần tử danh sách lớp!");
          return;
      }
      
      classList.innerHTML = "";
      classListForAddingStudent.innerHTML = "";
  
      try {
          const classCount = await contract.methods.classCount().call();
          for (let i = 1; i <= classCount; i++) {
              const classData = await contract.methods.classes(i).call();
              const option = new Option(`${classData.name} - GV: ${classData.teacher}`, i);
              classList.appendChild(option);
              classListForAddingStudent.appendChild(option.cloneNode(true));
          }
      } catch (error) {
          console.error("❌ Lỗi khi tải danh sách lớp:", error);
      }
  }
  
  async function addStudent() {
      const classId = document.getElementById("classListForAddingStudent")?.value;
      const studentAddress = document.getElementById("studentAddress")?.value.trim();
      if (!studentAddress) return alert("⚠️ Vui lòng nhập địa chỉ ví của học sinh!");
      
      try {
          await contract.methods.addStudent(classId, studentAddress).send({ from: accounts[0] });
          alert("✅ Học sinh đã được thêm vào lớp!");
      } catch (error) {
          console.error("❌ Lỗi khi thêm học sinh:", error);
      }
  }
  
  async function markAttendance() {
      const classId = document.getElementById("classList")?.value;
      if (!classId) return alert("⚠️ Vui lòng chọn lớp học!");
      
      try {
          await contract.methods.markAttendance(classId, true)
              .send({ from: accounts[0] })
              .on("receipt", () => alert("✅ Điểm danh thành công!"));
      } catch (error) {
          console.error("❌ Lỗi khi điểm danh:", error);
      }
  }
  
  async function viewAttendance() {
      try {
          const history = document.getElementById("attendanceHistory");
          history.innerHTML = "";
  
          const studentAddress = accounts[0];
          console.log("📌 Địa chỉ sinh viên:", studentAddress);
  
          if (!studentAddress) {
              alert("❌ Vui lòng kết nối MetaMask trước khi xem lịch sử điểm danh.");
              return;
          }
  
          const totalClasses = Number(await contract.methods.getTotalClasses().call());
          console.log("📌 Tổng số lớp:", totalClasses);
  
          for (let i = 1; i <= totalClasses; i++) {
              const attendanceCount = await contract.methods.getAttendanceCount(i, studentAddress).call();
              
              for (let j = 0; j < attendanceCount; j++) {
                  const record = await contract.methods.getAttendanceRecord(i, studentAddress, j).call();
                  const li = document.createElement("li");
                  li.innerText = `📚 Môn ${i}: ${record[0] ? "✅ Có mặt" : "❌ Vắng"} - ${new Date(Number(record[1]) * 1000).toLocaleString()}`;
                  history.appendChild(li);
              }
          }
      } catch (error) {
          console.error("❌ Lỗi khi xem lịch sử điểm danh:", error);
      }
  }


