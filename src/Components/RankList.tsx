import { useState, useEffect } from "react";
import { db, storage } from "../../firebase.ts";

interface User {
  uid: string;
  name: string;
  rankPoint: number;
  photoURL?: string;
}

const RankList = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await db.collection("users").orderBy("rankPoint", "desc").get();
      const users: User[] = querySnapshot.docs.map((doc) => doc.data() as User);
      for (const user of users) {
        const path = `images/${user.uid}`;
        const url = await storage.ref(path).getDownloadURL();
        user.photoURL = url;
      }
      setUsers(users);
    };
    fetchUsers();
  }, []);

  return (
    <>
      <div className="mt-40">
        <div className="text-6xl mx-auto mb-10">랭킹</div>
        <div className="mb-20">
          랭킹을 확인해보세요!
          <br />
          <br />한 문제를 풀 때마다 rankPoint가 10점씩 오릅니다.
        </div>
        {users.map((user, index) => (
          <>
            <div className="avatar flex justify-center align-center">
              <div
                className={`text-4xl font-black dark:text-white pt-6 mr-10 ${
                  index === 0 ? "text-yellow-300" : index === 1 ? "text-gray-400" : index === 2 ? "text-yellow-500" : ""
                }`}
              >
                {index + 1}등
              </div>
              <div className="w-24 h-24 rounded-xl">
                <img src={user.photoURL} />
              </div>
              <div className="text-left w-96 h-32 ml-10">
                <div className="text-3xl mb-2">{user.name}</div>
                <div className="text-xl">RankPoint : {user.rankPoint}</div>
              </div>
            </div>
            <div className="h-px w-full bg-blue-200 w-[700px] mx-auto mb-10"></div>
          </>
        ))}
      </div>
    </>
  );
};

export default RankList;
