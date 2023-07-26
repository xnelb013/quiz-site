import { useEffect, useState } from "react";
import LoginPopup from "./LoginPopup";
import { getAuth, onAuthStateChanged, User, signOut } from "firebase/auth";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../ts/firebase";

interface Post {
  id: string;
  title: string;
  postId: string;
}

const Navibar = () => {
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
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
      }
    };
    fetchUserImage();
  }, [user]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchTerm) {
        // firestore에서 전체 문서 목록을 가져오기
        const postsRef = collection(db, "posts");
        const querySnapshot = await getDocs(postsRef);
        // 검색어가 title 필드에 포함된 문서만 필터링하기
        const filteredDocs = querySnapshot.docs.filter((doc) => doc.data().title.includes(searchTerm));
        setSearchResults(
          filteredDocs.map((doc) => ({
            id: doc.id,
            title: doc.data().title,
            postId: doc.data().postId,
          }))
        );
      } else {
        setSearchResults([]);
      }
    };
    fetchSearchResults();
  }, [searchTerm]); // 검색어가 변경될 때마다 실행

  const auth = getAuth();

  const logout = () => {
    signOut(auth).then(() => {
      // 로그아웃
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
      <div className="navbar bg-base-100 p-5 rounded-xl">
        <div className="flex-1">
          <Link to={"/"} className="btn btn-ghost normal-case text-3xl mr-5 text-blue-400">
            QuizSite
          </Link>
          <Link to={"/quizPage"} className="btn btn-ghost normal-case text-xl">
            멘사 퀴즈
          </Link>
          <Link to={"/rankList"} className="btn btn-ghost normal-case text-xl">
            랭킹
          </Link>
        </div>
        <div className="flex-none gap-2">
          <div className="form-control relative">
            {" "}
            <input
              type="text"
              placeholder="Search"
              className="input input-bordered w-24 md:w-auto mr-5"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <ul className="!fixed left-0 sm:!absolute sm:top-14 menu dropdown-content w-full sm:w-64 max-h-96 shadow rounded-box text-base-content overflow-auto bg-base-100 z-10">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <li key={result.id}>
                      <Link to={`/posts/${result.postId}`} className="dropdown-item">
                        {result.title}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="dropdown-item text-left">게시글이 없습니다</li>
                )}
              </ul>
            )}
          </div>
          {user ? (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-16 rounded-full">
                  {image ? (
                    <img src={image} alt="profile" />
                  ) : (
                    <img className="w-24 h-24 mr-4 object-cover" src="/noImage.png" alt="No Image" />
                  )}
                </div>
              </label>
              <ul
                tabIndex={0}
                className="mt-3 z-[1] p-2 shadow menu menu-md dropdown-content bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link to={`/profile/${userId}`} className="justify-between">
                    Profile
                  </Link>
                </li>
                <li onClick={logout}>
                  <a className="text-red-500">Logout</a>
                </li>
              </ul>
            </div>
          ) : (
            <button onClick={popupOpen} className="btn btn-outline">
              Login
            </button>
          )}
        </div>
      </div>
      {showLoginPopup && <LoginPopup onClose={popupClose} />}
    </>
  );
};

export default Navibar;
