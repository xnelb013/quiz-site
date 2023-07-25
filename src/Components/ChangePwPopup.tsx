import styled from "styled-components";
import { useEffect, useState } from "react";
import { getAuth, updatePassword } from "firebase/auth";

interface ChangePwPopupProps {
  showPopup: boolean;
  onClose: () => void;
}

const Div = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ChangePwPopup: React.FC<ChangePwPopupProps> = ({ showPopup, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  // 비밀번호 변경
  const handleChangePassword = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      try {
        await updatePassword(user, newPassword);
        onClose();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  // 팝업 관리
  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "visible";
    }
  }, [showPopup]);

  return (
    <>
      <Div id="large-modal" className={`${!showPopup && "hidden"}`}>
        <div className="relative w-full max-w-4xl max-h-full">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <div className="flex items-center justify-between p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-2xl font-medium text-gray-900 dark:text-white">비밀번호 변경</h3>
              <button
                type="button"
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                data-modal-hide="large-modal"
                onClick={onClose}
              >
                <svg
                  className="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && <p className="text-red-500">{error}</p>}
              <p>현재 비밀번호를 입력하세요.</p>
              <input
                className="input input-bordered w-full max-w-xs"
                type="password"
                value={currentPassword}
                placeholder="현재 비밀번호"
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <p>새로운 비밀번호를 입력하세요.</p>
              <input
                className="input input-bordered w-full max-w-xs"
                type="password"
                value={newPassword}
                placeholder="새 비밀번호"
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
              <button
                data-modal-hide="large-modal"
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onClick={handleChangePassword}
              >
                변경하기
              </button>
              <button
                data-modal-hide="large-modal"
                type="button"
                className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                onClick={onClose}
              >
                취소하기
              </button>
            </div>
          </div>
        </div>
      </Div>
    </>
  );
};

export default ChangePwPopup;
