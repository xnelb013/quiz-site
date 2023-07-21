import { useState, useEffect } from "react";
import { db } from "../../firebase.ts";
import { Avatar } from "flowbite-react";

const RankList = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await db.collection("users").orderBy("rankPoint", "desc").get();
      const users = querySnapshot.docs.map((doc) => doc.data());
      setUsers(users);
    };
    fetchUsers();
  }, []);

  console.log(users);
  return (
    <>
      <div>
        {" "}
        {users.map((user, index) => (
          <Avatar img={user.photoURL} rounded className="mt-10 text-3xl">
            {index + 1}등
            <div className="space-y-1 font-medium dark:text-white">
              <div>{user.name}</div>
              <div className="text-xl text-gray-500 dark:text-gray-400">Rank Point : {user.rankPoint}</div>
            </div>
          </Avatar>
        ))}
      </div>
    </>
  );
};

export default RankList;
