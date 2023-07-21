import { useEffect, useState } from "react";
import LoginPopup from "./LoginPopup";
import { getAuth, onAuthStateChanged, User, signOut } from "firebase/auth";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { Link, useParams } from "react-router-dom";

const Navibar = () => {
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(user);
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  console.log(userId);
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserImage = async () => {
      if (user) {
        // Storage에서 이미지 다운로드 URL 가져오기
        const storage = getStorage();
        const storageRef = ref(storage, `images/${user.uid}`);
        const downloadURL = await getDownloadURL(storageRef);
        setImage(downloadURL);
        console.log(downloadURL);
      }
    };
    fetchUserImage();
  }, [user]);

  const auth = getAuth();

  const logout = () => {
    signOut(auth)
      .then(() => {
        // Sign-out successful.
      })
      .catch((error) => {
        // An error happened.
      });
  };

  const popupOpen = () => {
    setShowLoginPopup(true);
  };

  const popupClose = () => {
    setShowLoginPopup(false);
  };

  return (
    <>
      <div className="navbar bg-base-100 shadow-lg p-5 rounded-xl">
        <div className="flex-1">
          <Link to={"/"} className="btn btn-ghost normal-case text-xl">
            daisyUI
          </Link>
          <Link to={"/"} className="btn btn-ghost normal-case text-xl">
            수학 퀴즈
          </Link>
          <Link to={"/"} className="btn btn-ghost normal-case text-xl">
            멘사 퀴즈
          </Link>
          <Link to={"/rankList"} className="btn btn-ghost normal-case text-xl">
            랭킹
          </Link>
        </div>
        <div className="flex-none gap-2">
          <div className="form-control">
            <input type="text" placeholder="Search" className="input input-bordered w-24 md:w-auto" />
          </div>
          {user ? (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full">
                  {image ? <img src={image} alt="profile" /> : <img src="/아이유3.jpg" alt="profile" />}
                </div>
              </label>
              <ul
                tabIndex={0}
                className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link to={`/profile/${userId}`} className="justify-between">
                    Profile
                    <span className="badge">New</span>
                  </Link>
                </li>
                <li>
                  <a>Settings</a>
                </li>
                <li onClick={logout}>
                  <a>Logout</a>
                </li>
              </ul>
            </div>
          ) : (
            <button onClick={popupOpen}>Login</button>
          )}
        </div>
      </div>
      {showLoginPopup && <LoginPopup onClose={popupClose} />}
    </>
  );
};

export default Navibar;
