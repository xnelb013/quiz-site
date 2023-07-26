import { useEffect, useState } from "react";
import { db, storage } from "../../ts/firebase.ts";
import { auth } from "../../ts/firebase.ts";
import { Link } from "react-router-dom";

const ProfilePage = () => {
  // 상태 변수 정의
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [queryPost, setQueryPost] = useState(0);
  const [queryComment, setQueryComment] = useState(0);
  const [profileImageURL, setProfileImageURL] = useState<string | null>(null);

  // URL에서 uid 가져오기
  const uid = window.location.pathname.split("/")[2];

  // 현재 로그인한 사용자의 uid 가져오기
  const currentUid = auth.currentUser?.uid;

  // 컴포넌트가 마운트될 때 데이터 가져오기
  useEffect(() => {
    // Firestore에서 사용자 정보 가져오기
    db.collection("users")
      .doc(uid)
      .get()
      .then((doc) => {
        if (doc.exists) {
          setUser(doc.data());
        }
      });

    // Storage에서 프로필 이미지 URL 가져오기
    storage
      .ref(`images/${uid}`)
      .getDownloadURL()
      .then((url) => {
        setProfileImageURL(url);
      });

    // 작성한 게시글 수
    db.collection("posts")
      .where("uid", "==", uid)
      .get()
      .then((querySnapshot) => {
        setQueryPost(querySnapshot.size);
      });

    // 작성한 댓글 수
    db.collection("comments")
      .where("uid", "==", uid)
      .get()
      .then((querySnapshot) => {
        setQueryComment(querySnapshot.size);
      });
  }, [uid]);

  return (
    <>
      <div className="p-16">
        <div className="p-8 bg-white shadow mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="grid grid-cols-3 text-center order-last md:order-first mt-20 md:mt-0">
              <div>
                <p className="font-bold text-gray-700 text-xl">{user ? user.rankPoint : 0}</p>
                <p className="text-gray-400">RankPoint</p>
              </div>
              <div>
                <p className="font-bold text-gray-700 text-xl">{queryPost}</p>
                <p className="text-gray-400">Posts</p>
              </div>
              <div>
                <p className="font-bold text-gray-700 text-xl">{queryComment}</p>
                <p className="text-gray-400">Comments</p>
              </div>
            </div>
            <div className="relative">
              <div className="w-48 h-48 bg-indigo-100 mx-auto rounded-full shadow-2xl absolute inset-x-0 top-0 -mt-24 flex items-center justify-center text-indigo-500">
                {profileImageURL ? (
                  // 프로필 이미지가 있으면 표시
                  <img src={profileImageURL} alt="Profile" className="w-full h-full rounded-full" />
                ) : (
                  // 프로필 이미지가 없으면 기본 아이콘 표시
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>

            <div className="space-x-8 flex justify-between mt-32 md:mt-0 md:justify-center">
              {currentUid === uid && (
                <Link to={`/profileEdit/${uid}`}>
                  <button className="text-white py-4 px-4 uppercase rounded bg-blue-400 hover:bg-blue-500 shadow hover:shadow-lg font-medium transition transform hover:-translate-y-0.5">
                    수정하기
                  </button>
                </Link>
              )}
            </div>
          </div>

          <div className="mt-20 text-center border-b pb-12">
            {user && (
              <>
                <h1 className="text-4xl font-medium text-gray-700 mb-10">
                  {user.name} <span className="font-light text-gray-500">{user.gender}</span>
                </h1>
                <h2 className="text-xl">내 소개</h2>
                <p className="font-light text-gray-600 mt-3">{user.produce}</p>
              </>
            )}
          </div>

          <div className="mt-12 flex flex-col justify-center">
            {user && (
              <>
                <button className="text-indigo-500 py-2 px-4  font-medium mt-4">Show more</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
