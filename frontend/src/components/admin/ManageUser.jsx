"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/manager-user.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { useNotification } from "@/app/contexts/NotificationContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import apiClient from "@/lib/apiClient";
import { USER_STATUS, USER_ROLE } from "@/constants/status";

export default function AdminManager() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const router = useRouter();
  const { notify } = useNotification();
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  const { user, isLoading } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("all");
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
    }

    if (user?.status !== USER_STATUS.VERIFIED) {
      router.replace("/verification");
    }

    if (user?.role !== USER_ROLE.ADMIN) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  const fetchUsers = async () => {
    setDataLoading(true);
    if (user?.role !== USER_ROLE.ADMIN) return;
    try {
      const data = await apiClient.get("/users");
      setUsers(data);
    } catch (error) {
      if (error.status === 401) {
        setTimeout(() => {
          router.replace("/");
        }, 2000);
        return;
      }
      console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้", error);
      notify(error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้", "error");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const DeleteUserModal = ({ userId, onDelete, onClose }) => (
    <div className="confirm-modal-user">
      <div className="modal-content-user">
        <div
          style={{
            color: "#ef4444",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <p className="comfirm-message">คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?</p>
        <div className="modal-actions-user">
          <button
            className="confirmbtn-user"
            style={{
              cursor: startProcessLoad ? "not-allowed" : "pointer",
            }}
            disabled={startProcessLoad}
            onClick={() => onDelete(userId)}
          >
            {startProcessLoad ? <LoadingSpinner mode="dots" /> : "ยืนยันการลบ"}
          </button>
          <button
            className="cancelbtn-user"
            style={{
              cursor: startProcessLoad ? "not-allowed" : "pointer",
            }}
            disabled={startProcessLoad}
            onClick={onClose}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );

  const openDeleteUserModal = (userId) => {
    setUserIdToDelete(userId);
    setShowDeleteUserModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteUserModal(false);
  };

  const handleDelete = async (id) => {
    SetstartProcessLoad(true);
    try {
      await apiClient.delete(`/users/${id}`);

      setUsers(users.filter((user) => user.user_id !== id));
      notify("ผู้ใช้ถูกลบเรียบร้อย", "success");
    } catch (error) {
      notify(`${error.message}`, "error");
    } finally {
      closeDeleteModal();
      SetstartProcessLoad(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser.first_name.trim() || !selectedUser.last_name.trim()) {
      notify("ไม่สามารถใส่ชื่อหรือนามสกุลที่เป็นค่าว่างได้", "error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      await apiClient.put(`/users/${selectedUser.user_id}`, selectedUser);

      setUsers(
        users.map((user) =>
          user.user_id === selectedUser.user_id ? selectedUser : user,
        ),
      );
      notify("แก้ไขเรียบร้อย", "success");
      setSelectedUser(null);
    } catch (error) {
      notify(`${error.message}`, "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
  };

  const usersPerPage = 10;

  const filteredUsers = users.filter((user) => {
    if (roleFilter === "all")
      return (
        user.role === USER_ROLE.CUSTOMER || user.role === USER_ROLE.FIELD_OWNER
      );
    return user.role === roleFilter;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  if (isLoading) return <LoadingSpinner mode="full" />;

  return (
    <>
      <div className="admin-manager-container">
        <h3 className="Head">ผู้ดูแลระบบ</h3>
        <div className="table-wrapper">
          <table className="manager-table">
            <thead>
              <tr>
                <th>id</th>
                <th>รูป</th>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>สถานะบัญชี</th>
                <th>บทบาท</th>
                <th>แก้ไข</th>
                <th>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((user) => user.role === USER_ROLE.ADMIN)
                .map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.user_id}</td>
                    <td>
                      <img
                        className="user-profile-manager"
                        src={
                          user?.user_profile
                            ? user.user_profile
                            : "https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157542/qlementine-icons--user-24_zre8k9.png"
                        }
                      />
                    </td>
                    <td>
                      {user.first_name} {user.last_name}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`status-text-manager ${
                          user.status === USER_STATUS.PENDING
                            ? "pending"
                            : user.status === USER_STATUS.VERIFIED
                              ? "approved"
                              : "unknown"
                        }`}
                      >
                        {user.status || "ไม่ทราบสถานะ"}
                      </span>
                    </td>

                    <td>
                      {user.role === USER_ROLE.CUSTOMER
                        ? "ลูกค้า"
                        : user.role === USER_ROLE.FIELD_OWNER
                          ? "เจ้าของสนามกีฬา"
                          : user.role === USER_ROLE.ADMIN
                            ? "ผู้ดูแลระบบ"
                            : user.role}
                    </td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => setSelectedUser(user)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                        </svg>
                      </button>
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => openDeleteUserModal(user.user_id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="head-select-manager">
          <div className="head-refresh-manager">
            <h3 className="Head">ผู้ใช้ทั้งหมด</h3>
            <div className="refresh-btn-manager">
              <button
                onClick={fetchUsers}
                disabled={dataLoading}
                style={{ cursor: dataLoading ? "not-allowed" : "pointer" }}
              >
                {!dataLoading && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="refresh-icon"
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                  </svg>
                )}
                {dataLoading && <LoadingSpinner mode="inline" />}
              </button>
            </div>
          </div>
          <div className="filter-role-container">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value={USER_ROLE.CUSTOMER}>ลูกค้า</option>
              <option value={USER_ROLE.FIELD_OWNER}>เจ้าของสนามกีฬา</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="manager-table-user">
            <thead>
              <tr>
                <th>ID</th>
                <th>รูป</th>
                <th>ชื่อ-สกุล</th>
                <th>อีเมล</th>
                <th>สถานะบัญชี</th>
                <th>บทบาท</th>
                <th>แก้ไข</th>
                <th>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.user_id}</td>
                  <td>
                    {" "}
                    <img
                      className="user-profile-manager"
                      src={
                        user?.user_profile
                          ? user.user_profile
                          : "https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157542/qlementine-icons--user-24_zre8k9.png"
                      }
                    />
                  </td>
                  <td>
                    {user.first_name} {user.last_name}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className={`status-text-manager ${
                        user.status === USER_STATUS.PENDING
                          ? "pending"
                          : user.status === USER_STATUS.VERIFIED
                            ? "approved"
                            : "unknown"
                      }`}
                    >
                      {user.status || "ไม่ทราบสถานะ"}
                    </span>
                  </td>
                  <td>
                    {user.role === USER_ROLE.CUSTOMER
                      ? "ลูกค้า"
                      : user.role === USER_ROLE.FIELD_OWNER
                        ? "เจ้าของสนามกีฬา"
                        : user.role}
                  </td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => setSelectedUser(user)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                      </svg>
                    </button>
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => openDeleteUserModal(user.user_id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredUsers.length / usersPerPage)}
          onPageChange={setCurrentPage}
        />
        {selectedUser && (
          <div className="modal-manager">
            <div className="modal-content-manager">
              <h3 className="Head">แก้ไขข้อมูลผู้ใช้</h3>
              <form onSubmit={handleUpdateUser}>
                <img
                  className="user-profile-modal-manager"
                  src={
                    selectedUser?.user_profile
                      ? selectedUser.user_profile
                      : "https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157542/qlementine-icons--user-24_zre8k9.png"
                  }
                />
                <label>ชื่อ:</label>
                <input
                  type="text"
                  maxLength={50}
                  value={selectedUser?.first_name}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      first_name: e.target.value,
                    })
                  }
                />
                <label>นามสกุล:</label>
                <input
                  type="text"
                  maxLength={50}
                  value={selectedUser?.last_name}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      last_name: e.target.value,
                    })
                  }
                />
                <label>สถานะบัญชี:</label>
                <select
                  value={selectedUser?.status}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      status: e.target.value,
                    })
                  }
                >
                  <option value={USER_STATUS.PENDING}>รอยืนยัน</option>
                  <option value={USER_STATUS.VERIFIED}>ตรวจสอบแล้ว</option>
                </select>
                <label>บทบาท:</label>
                <select
                  value={selectedUser?.role}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      role: e.target.value,
                    })
                  }
                >
                  <option value={USER_ROLE.CUSTOMER}>ลูกค้า</option>
                  <option value={USER_ROLE.FIELD_OWNER}>เจ้าของสนามกีฬา</option>
                  <option value={USER_ROLE.ADMIN}>ผู้ดูแลระบบ</option>
                </select>

                <label>อีเมล:</label>
                <input
                  readOnly
                  type="email"
                  value={selectedUser?.email}
                  style={{ cursor: "not-allowed" }}
                />
                <div className="modal-buttons">
                  <button
                    type="submit"
                    className="save-btn-manager"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                  >
                    {startProcessLoad ? (
                      <LoadingSpinner mode="dots" />
                    ) : (
                      "บันทึก"
                    )}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn-manager"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    onClick={closeModal}
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteUserModal && (
          <DeleteUserModal
            userId={userIdToDelete}
            onDelete={handleDelete}
            onClose={closeDeleteModal}
          />
        )}
      </div>
    </>
  );
}
