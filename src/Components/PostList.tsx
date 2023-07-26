import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Pagination from "./Pagination";

const StyledList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  margin: 0 auto;
  padding: 0;
`;

const StyledListItem = styled.li`
  margin: 20px;
  width: 250px;
  margin-right: 34px;
`;

interface Post {
  id: string;
  title: string;
  content: string;
  uid: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
  photoURL: string;
  imageURL: string;
  postId: string;
}

// 게시글 리스트 불러오기
const PostList = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(8);
  const navigate = useNavigate();

  const getTimeString = (post: Post) => {
    const createdAt = post.createdAt.toDate();
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    const diffInHours = diff / (1000 * 60 * 60);

    let timeString;
    if (diffInHours < 1) {
      const diffInMinutes = Math.round(diff / (1000 * 60));
      timeString = `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      timeString = `${Math.round(diffInHours)}시간 전`;
    } else {
      timeString = createdAt.toLocaleDateString();
    }

    return timeString;
  };

  // 게시글 작성버튼 클릭
  const handleClick = () => {
    if (!auth.currentUser) {
      alert("로그인을 해주세요");
    } else {
      navigate("/postEditor");
    }
  };

  // 게시글 게시 순서대로 정렬
  const fetchPosts = async () => {
    const snapshot = await db.collection("posts").orderBy("createdAt", "desc").get();
    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
    setPosts(posts);
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  // 게시글 클릭
  const handlePostClick = (post: Post) => {
    navigate(`/posts/${post.postId}`);
  };

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  return (
    <>
      <section className="py-6 sm:py-12 dark:bg-gray-800 dark:text-gray-100">
        <div className="container p-6 mx-auto space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold">멘사 퀴즈</h2>
            <p className="font-serif text-sm dark:text-gray-400">당신의 두뇌를 시험해보세요.</p>
          </div>
          <button className="btn btn-outline btn-info text-3xl" onClick={handleClick}>
            문제 내기
          </button>
        </div>
      </section>
      <div className="mx-auto w-[1280px]">
        <StyledList>
          {currentPosts.map((post) => (
            <StyledListItem key={post.id} onClick={() => handlePostClick(post)} className="cursor-pointer">
              <article className="flex flex-col dark:bg-gray-900">
                <a rel="noopener noreferrer" href="#" aria-label="Te nulla oportere reprimique his dolorum">
                  <img
                    alt=""
                    className="object-cover w-full h-52 dark:bg-gray-500"
                    src={post.imageURL && post.imageURL.length > 0 ? post.imageURL : "/noImage.png"}
                  />
                </a>
                <div className="flex flex-col flex-1 p-6">
                  <a rel="noopener noreferrer" href="#" aria-label="Te nulla oportere reprimique his dolorum"></a>
                  <div>
                    <h3 className="flex-1 py-2 text-lg font-semibold leadi h-[80px]">{post.title}</h3>
                  </div>
                  <div className="flex flex-wrap justify-between pt-3 space-x-2 text-xs dark:text-gray-400">
                    <span>{getTimeString(post)}</span>
                    <span>{post.displayName}</span>
                  </div>
                </div>
              </article>
            </StyledListItem>
          ))}
        </StyledList>
      </div>
      <Pagination
        totalPosts={posts.length}
        postsPerPage={postsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </>
  );
};

export default PostList;
