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
            {startProcessLoad ? (
              <span className="dot-loading">
                <span className="dot one">●</span>
                <span className="dot two">●</span>
                <span className="dot three">●</span>
              </span>
            ) : (
              "บันทึก"
            )}
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
          user.user_id === selectedUser.user_id ? selectedUser : user
        )
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
      return user.role === USER_ROLE.CUSTOMER || user.role === USER_ROLE.FIELD_OWNER;
    return user.role === roleFilter;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);



  if (isLoading)
    return <LoadingSpinner mode="full" />;

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
                      {" "}
                      <button
                        className="edit-btn"
                        onClick={() => setSelectedUser(user)}
                      >
                        <img
                          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAANlJREFUSEu1ldENgzAMBd+brO0kLZu0k5ROUtiETVxZIlVIILKT4B8kBHdxbNnEycGT+WgSiMgTwAXAAuBFUp+bqBaIyBfANaIp/ENSpf+oEuzAA1AlA8kpvHALCvDAHEkOVQIDXLl1AiNcBXpFoysDB3wieXMVuQWuomKRW+FFQQ/4oaAXfFcgIg8Ab8OMygq6909WAxFRuEpKYYIfZZDOmFRkhtcIXHCvwA0vFfke3cu8zpds1hsaoW3huAVri8antzDSb+Z46WzatJNAt5pvmtak4RrXLYIfx95jGZW5DL4AAAAASUVORK5CYII="
                          alt=""
                        />
                      </button>
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => openDeleteUserModal(user.user_id)}
                      >
                        <img
                          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAR1JREFUSEvNlusRwiAQhG870U5MJ6YStRLTiXZiOjmzGXAQjofJMCO/HDzug7tlCaQwVPUgIhcRORths5sbAPjfSRgqgIeInEoxC3wGcMzF1ADKhQCSOHe6VzcAwaqa3YA/0bozVW0pRaVSyd9r6Tzgnmnkr0nD+CeAodiDPdm/ShQmUlVKkvLcMliWKVxoqYPK2ApIFGcB9jQ8uROtAN7U+FTW3NrYWoliRa2LIilbc8w7ARhrgKvzHx/3V4Db4irc4GdYPaBMWaYtJxhbZEr3pJK6AagW3oUtgGP8NpRsuA+AWb0NO0Kziqx3wzQ7VQ3togsgtAsPsKDhnPl05k4Q+1GLVSQ2wRLnAPFdaLHu5JKVAKXPFQuWeJAPegM03+AZ7kVVEgAAAABJRU5ErkJggg=="
                          alt=""
                        />
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
                  <img
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAX5JREFUSEu1lYFxwjAMRaVNYBLKJG0mASYpTFI6SdlE5BmJc5w4ca7gO45wSHqW9KWovPnom+NLE8DMvvwiOxHZiMiviNxE5KqqfFfPLMDMPkTkp/C+OgQQ59T/PtdAVYCZERgAAS/lbR3+6TZk0U1BJgFZcJzOcyVw0Lfb7EvICGBmRxE59HXGmNsvHjOjXGR8U9V97jAAuOGf17RbjJwZuBB2qjrwKwHp9qrapK6WC5QA0tyo6rbFucUmAbxRKIHyIDv03VT/HOJx6N9TUQFABTFMyWdtmYqZ4bJJUQEIFcTwNCvIK4Af2ceJKe+ePXAFkd7lH+VhMBm+pCTivEwtnklaK/ksvAyQzdCpVzlyf/SylJqZ0XCMZrdkxQ+hbHPfKUA0a7RXarrPFDS4fS2DUBT/L0J8RZA1e2g0oLVtihpwAsY2HZXMA8e6ZjAHS67ag2IygQADRE/48BzzEllWp75JRX5bgvLKBMIrc/F1OdmDlgW2xqYpgzUBS9s74QarGfJDD34AAAAASUVORK5CYII="
                    alt="refresh icon"
                    className="refresh-icon"
                  />
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
                      <img
                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAANlJREFUSEu1ldENgzAMBd+brO0kLZu0k5ROUtiETVxZIlVIILKT4B8kBHdxbNnEycGT+WgSiMgTwAXAAuBFUp+bqBaIyBfANaIp/ENSpf+oEuzAA1AlA8kpvHALCvDAHEkOVQIDXLl1AiNcBXpFoysDB3wieXMVuQWuomKRW+FFQQ/4oaAXfFcgIg8Ab8OMygq6909WAxFRuEpKYYIfZZDOmFRkhtcIXHCvwA0vFfke3cu8zpds1hsaoW3huAVri8antzDSb+Z46WzatJNAt5pvmtak4RrXLYIfx95jGZW5DL4AAAAASUVORK5CYII="
                        alt=""
                      />
                    </button>
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => openDeleteUserModal(user.user_id)}
                    >
                      <img
                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAR1JREFUSEvNlusRwiAQhG870U5MJ6YStRLTiXZiOjmzGXAQjofJMCO/HDzug7tlCaQwVPUgIhcRORths5sbAPjfSRgqgIeInEoxC3wGcMzF1ADKhQCSOHe6VzcAwaqa3YA/0bozVW0pRaVSyd9r6Tzgnmnkr0nD+CeAodiDPdm/ShQmUlVKkvLcMliWKVxoqYPK2ApIFGcB9jQ8uROtAN7U+FTW3NrYWoliRa2LIilbc8w7ARhrgKvzHx/3V4Db4irc4GdYPaBMWaYtJxhbZEr3pJK6AagW3oUtgGP8NpRsuA+AWb0NO0Kziqx3wzQ7VQ3togsgtAsPsKDhnPl05k4Q+1GLVSQ2wRLnAPFdaLHu5JKVAKXPFQuWeJAPegM03+AZ7kVVEgAAAABJRU5ErkJggg=="
                        alt=""
                      />
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
          containerClassName="pagination-container-manager"
          activeClassName="active-page-manager"
          dotsClassName="pagination-dots-manager"
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
